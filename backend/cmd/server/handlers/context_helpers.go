package handlers

import (
	"net/http"

	"github.com/google/uuid"
)

type contextKey string

const (
	UserIDKey   contextKey = "user_id"
	UsernameKey contextKey = "username"
	RoleKey    contextKey = "role"
)

func GetUserIDFromRequest(r *http.Request) (uuid.UUID, bool) {
	userID, ok := r.Context().Value(UserIDKey).(uuid.UUID)
	return userID, ok
}

func GetUsernameFromRequest(r *http.Request) (string, bool) {
	username, ok := r.Context().Value(UsernameKey).(string)
	return username, ok
}

func GetRoleFromRequest(r *http.Request) (string, bool) {
	role, ok := r.Context().Value(RoleKey).(string)
	return role, ok
}