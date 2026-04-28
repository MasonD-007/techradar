package handlers

import (
	"net/http"

	"github.com/google/uuid"
)

func GetUserIDFromRequest(r *http.Request) (uuid.UUID, bool) {
	userID, ok := r.Context().Value("user_id").(uuid.UUID)
	return userID, ok
}

func GetUsernameFromRequest(r *http.Request) (string, bool) {
	username, ok := r.Context().Value("username").(string)
	return username, ok
}

func GetRoleFromRequest(r *http.Request) (string, bool) {
	role, ok := r.Context().Value("role").(string)
	return role, ok
}