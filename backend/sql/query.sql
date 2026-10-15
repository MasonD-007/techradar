
-- name: CreateTechnology :one
INSERT INTO technology (
    id,
    name,
    blip_id,
    quadrant_id,
    icon_url
)
VALUES ($1, $2, $3, $4, $5)
RETURNING id,
    name,
    blip_id,
    quadrant_id,
    icon_url,
    created_at,
    updated_at;

-- name: GetTechnologyID :one
SELECT
    id,
    name,
    blip_id,
    quadrant_id,
    icon_url,
    created_at,
    updated_at
FROM
    technology
WHERE
    id = $1;


-- name: GetTechnologyName :one
SELECT
    id,
    name,
    blip_id,
    quadrant_id,
    icon_url,
    created_at,
    updated_at
FROM
    technology
WHERE
    name = $1;

-- name: GetTechnologyQuad :many
SELECT
    id,
    name,
    blip_id,
    quadrant_id,
    icon_url,
    created_at,
    updated_at
FROM
    technology
WHERE
    quadrant_id = $1;

-- name: GetAllTechnologies :many
SELECT
    id,
    name,
    blip_id,
    quadrant_id,
    icon_url,
    created_at,
    updated_at
FROM
    technology
ORDER BY name;

-- name: UpdateTechnology :one
UPDATE technology
SET name = $2,
    blip_id = $3,
    quadrant_id = $4,
    icon_url = $5,
    updated_at = NOW()
WHERE
    id = $1
RETURNING id,
    name,
    blip_id,
    quadrant_id,
    icon_url,
    created_at,
    updated_at;

-- name: DeleteTechnology :exec
DELETE FROM technology
WHERE
    id = $1;

-- name: CreateBlip :one
INSERT INTO blips (
    context
)
VALUES ($1)
RETURNING id,
    context::text,
    created_at,
    updated_at;

-- name: GetBlip :one
SELECT
    id,
    context::text,
    created_at,
    updated_at
FROM
    blips
WHERE
    id = $1;

-- name: UpdateBlip :one
UPDATE blips
SET context = $2,
    updated_at = NOW()
WHERE
    id = $1
RETURNING id,
    context::text,
    created_at,
    updated_at;

-- name: DeleteBlip :exec
DELETE FROM blips
WHERE
    id = $1;

-- name: GetAllBlips :many
SELECT
    id,
    context::text,
    created_at,
    updated_at
FROM
    blips
ORDER BY id;

