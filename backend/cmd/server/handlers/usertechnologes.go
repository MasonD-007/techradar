package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/MasonD-007/template/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/MasonD-007/template/backend/internal/uuidutil"
	"github.com/jackc/pgx/v5/pgtype"
)

// GetUserTechnology godoc
// @Summary Get a user technology
// @Description Get user technology by ID
// @Tags user-technologies
// @Accept json
// @Produce json
// @Param id path string true "UserTechnology ID"
// @Success 200 {object} UserTechnology
// @Failure 400 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /user-technologies/{id} [get]
func GetUserTechnology(q Querier) http.HandlerFunc {
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

		ut, err := q.GetUserTechnologyID(r.Context(), id)
		if err != nil {
			http.Error(w, "User technology not found", http.StatusNotFound)
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

// GetUserTechnologiesByUser godoc
// @Summary Get technologies for a user
// @Description Get all technologies assigned to a user
// @Tags user-technologies
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Success 200 {array} UserTechnology
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /users/{user_id}/technologies [get]
func GetUserTechnologiesByUser(q Querier) http.HandlerFunc {
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

		uts, err := q.GetUserTechnologyUserId(r.Context(), userID)
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

// CreateUserTechnology godoc
// @Summary Create a user technology
// @Description Assign a technology to a user with a ring
// @Tags user-technologies
// @Accept json
// @Produce json
// @Param UserTechnology body CreateUserTechnologyRequest true "UserTechnology data"
// @Success 201 {object} UserTechnology
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /user-technologies [post]
func CreateUserTechnology(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params dto.CreateUserTechnologyRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		params.ID = uuidutil.New()

		ut, err := q.CreateUserTechnology(r.Context(), db.CreateUserTechnologyParams{
			ID:           params.ID,
			UserID:       params.UserID,
			TechnologyID: params.TechnologyID,
			RingID:       params.RingID,
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

// DeleteUserTechnology godoc
// @Summary Delete a user technology
// @Description Delete user technology by ID
// @Tags user-technologies
// @Accept json
// @Produce json
// @Param id path string true "UserTechnology ID"
// @Success 204
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /user-technologies/{id} [delete]
func DeleteUserTechnology(q Querier) http.HandlerFunc {
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

		if err := q.DeleteUserTechnology(r.Context(), id); err != nil {
			http.Error(w, "Failed to delete user technology", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// UpdateUserTechnology godoc
// @Summary Update a user technology
// @Description Update user technology ring
// @Tags user-technologies
// @Accept json
// @Produce json
// @Param id path string true "UserTechnology ID"
// @Param UserTechnology body UpdateUserTechnologyRequest true "UserTechnology data"
// @Success 200 {object} UserTechnology
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /user-technologies/{id} [put]
func UpdateUserTechnology(q Querier) http.HandlerFunc {
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

		ut, err := q.UpdateUserTechnology(r.Context(), db.UpdateUserTechnologyParams{
			ID:           id,
			UserID:       params.UserID,
			TechnologyID: params.TechnologyID,
			RingID:       params.RingID,
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
