package handlers

import (
	"encoding/json"
	"log"
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

func GetUser(q Querier, rls RLSExecutor) http.HandlerFunc {
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

		var user db.User
		err = rls.Execute(r.Context(), userID.String(), role, func(rlsQ Querier) error {
			user, err = rlsQ.GetUserID(r.Context(), id)
			return err
		})
		if err != nil {
			log.Printf("DB error in GetUser: %v", err)
			http.Error(w, ErrUserNotFound, http.StatusNotFound)
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

func GetUserByEmail(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		email := r.PathValue("email")
		if email == "" {
			http.Error(w, "Missing email parameter", http.StatusBadRequest)
			return
		}

		role, _ := GetRoleFromRequest(r)

		var user db.User
		var err error
		err = rls.Execute(r.Context(), "", role, func(q Querier) error {
			user, err = q.GetUserEmail(r.Context(), email)
			return err
		})
		if err != nil {
			log.Printf("DB error in GetUserByEmail: %v", err)
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

func GetAllUsers(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		role, _ := GetRoleFromRequest(r)

		var users []db.User
		var err error
		err = rls.Execute(r.Context(), "", role, func(q Querier) error {
			users, err = q.GetAllUsers(r.Context())
			return err
		})
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

func CreateUser(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params dto.CreateUserRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		params.ID = uuidutil.New()

		role, _ := GetRoleFromRequest(r)

		var user db.User
		var err error
		err = rls.Execute(r.Context(), "", role, func(q Querier) error {
			user, err = q.CreateUser(r.Context(), db.CreateUserParams{
				ID:             params.ID,
				Name:           params.Name,
				Email:          params.Email,
				Username:       params.Username,
				HashedPassword: params.HashedPassword,
				LastLoggedIn:   params.LastLoggedIn,
			})
			return err
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

func DeleteUser(q Querier, rls RLSExecutor) http.HandlerFunc {
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

		role, _ := GetRoleFromRequest(r)

		err = rls.Execute(r.Context(), "", role, func(q Querier) error {
			return q.DeleteUser(r.Context(), id)
		})
		if err != nil {
			http.Error(w, "Failed to delete user", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

func UpdateUser(q Querier, rls RLSExecutor) http.HandlerFunc {
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

		var params dto.UpdateUserRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		userID, _ := GetUserIDFromRequest(r)
		role, _ := GetRoleFromRequest(r)

		userRole := params.Role
		if userRole == "" {
			userRole = "user"
		}

		var user db.User
		err = rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			user, err = q.UpdateUser(r.Context(), db.UpdateUserParams{
				ID:             id,
				Name:           params.Name,
				Email:          params.Email,
				Username:       params.Username,
				HashedPassword: params.HashedPassword,
				Role:           userRole,
				LastLoggedIn:   params.LastLoggedIn,
			})
			return err
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