-- name: CreateUser :one
INSERT INTO users (
    id,
    name,
    email,
    username,
    hashed_password,
    role,
    is_admin,
    last_logged_in
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id,
    name,
    email,
    username,
    hashed_password,
    role,
    is_admin,
    created_at,
    last_logged_in;

-- name: GetUserID :one
SELECT
    id,
    name,
    email,
    username,
    hashed_password,
    role,
    is_admin,
    created_at,
    last_logged_in
FROM
    users
WHERE
    id = $1;

-- name: GetUserEmail :one
SELECT
    id,
    name,
    email,
    username,
    hashed_password,
    role,
    is_admin,
    created_at,
    last_logged_in
FROM
    users
WHERE
    email = $1;

-- name: GetAllUsers :many
SELECT
    id,
    name,
    email,
    username,
    hashed_password,
    role,
    is_admin,
    created_at,
    last_logged_in
FROM
    users
ORDER BY name;

-- name: UpdateUser :one
UPDATE users
SET name = $2,
    email = $3,
    username = $4,
    hashed_password = $5,
    role = $6,
    is_admin = $7,
    last_logged_in = $8
WHERE
    id = $1
RETURNING id,
    name,
    email,
    username,
    hashed_password,
    role,
    is_admin,
    created_at,
    last_logged_in;

-- name: UpdateUserLastLogin :exec
UPDATE users
SET last_logged_in = $2
WHERE
    id = $1;

-- name: DeleteUser :exec
DELETE FROM users
WHERE
    id = $1;

-- name: CreateUserTechnology :one
INSERT INTO user_technologies (
    id,
    user_id,
    technology_id,
    ring_id
)
VALUES ($1, $2, $3, $4)
RETURNING id,
    user_id,
    technology_id,
    ring_id,
    created_at,
    updated_at;

-- name: GetUserTechnologyID :one
SELECT
    id,
    user_id,
    technology_id,
    ring_id,
    created_at,
    updated_at
FROM
    user_technologies
WHERE
    id = $1;

-- name: GetUserTechnologyUserId :many
SELECT
    id,
    user_id,
    technology_id,
    ring_id,
    created_at,
    updated_at
FROM
    user_technologies
WHERE
    user_id = $1;

-- name: UpdateUserTechnology :one
UPDATE user_technologies
SET user_id = $2,
    technology_id = $3,
    ring_id = $4,
    updated_at = NOW()
WHERE
    id = $1
RETURNING id,
    user_id,
    technology_id,
    ring_id,
    created_at,
    updated_at;

-- name: DeleteUserTechnology :exec
DELETE FROM user_technologies
WHERE
    id = $1;

-- name: CreateShareCode :one
INSERT INTO share_codes (
    id,
    user_id
)
VALUES ($1, $2)
RETURNING id,
    user_id,
    created_at,
    visibility,
    listed;

-- name: GetShareCodeByCode :one
SELECT
    id,
    user_id,
    created_at,
    visibility,
    listed
FROM
    share_codes
WHERE
    id = $1;

-- name: GetShareCodeByUserId :one
SELECT
    id,
    user_id,
    created_at,
    visibility,
    listed
FROM
    share_codes
WHERE
    user_id = $1;

-- name: DeleteShareCode :exec
DELETE FROM share_codes
WHERE
    id = $1;

-- name: GetRadarGraphByShareCode :many
SELECT
    u.username,
    t.id AS technology_id,
    t.name,
    t.quadrant_id,
    t.icon_url,
    r.name as ring_name,
    q.name as quadrant_name,
    ut.ring_id,
    b.context::text as blip_context
FROM
    share_codes sc
    JOIN users u ON u.id = sc.user_id
    JOIN user_technologies ut ON ut.user_id = sc.user_id
    JOIN technology t ON t.id = ut.technology_id
    JOIN rings r ON r.id = ut.ring_id
    JOIN quadrants q ON q.id = t.quadrant_id
    JOIN blips b ON b.id = t.blip_id
WHERE
    sc.id = $1;

-- name: SetShareCodeVisibility :one
UPDATE share_codes
SET visibility = $2,
    listed = (listed AND $2::text = 'public')
WHERE user_id = $1
RETURNING id, user_id, created_at, visibility, listed;

-- name: CanViewShareCode :one
SELECT EXISTS (
    SELECT 1
    FROM share_codes sc
    WHERE sc.id = sqlc.arg(code)::text
      AND (
        sc.visibility = 'public'
        OR sqlc.arg(is_admin)::boolean
        OR sc.user_id = sqlc.narg(viewer_id)::uuid
        OR EXISTS (
            SELECT 1
            FROM share_code_viewers v
            WHERE v.share_code_id = sc.id
              AND v.user_id = sqlc.narg(viewer_id)::uuid
        )
      )
) AS allowed;

-- name: AddShareCodeViewer :exec
INSERT INTO share_code_viewers (share_code_id, user_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: RemoveShareCodeViewer :exec
DELETE FROM share_code_viewers
WHERE share_code_id = $1
  AND user_id = $2;

-- name: ListShareCodeViewers :many
SELECT u.username
FROM share_code_viewers v
    JOIN users u ON u.id = v.user_id
WHERE v.share_code_id = $1
ORDER BY u.username;

-- name: GetUserByUsername :one
SELECT
    id,
    name,
    email,
    username,
    hashed_password,
    role,
    is_admin,
    created_at,
    last_logged_in
FROM
    users
WHERE
    username = $1;

-- name: SetShareCodeListed :one
UPDATE share_codes
SET listed = $2
WHERE user_id = $1
RETURNING id, user_id, created_at, visibility, listed;

-- name: ListGalleryRadars :many
SELECT
    sc.id AS code,
    u.username,
    COUNT(ut.id)::int AS blip_count,
    MAX(ut.updated_at)::timestamptz AS updated_at
FROM share_codes sc
    JOIN users u ON u.id = sc.user_id
    JOIN user_technologies ut ON ut.user_id = sc.user_id
WHERE sc.visibility = 'public'
  AND sc.listed
  AND (
    sqlc.narg(quadrant)::int IS NULL
    OR EXISTS (
        SELECT 1
        FROM user_technologies x
            JOIN technology tx ON tx.id = x.technology_id
        WHERE x.user_id = sc.user_id
          AND tx.quadrant_id = sqlc.narg(quadrant)::int
    )
  )
  AND (
    sqlc.narg(search)::text IS NULL
    OR u.username ILIKE '%' || sqlc.narg(search)::text || '%' ESCAPE '\'
    OR EXISTS (
        SELECT 1
        FROM user_technologies x
            JOIN technology tx ON tx.id = x.technology_id
        WHERE x.user_id = sc.user_id
          AND tx.name ILIKE '%' || sqlc.narg(search)::text || '%' ESCAPE '\'
    )
  )
GROUP BY sc.id, u.username
ORDER BY MAX(ut.updated_at) DESC, sc.id
LIMIT sqlc.arg(page_limit)::int OFFSET sqlc.arg(page_offset)::int;

-- name: ListGalleryTopTechnologies :many
SELECT
    sc.id AS code,
    t.name,
    ut.ring_id
FROM share_codes sc
    JOIN user_technologies ut ON ut.user_id = sc.user_id
    JOIN technology t ON t.id = ut.technology_id
WHERE sc.id = ANY(sqlc.arg(codes)::text[])
  AND sc.visibility = 'public'
  AND sc.listed
ORDER BY sc.id, ut.ring_id, t.name;

-- name: ListTemplates :many
SELECT
    tp.id,
    tp.slug,
    tp.name,
    tp.description,
    COUNT(tt.technology_id)::int AS technology_count
FROM templates tp
    LEFT JOIN template_technologies tt ON tt.template_id = tp.id
GROUP BY tp.id
ORDER BY tp.name;

-- name: GetTemplateBySlug :one
SELECT id, slug, name, description, created_at
FROM templates
WHERE slug = $1;

-- name: ListTemplateItems :many
SELECT
    t.id AS technology_id,
    t.name,
    t.quadrant_id,
    t.icon_url,
    r.name AS ring_name,
    q.name AS quadrant_name,
    tt.ring_id,
    b.context::text AS blip_context
FROM template_technologies tt
    JOIN technology t ON t.id = tt.technology_id
    JOIN rings r ON r.id = tt.ring_id
    JOIN quadrants q ON q.id = t.quadrant_id
    JOIN blips b ON b.id = t.blip_id
WHERE tt.template_id = $1
ORDER BY tt.ring_id, t.name;

-- name: CreateTemplate :one
INSERT INTO templates (slug, name, description)
VALUES ($1, $2, $3)
RETURNING id, slug, name, description, created_at;

-- name: UpdateTemplate :one
UPDATE templates
SET name = $2, description = $3
WHERE slug = $1
RETURNING id, slug, name, description, created_at;

-- name: DeleteTemplate :execrows
DELETE FROM templates WHERE slug = $1;

-- name: DeleteTemplateItems :exec
DELETE FROM template_technologies WHERE template_id = $1;

-- name: AddTemplateItem :exec
INSERT INTO template_technologies (template_id, technology_id, ring_id)
VALUES ($1, $2, $3)
ON CONFLICT (template_id, technology_id) DO UPDATE SET ring_id = EXCLUDED.ring_id;

-- name: InsertTemplateIfMissing :one
INSERT INTO templates (slug, name, description)
VALUES ($1, $2, $3)
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- name: GetRingByName :one
SELECT id, name FROM rings WHERE name = $1;

-- name: AddUserTechnologyIfMissing :execrows
INSERT INTO user_technologies (id, user_id, technology_id, ring_id)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, technology_id) DO NOTHING;
