package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

func generateShareCode() (string, error) {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// CreateShareCode godoc
// @Summary Create or get existing share code
// @Description Create a new 6-character share code for the authenticated user, or return existing one
// @Tags share-codes
// @Success 201 {object} ShareCodeResponse
// @Failure 500 {object} Error
// @Router /share-codes [post]
func CreateShareCode(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		var userUUID pgtype.UUID
		userUUID.Bytes = userID
		userUUID.Valid = true

		var existing db.ShareCode
		err := rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			var err error
			existing, err = q.GetShareCodeByUserId(r.Context(), userUUID)
			return err
		})
		if err == nil {
			w.Header().Set("Content-Type", "application/json")
			err = json.NewEncoder(w).Encode(dto.ShareCodeResponse{
				Code:      existing.ID,
				CreatedAt: existing.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
			})
			if err != nil {
				http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			}
			return
		}

		code, err := generateShareCode()
		if err != nil {
			http.Error(w, "Failed to generate share code", http.StatusInternalServerError)
			return
		}

		var sc db.ShareCode
		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			var err error
			sc, err = q.CreateShareCode(r.Context(), db.CreateShareCodeParams{
				ID:     code,
				UserID: userUUID,
			})
			return err
		})
		if err != nil {
			http.Error(w, "Failed to create share code", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(dto.ShareCodeResponse{
			Code:      sc.ID,
			CreatedAt: sc.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
		})
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	}
}

// GetMyShareCode godoc
// @Summary Get my share code
// @Description Get the authenticated user's share code
// @Tags share-codes
// @Success 200 {object} ShareCodeResponse
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /share-codes/my [get]
func GetMyShareCode(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		var userUUID pgtype.UUID
		userUUID.Bytes = userID
		userUUID.Valid = true

		var sc db.ShareCode
		err := rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			var err error
			sc, err = q.GetShareCodeByUserId(r.Context(), userUUID)
			return err
		})
		if err != nil {
			code, genErr := generateShareCode()
			if genErr != nil {
				http.Error(w, "Failed to generate share code", http.StatusInternalServerError)
				return
			}
			genErr = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
				var err error
				sc, err = q.CreateShareCode(r.Context(), db.CreateShareCodeParams{
					ID:     code,
					UserID: userUUID,
				})
				return err
			})
			if genErr != nil {
				http.Error(w, "Failed to create share code", http.StatusInternalServerError)
				return
			}
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(dto.ShareCodeResponse{
			Code:      sc.ID,
			CreatedAt: sc.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
		})
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	}
}

// GetShareCodeByCode godoc
// @Summary Get radar graph by share code
// @Description Get the full radar graph for a share code. Public endpoint, no auth required.
// @Tags share-codes
// @Param code path string true "Share code"
// @Success 200 {object} RadarGraphResponse
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /share-codes/{code} [get]
func GetShareCodeByCode(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		code := r.PathValue("code")
		if code == "" {
			http.Error(w, "Missing code parameter", http.StatusBadRequest)
			return
		}

		items, err := q.GetRadarGraphByShareCode(r.Context(), code)
		if err != nil {
			http.Error(w, "Share code not found", http.StatusNotFound)
			return
		}

		var username string
		if len(items) == 0 {
			shareCode, err := q.GetShareCodeByCode(r.Context(), code)
			if err != nil {
				http.Error(w, "Share code not found", http.StatusNotFound)
				return
			}
			user, err := q.GetUserID(r.Context(), shareCode.UserID)
			if err != nil {
				http.Error(w, "Share code not found", http.StatusNotFound)
				return
			}
			username = user.Username

			w.Header().Set("Content-Type", "application/json")
			err = json.NewEncoder(w).Encode(dto.RadarGraphResponse{
				Username: username,
				Radar:    []dto.RadarGraphItem{},
			})
			if err != nil {
				http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			}
			return
		}

		username = items[0].Username
		radar := make([]dto.RadarGraphItem, len(items))
		for i, item := range items {
			desc := ""
			if item.BlipContext != "" {
				var ctx map[string]interface{}
				if err := json.Unmarshal([]byte(item.BlipContext), &ctx); err == nil {
					if d, ok := ctx["description"].(string); ok {
						desc = d
					}
				}
			}
			iconURL := ""
			if item.IconUrl.Valid {
				iconURL = item.IconUrl.String
			}

			radar[i] = dto.RadarGraphItem{
				Name:         item.Name,
				QuadrantID:   item.QuadrantID,
				QuadrantName: item.QuadrantName,
				RingID:       item.RingID,
				RingName:     item.RingName,
				IconURL:      iconURL,
				Description:  desc,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(dto.RadarGraphResponse{
			Username: username,
			Radar:    radar,
		})
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	}
}

// DeleteShareCode godoc
// @Summary Delete a share code
// @Description Delete a share code by code value
// @Tags share-codes
// @Param code path string true "Share code"
// @Success 204
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /share-codes/{code} [delete]
func DeleteShareCode(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		code := r.PathValue("code")
		if code == "" {
			http.Error(w, "Missing code parameter", http.StatusBadRequest)
			return
		}

		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		err := rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			return q.DeleteShareCode(r.Context(), code)
		})
		if err != nil {
			http.Error(w, "Failed to delete share code", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
