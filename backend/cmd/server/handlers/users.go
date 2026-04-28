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
	ErrUserNotFound  = "User not found"
	ErrUserOwnership = "You can only access your own profile"
)

// GetUser godoc
// @Summary Get a user
// @Description Get user by ID (only own profile or admin)
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} User
// @Failure 400 {object} Error
// @Failure 403 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /users/{id} [get]
func GetUser(q Querier) http.HandlerFunc {
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

		user, err := q.GetUserID(r.Context(), id)
		if err != nil {
			http.Error(w, ErrUserNotFound, http.StatusNotFound)
			return
		}

		authUserID, ok := GetUserIDFromRequest(r)
		role, _ := GetRoleFromRequest(r)
		if !ok || (user.ID.Bytes != authUserID && role != "admin") {
			http.Error(w, ErrUserOwnership, http.StatusForbidden)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(user)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// GetUserByEmail godoc
// @Summary Get a user by email
// @Description Get user by email
// @Tags users
// @Accept json
// @Produce json
// @Param email path string true "User email"
// @Success 200 {object} User
// @Failure 400 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /users/by-email/{email} [get]
func GetUserByEmail(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.PathValue("email")
		if email == "" {
			http.Error(w, "Missing email parameter", http.StatusBadRequest)
			return
		}

		user, err := q.GetUserEmail(r.Context(), email)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(user)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// GetAllUsers godoc
// @Summary Get all users
// @Description Get all users
// @Tags users
// @Accept json
// @Produce json
// @Success 200 {array} User
// @Failure 500 {object} Error
// @Router /users [get]
func GetAllUsers(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		users, err := q.GetAllUsers(r.Context())
		if err != nil {
			http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
			return
		}

		if users == nil {
			users = []db.User{}
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(users)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// CreateUser godoc
// @Summary Create a user
// @Description Create a new user
// @Tags users
// @Accept json
// @Produce json
// @Param User body CreateUserRequest true "User data"
// @Success 201 {object} User
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /users [post]
func CreateUser(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params dto.CreateUserRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		params.ID = uuidutil.New()

		user, err := q.CreateUser(r.Context(), db.CreateUserParams{
			ID:             params.ID,
			Name:           params.Name,
			Email:          params.Email,
			Username:       params.Username,
			HashedPassword: params.HashedPassword,
			LastLoggedIn:   params.LastLoggedIn,
		})
		if err != nil {
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(user)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// DeleteUser godoc
// @Summary Delete a user
// @Description Delete user by ID
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 204
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /users/{id} [delete]
func DeleteUser(q Querier) http.HandlerFunc {
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

		if err := q.DeleteUser(r.Context(), id); err != nil {
			http.Error(w, "Failed to delete user", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// UpdateUser godoc
// @Summary Update a user
// @Description Update user by ID (only own profile or admin)
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param User body UpdateUserRequest true "User data"
// @Success 200 {object} User
// @Failure 400 {object} Error
// @Failure 403 {object} Error
// @Failure 500 {object} Error
// @Router /users/{id} [put]
func UpdateUser(q Querier) http.HandlerFunc {
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

		existingUser, err := q.GetUserID(r.Context(), id)
		if err != nil {
			http.Error(w, ErrUserNotFound, http.StatusNotFound)
			return
		}

		authUserID, ok := GetUserIDFromRequest(r)
		role, _ := GetRoleFromRequest(r)
		if !ok || (existingUser.ID.Bytes != authUserID && role != "admin") {
			http.Error(w, ErrUserOwnership, http.StatusForbidden)
			return
		}

		var params dto.UpdateUserRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		userRole := existingUser.Role
		if role == "admin" && params.Role != "" {
			userRole = params.Role
		}

		user, err := q.UpdateUser(r.Context(), db.UpdateUserParams{
			ID:             id,
			Name:           params.Name,
			Email:          params.Email,
			Username:       params.Username,
			HashedPassword: params.HashedPassword,
			Role:           userRole,
			LastLoggedIn:   params.LastLoggedIn,
		})
		if err != nil {
			http.Error(w, "Failed to update user", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(user)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// User represents a user in the database
type User struct {
	ID             pgtype.UUID        `json:"id" swaggertype:"string" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name           string             `json:"name" example:"John Doe"`
	Email          string             `json:"email" example:"john@example.com"`
	Username       string             `json:"username" example:"johndoe"`
	HashedPassword string             `json:"hashed_password" example:"hashed_password_value"`
	CreatedAt      string             `json:"created_at" example:"2026-04-05T12:00:00Z"`
	LastLoggedIn   pgtype.Timestamptz `json:"last_logged_in" swaggertype:"string" example:"2026-04-05T12:00:00Z"`
}
