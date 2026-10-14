package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ownShareCode returns the caller's share code, creating it if missing.
func ownShareCode(ctx context.Context, rls RLSExecutor, userID uuid.UUID, role string) (db.ShareCode, error) {
	uid := pgtype.UUID{Bytes: userID, Valid: true}

	var sc db.ShareCode
	err := rls.Execute(ctx, userID.String(), role, func(q Querier) error {
		var err error
		sc, err = q.GetShareCodeByUserId(ctx, uid)
		return err
	})
	if err == nil {
		return sc, nil
	}

	code, err := generateShareCode()
	if err != nil {
		return db.ShareCode{}, err
	}
	err = rls.Execute(ctx, userID.String(), role, func(q Querier) error {
		var err error
		sc, err = q.CreateShareCode(ctx, db.CreateShareCodeParams{ID: code, UserID: uid})
		return err
	})
	return sc, err
}

func writeShareJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// SetShareVisibility godoc
// @Summary Set share code visibility
// @Description Set the authenticated user's radar to public (anyone with the link) or private (only listed viewers)
// @Tags share-codes
// @Accept json
// @Produce json
// @Param request body SetVisibilityRequest true "Visibility"
// @Success 200 {object} ShareCodeResponse
// @Failure 400 {object} Error
// @Failure 401 {object} Error
// @Failure 500 {object} Error
// @Router /share-codes/my [patch]
func SetShareVisibility(rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		var req dto.SetVisibilityRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if req.Visibility != "public" && req.Visibility != "private" {
			http.Error(w, "Visibility must be 'public' or 'private'", http.StatusBadRequest)
			return
		}

		sc, err := ownShareCode(r.Context(), rls, userID, role)
		if err != nil {
			http.Error(w, "Failed to load share code", http.StatusInternalServerError)
			return
		}

		var updated db.ShareCode
		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			var err error
			updated, err = q.SetShareCodeVisibility(r.Context(), db.SetShareCodeVisibilityParams{
				UserID:     sc.UserID,
				Visibility: req.Visibility,
			})
			return err
		})
		if err != nil {
			http.Error(w, "Failed to update visibility", http.StatusInternalServerError)
			return
		}

		writeShareJSON(w, http.StatusOK, toShareCodeResponse(updated))
	}
}

// ListShareViewers godoc
// @Summary List private-radar viewers
// @Description List the usernames allowed to view the authenticated user's private radar
// @Tags share-codes
// @Produce json
// @Success 200 {object} ShareViewersResponse
// @Failure 401 {object} Error
// @Failure 500 {object} Error
// @Router /share-codes/my/viewers [get]
func ListShareViewers(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		sc, err := ownShareCode(r.Context(), rls, userID, role)
		if err != nil {
			http.Error(w, "Failed to load share code", http.StatusInternalServerError)
			return
		}

		viewers, err := q.ListShareCodeViewers(r.Context(), sc.ID)
		if err != nil {
			http.Error(w, "Failed to list viewers", http.StatusInternalServerError)
			return
		}
		if viewers == nil {
			viewers = []string{}
		}

		writeShareJSON(w, http.StatusOK, dto.ShareViewersResponse{Viewers: viewers})
	}
}

// AddShareViewer godoc
// @Summary Allow a user to view my private radar
// @Description Add a viewer by username. Adding an existing viewer succeeds.
// @Tags share-codes
// @Accept json
// @Param request body AddViewerRequest true "Viewer"
// @Success 204
// @Failure 400 {object} Error
// @Failure 401 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /share-codes/my/viewers [post]
func AddShareViewer(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		var req dto.AddViewerRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		username := strings.TrimSpace(req.Username)
		if username == "" {
			http.Error(w, "Username is required", http.StatusBadRequest)
			return
		}

		viewer, err := q.GetUserByUsername(r.Context(), username)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				http.Error(w, "User not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Failed to look up user", http.StatusInternalServerError)
			return
		}
		if viewer.ID.Bytes == userID {
			http.Error(w, "You cannot add yourself as a viewer", http.StatusBadRequest)
			return
		}

		sc, err := ownShareCode(r.Context(), rls, userID, role)
		if err != nil {
			http.Error(w, "Failed to load share code", http.StatusInternalServerError)
			return
		}

		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			return q.AddShareCodeViewer(r.Context(), db.AddShareCodeViewerParams{
				ShareCodeID: sc.ID,
				UserID:      viewer.ID,
			})
		})
		if err != nil {
			http.Error(w, "Failed to add viewer", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// RemoveShareViewer godoc
// @Summary Remove a viewer from my private radar
// @Tags share-codes
// @Param username path string true "Username"
// @Success 204
// @Failure 401 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /share-codes/my/viewers/{username} [delete]
func RemoveShareViewer(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		username := strings.TrimSpace(r.PathValue("username"))
		viewer, err := q.GetUserByUsername(r.Context(), username)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				http.Error(w, "User not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Failed to look up user", http.StatusInternalServerError)
			return
		}

		sc, err := ownShareCode(r.Context(), rls, userID, role)
		if err != nil {
			http.Error(w, "Failed to load share code", http.StatusInternalServerError)
			return
		}

		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			return q.RemoveShareCodeViewer(r.Context(), db.RemoveShareCodeViewerParams{
				ShareCodeID: sc.ID,
				UserID:      viewer.ID,
			})
		})
		if err != nil {
			http.Error(w, "Failed to remove viewer", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
