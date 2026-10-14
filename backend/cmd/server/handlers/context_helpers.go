package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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

// isAdminRequest reports whether the authenticated caller has the admin role.
func isAdminRequest(r *http.Request) bool {
	role, _ := GetRoleFromRequest(r)
	return role == "admin"
}

// isOwnerOrAdmin reports whether the caller is the given user or an admin.
// The application's database role bypasses row-level security, so handlers
// must enforce ownership explicitly.
func isOwnerOrAdmin(r *http.Request, caller uuid.UUID, owner pgtype.UUID) bool {
	if isAdminRequest(r) {
		return true
	}
	return owner.Valid && owner.Bytes == caller
}
