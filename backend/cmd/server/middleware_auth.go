package main

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/MasonD-007/template/backend/internal/auth"
	"github.com/google/uuid"
)

type contextKey string

const userIDKey contextKey = "user_id"
const usernameKey contextKey = "username"

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			if errors.Is(err, auth.ErrTokenExpired) {
				http.Error(w, "Token expired", http.StatusUnauthorized)
			} else {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
			}
			return
		}

		userID, err := uuid.Parse(claims.UserID)
		if err != nil {
			http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, userID)
		ctx = context.WithValue(ctx, usernameKey, claims.Username)

		next(w, r.WithContext(ctx))
	}
}

func GetUserIDFromRequest(r *http.Request) (uuid.UUID, bool) {
	userID, ok := r.Context().Value(userIDKey).(uuid.UUID)
	return userID, ok
}

func GetUsernameFromRequest(r *http.Request) (string, bool) {
	username, ok := r.Context().Value(usernameKey).(string)
	return username, ok
}