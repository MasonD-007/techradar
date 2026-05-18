package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/MasonD-007/template/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/MasonD-007/template/backend/internal/uuidutil"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	ErrOwnership = "You do not have permission to access this resource"
	ErrNotFound = "User technology not found"
)

func GetUserTechnology(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}

		id, err := uuidutil.Parse(idStr)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		userID, _ := GetUserIDFromRequest(r)
		role, _ := GetRoleFromRequest(r)

		var ut db.UserTechnology
		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			ut, err = q.GetUserTechnologyID(r.Context(), id)
			return err
		})
		if err != nil {
			http.Error(w, ErrNotFound, http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(ut)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

func GetUserTechnologiesByUser(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userIDStr := r.PathValue("user_id")
		if userIDStr == "" {
			http.Error(w, "Missing user_id parameter", http.StatusBadRequest)
			return
		}

		userID, err := uuidutil.Parse(userIDStr)
		if err != nil {
			http.Error(w, "Invalid user_id", http.StatusBadRequest)
			return
		}

		authUserID, _ := GetUserIDFromRequest(r)
		role, _ := GetRoleFromRequest(r)

		var uts []db.UserTechnology
		err = rls.Execute(r.Context(), authUserID.String(), role, func(q Querier) error {
			uts, err = q.GetUserTechnologyUserId(r.Context(), userID)
			return err
		})
		if err != nil {
			http.Error(w, "Failed to fetch user technologies", http.StatusInternalServerError)
			return
		}

		if uts == nil {
			uts = []db.UserTechnology{}
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(uts)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

func CreateUserTechnology(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params dto.CreateUserTechnologyRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		params.ID = uuidutil.New()

		userID, _ := GetUserIDFromRequest(r)
		role, _ := GetRoleFromRequest(r)

		var ut db.UserTechnology
		var err error
		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			ut, err = q.CreateUserTechnology(r.Context(), db.CreateUserTechnologyParams{
				ID:           params.ID,
				UserID:       params.UserID,
				TechnologyID: params.TechnologyID,
				RingID:       params.RingID,
			})
			return err
		})
		if err != nil {
			http.Error(w, "Failed to create user technology", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(ut)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

func DeleteUserTechnology(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}

		id, err := uuidutil.Parse(idStr)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		userID, _ := GetUserIDFromRequest(r)
		role, _ := GetRoleFromRequest(r)

		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			return q.DeleteUserTechnology(r.Context(), id)
		})
		if err != nil {
			http.Error(w, "Failed to delete user technology", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func UpdateUserTechnology(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}

		id, err := uuidutil.Parse(idStr)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		var params dto.UpdateUserTechnologyRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		userID, _ := GetUserIDFromRequest(r)
		role, _ := GetRoleFromRequest(r)

		var ut db.UserTechnology
		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			ut, err = q.UpdateUserTechnology(r.Context(), db.UpdateUserTechnologyParams{
				ID:           id,
				UserID:       params.UserID,
				TechnologyID: params.TechnologyID,
				RingID:       params.RingID,
			})
			return err
		})
		if err != nil {
			http.Error(w, "Failed to update user technology", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(ut)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// UserTechnology represents a user technology assignment in the database
type UserTechnology struct {
	ID           pgtype.UUID `json:"id" swaggertype:"string" example:"550e8400-e29b-41d4-a716-446655440000"`
	UserID       pgtype.UUID `json:"user_id" swaggertype:"string" example:"550e8400-e29b-41d4-a716-446655440000"`
	TechnologyID pgtype.UUID `json:"technology_id" swaggertype:"string" example:"550e8400-e29b-41d4-a716-446655440000"`
	RingID       int32       `json:"ring_id" example:"2"`
	CreatedAt    string      `json:"created_at" example:"2026-04-05T12:00:00Z"`
	UpdatedAt    string      `json:"updated_at" example:"2026-04-05T12:00:00Z"`
}
