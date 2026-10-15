package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func toShareCodeResponse(sc db.ShareCode) dto.ShareCodeResponse {
	return dto.ShareCodeResponse{
		Code:       sc.ID,
		CreatedAt:  sc.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
		Visibility: sc.Visibility,
		Listed:     sc.Listed,
	}
}

// graphItem builds a radar item from the columns shared by the share-code and
// template graph queries.
func graphItem(technologyID pgtype.UUID, name string, quadrantID int32, quadrantName string, ringID int32, ringName string, iconURL pgtype.Text, blipContext string) dto.RadarGraphItem {
	desc := ""
	if blipContext != "" {
		var ctx map[string]interface{}
		if err := json.Unmarshal([]byte(blipContext), &ctx); err == nil {
			if d, ok := ctx["description"].(string); ok {
				desc = d
			}
		}
	}
	icon := ""
	if iconURL.Valid {
		icon = iconURL.String
	}
	id := ""
	if technologyID.Valid {
		id = uuid.UUID(technologyID.Bytes).String()
	}
	return dto.RadarGraphItem{
		TechnologyID: id,
		Name:         name,
		QuadrantID:   quadrantID,
		QuadrantName: quadrantName,
		RingID:       ringID,
		RingName:     ringName,
		IconURL:      icon,
		Description:  desc,
	}
}

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
			err = json.NewEncoder(w).Encode(toShareCodeResponse(existing))
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
		err = json.NewEncoder(w).Encode(toShareCodeResponse(sc))
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
		err = json.NewEncoder(w).Encode(toShareCodeResponse(sc))
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	}
}

// GetShareCodeByCode godoc
// @Summary Get radar graph by share code
// @Description Get the full radar graph for a share code. Public radars need no auth; private radars require a bearer token for an allowed user.
// @Tags share-codes
// @Param code path string true "Share code"
// @Success 200 {object} RadarGraphResponse
// @Failure 401 {object} Error
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

		var viewerID pgtype.UUID
		uid, loggedIn := GetUserIDFromRequest(r)
		if loggedIn {
			viewerID = pgtype.UUID{Bytes: uid, Valid: true}
		}
		role, _ := GetRoleFromRequest(r)

		allowed, err := q.CanViewShareCode(r.Context(), db.CanViewShareCodeParams{
			Code:     code,
			IsAdmin:  role == "admin",
			ViewerID: viewerID,
		})
		if err != nil {
			http.Error(w, "Failed to check share code access", http.StatusInternalServerError)
			return
		}
		if !allowed {
			if !loggedIn {
				http.Error(w, "Authentication required", http.StatusUnauthorized)
				return
			}
			http.Error(w, "Share code not found", http.StatusNotFound)
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
			radar[i] = graphItem(item.TechnologyID, item.Name, item.QuadrantID, item.QuadrantName, item.RingID, item.RingName, item.IconUrl, item.BlipContext)
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
// @Failure 404 {object} Error
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

		// RLS is bypassed by the database role, so check ownership here. Respond
		// 404 for both missing and foreign codes so existence is not revealed.
		sc, err := q.GetShareCodeByCode(r.Context(), code)
		if err != nil || !isOwnerOrAdmin(r, userID, sc.UserID) {
			http.Error(w, "Share code not found", http.StatusNotFound)
			return
		}

		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			return q.DeleteShareCode(r.Context(), code)
		})
		if err != nil {
			http.Error(w, "Failed to delete share code", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
