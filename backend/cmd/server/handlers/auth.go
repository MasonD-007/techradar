package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/MasonD-007/template/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/template/backend/internal/auth"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/google/uuid"
)

// Register godoc
// @Summary Register a new user
// @Description Create a new user account and return authentication token
// @Tags auth
// @Accept json
// @Produce json
// @Param RegisterRequest body dto.RegisterRequest true "Registration data"
// @Success 201 {object} dto.AuthResponse
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /auth/register [post]
func Register(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if req.Email == "" || req.Password == "" || req.Username == "" || req.Name == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}

		hashedPassword, err := auth.HashPassword(req.Password)
		if err != nil {
			http.Error(w, "Failed to hash password", http.StatusInternalServerError)
			return
		}

		userUUID := uuid.New()
		user, err := q.CreateUser(r.Context(), db.CreateUserParams{
			ID:             auth.ToPgType(userUUID),
			Name:           req.Name,
			Email:          req.Email,
			Username:       req.Username,
			HashedPassword: hashedPassword,
			Role:           "user",
		})
		if err != nil {
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}

		token, err := auth.GenerateToken(userUUID, user.Username, user.Role)
		if err != nil {
			http.Error(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		if err := json.NewEncoder(w).Encode(dto.AuthResponse{
			Token: token,
			User: dto.UserDTO{
				ID:       userUUID.String(),
				Name:     user.Name,
				Email:    user.Email,
				Username: user.Username,
				IsAdmin:  user.Role == "admin",
			},
		}); err != nil {
			log.Printf("Failed to encode response: %v", err)
		}
	}
}

// Login godoc
// @Summary Login user
// @Description Authenticate user and return JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param LoginRequest body dto.LoginRequest true "Login credentials"
// @Success 200 {object} dto.AuthResponse
// @Failure 400 {object} Error
// @Failure 401 {object} Error
// @Failure 500 {object} Error
// @Router /auth/login [post]
func Login(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req dto.LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if req.Email == "" || req.Password == "" {
			http.Error(w, "Missing email or password", http.StatusBadRequest)
			return
		}

		user, err := q.GetUserEmail(r.Context(), req.Email)
		if err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		if err := auth.CheckPassword(req.Password, user.HashedPassword); err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		if !user.ID.Valid {
			http.Error(w, "Invalid user data", http.StatusInternalServerError)
			return
		}

		token, err := auth.GenerateToken(user.ID.Bytes, user.Username, user.Role)
		if err != nil {
			http.Error(w, "Failed to generate token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(dto.AuthResponse{
			Token: token,
			User: dto.UserDTO{
				ID:       user.ID.String(),
				Name:     user.Name,
				Email:    user.Email,
				Username: user.Username,
				IsAdmin:  user.Role == "admin",
			},
		}); err != nil {
			log.Printf("Failed to encode response: %v", err)
		}
	}
}

// Logout godoc
// @Summary Logout user
// @Description Logout current user (client should discard token)
// @Tags auth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]string
// @Router /auth/logout [post]
func Logout(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(map[string]string{
			"message": "Logged out successfully",
		}); err != nil {
			log.Printf("Failed to encode response: %v", err)
		}
	}
}