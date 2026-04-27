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
		})
		if err != nil {
			http.Error(w, "Failed to create user", http.StatusInternalServerError)
			return
		}

		token, err := auth.GenerateToken(userUUID, user.Username)
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
				IsAdmin:  false,
			},
		}); err != nil {
			log.Printf("Failed to encode response: %v", err)
		}
	}
}

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

		token, err := auth.GenerateToken(user.ID.Bytes, user.Username)
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
				IsAdmin:  false,
			},
		}); err != nil {
			log.Printf("Failed to encode response: %v", err)
		}
	}
}

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