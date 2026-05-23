# TechRadar Secret Rotation Runbook (k3s + ArgoCD + SealedSecrets)

This runbook documents how to rotate Postgres credentials and backend JWT secret safely in a GitOps workflow.

## Why this flow

- Secrets in Git must be encrypted (`SealedSecret`), never plaintext `Secret`.
- Postgres on a persisted volume does not re-apply `POSTGRES_PASSWORD` automatically after initial init.
- Rotating `JWT_SECRET` invalidates existing user sessions/tokens immediately.

---

## Prerequisites

- `kubectl` configured for the target cluster.
- `kubeseal` installed.
- Sealed Secrets controller running as:
  - namespace: `kube-system`
  - name: `sealed-secrets`
- ArgoCD app manages `k3s/` path.
- Target namespace: `techradar`.

Alternative (offline sealing):
- A Sealed Secrets public cert file (for example `~/.cert/cert.pem`) and use `kubeseal --cert <path>`.

---

## Files involved

- Postgres sealed secret: `k3s/base/sealed-postgres-secret.yaml`
- Backend sealed secret: `k3s/apps/backend/sealed-secret.yaml`
- Postgres workload: `k3s/apps/postgres/statefulset.yaml`
- Backend workload: `k3s/apps/backend/deployment.yaml`

---

## 1) Generate fresh credentials

Use hex values for URL-safe credentials.

```bash
PG_USER="$(openssl rand -hex 16)"
PG_PASS="$(openssl rand -hex 32)"
JWT_SECRET="$(openssl rand -hex 32)"

PG_HOST="postgres.techradar.svc.cluster.local"
PG_DB="techradar"
DATABASE_URL="postgres://${PG_USER}:${PG_PASS}@${PG_HOST}:5432/${PG_DB}?sslmode=disable"

# sanity check (do not paste into logs/chat histories)
echo "$DATABASE_URL"
```

---

## 2) Generate and seal Postgres secret

Expected Kubernetes secret name is `postgres-secret`.

Online mode (cluster reachable):

```bash
kubectl create secret generic postgres-secret \
  --namespace=techradar \
  --from-literal=POSTGRES_USER="${PG_USER}" \
  --from-literal=POSTGRES_PASSWORD="${PG_PASS}" \
  --from-literal=POSTGRES_DB="${PG_DB}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --controller-namespace=kube-system \
      --controller-name=sealed-secrets \
      --format=yaml \
      > k3s/base/sealed-postgres-secret.yaml
```

Offline mode (cluster not reachable):

```bash
kubectl create secret generic postgres-secret \
  --namespace=techradar \
  --from-literal=POSTGRES_USER="${PG_USER}" \
  --from-literal=POSTGRES_PASSWORD="${PG_PASS}" \
  --from-literal=POSTGRES_DB="${PG_DB}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --cert /path/to/sealed-secrets-public-cert.pem \
      --format=yaml \
      > k3s/base/sealed-postgres-secret.yaml
```

---

## 3) Generate and seal backend secret

`backend-secrets` must contain both keys each time (full replacement object):
- `DATABASE_URL`
- `JWT_SECRET`

```bash
kubectl create secret generic backend-secrets \
  --namespace=techradar \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --controller-namespace=kube-system \
      --controller-name=sealed-secrets \
      --format=yaml \
      > k3s/apps/backend/sealed-secret.yaml
```

Offline mode (cluster not reachable):

```bash
kubectl create secret generic backend-secrets \
  --namespace=techradar \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --dry-run=client -o yaml \
  | kubeseal \
      --cert /path/to/sealed-secrets-public-cert.pem \
      --format=yaml \
      > k3s/apps/backend/sealed-secret.yaml
```

---

## 4) Rotate live Postgres password (required with existing PVC)

Because Postgres skips init on existing data dirs, update the user in-place:

```bash
kubectl exec -n techradar postgres-0 -- \
  psql -U techradar -d postgres \
  -c "ALTER USER techradar WITH PASSWORD '${PG_PASS}';"
```

If username also changes, rename user explicitly before restarting apps.

---

## 5) Restart workloads to pick up new secrets

```bash
kubectl rollout restart statefulset/postgres -n techradar
kubectl rollout restart deployment/backend -n techradar

kubectl rollout status statefulset/postgres -n techradar
kubectl rollout status deployment/backend -n techradar
```

---

## 6) Verify

- ArgoCD app status is `Synced` and `Healthy` (or at least backend recovers from prior degraded state).
- Backend can connect to Postgres.
- New logins work (old JWT tokens should fail after JWT rotation).

Optional checks:

```bash
kubectl get sealedsecret -n techradar
kubectl get secret postgres-secret -n techradar
kubectl get secret backend-secrets -n techradar
```

---

## 7) Cleanup plaintext artifacts (if any)

Do not keep plaintext secrets in repo or temp files.

```bash
rm -f plain-secret.yaml plain-postgres-secret.yaml plain-backend-secret.yaml
```

Then confirm what will be committed:

```bash
git status --short
```

Only sealed manifests should be committed.

---

## Notes and pitfalls

- `SealedSecret` scope defaults to strict (name+namespace bound). Keep names/namespaces exact.
- Wrong namespace in sealed output means decryption will not produce the expected secret for workloads.
- `DATABASE_URL` with hex user/pass is URL-safe and avoids escaping issues.
- Rotating `JWT_SECRET` forces re-authentication for all users (expected).
