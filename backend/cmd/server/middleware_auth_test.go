package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MasonD-007/template/backend/internal/auth"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func init() {
	auth.InitAuth("test-secret-key", 24)
}

func TestAuthMiddleware_MissingHeader(t *testing.T) {
	handler := AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Missing authorization header")
}

func TestAuthMiddleware_InvalidFormat(t *testing.T) {
	handler := AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Authorization", "Basic invalidtoken")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Invalid authorization header format")
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	handler := AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Authorization", "Bearer not.a.valid.token")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Invalid token")
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	testUserID := uuid.New()
	testUsername := "testuser"

	expiredToken := jwt.NewWithClaims(jwt.SigningMethodHS256, auth.Claims{
		UserID:   testUserID.String(),
		Username: testUsername,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	})
	tokenString, err := expiredToken.SignedString([]byte("test-secret-key"))
	assert.NoError(t, err)

	handler := AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+tokenString)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Token expired")
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	testUserID := uuid.New()
	testUsername := "testuser"
	testRole := "user"
	token, err := auth.GenerateToken(testUserID, testUsername, testRole)
	assert.NoError(t, err)

	var capturedID uuid.UUID
	var capturedName string

	handler := AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		capturedID, _ = GetUserIDFromRequest(r)
		capturedName, _ = GetUsernameFromRequest(r)
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.Equal(t, testUserID, capturedID)
	assert.Equal(t, testUsername, capturedName)
}

func TestGetUserIDFromRequest_NoContext(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	_, ok := GetUserIDFromRequest(req)
	assert.False(t, ok)
}

func TestGetUserIDFromRequest_WithContext(t *testing.T) {
	testID := uuid.New()
	ctx := context.WithValue(context.Background(), userIDKey, testID)
	req := httptest.NewRequest(http.MethodGet, "/test", nil).WithContext(ctx)

	id, ok := GetUserIDFromRequest(req)
	assert.True(t, ok)
	assert.Equal(t, testID, id)
}

func TestGetUserIDFromRequest_InvalidType(t *testing.T) {
	ctx := context.WithValue(context.Background(), userIDKey, "not-a-uuid")
	req := httptest.NewRequest(http.MethodGet, "/test", nil).WithContext(ctx)

	id, ok := GetUserIDFromRequest(req)
	assert.False(t, ok)
	assert.Equal(t, uuid.Nil, id)
}

func TestGetUsernameFromRequest_NoContext(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	_, ok := GetUsernameFromRequest(req)
	assert.False(t, ok)
}

func TestGetUsernameFromRequest_WithContext(t *testing.T) {
	ctx := context.WithValue(context.Background(), usernameKey, "testuser")
	req := httptest.NewRequest(http.MethodGet, "/test", nil).WithContext(ctx)

	name, ok := GetUsernameFromRequest(req)
	assert.True(t, ok)
	assert.Equal(t, "testuser", name)
}

func TestGetUsernameFromRequest_InvalidType(t *testing.T) {
	ctx := context.WithValue(context.Background(), usernameKey, 12345)
	req := httptest.NewRequest(http.MethodGet, "/test", nil).WithContext(ctx)

	name, ok := GetUsernameFromRequest(req)
	assert.False(t, ok)
	assert.Equal(t, "", name)
}

func TestAuthMiddleware_RoleStoredInContext(t *testing.T) {
	testUserID := uuid.New()
	testUsername := "testuser"
	testRole := "user"

	token, err := auth.GenerateToken(testUserID, testUsername, testRole)
	assert.NoError(t, err)

	var capturedID uuid.UUID
	var capturedName string
	var capturedRole string

	handler := AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		capturedID, _ = GetUserIDFromRequest(r)
		capturedName, _ = GetUsernameFromRequest(r)
		capturedRole, _ = GetRoleFromRequest(r)
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.Equal(t, testUserID, capturedID)
	assert.Equal(t, testUsername, capturedName)
	assert.Equal(t, testRole, capturedRole)
}

func TestAuthMiddleware_AdminRoleInContext(t *testing.T) {
	testUserID := uuid.New()
	testUsername := "adminuser"
	testRole := "admin"

	token, err := auth.GenerateToken(testUserID, testUsername, testRole)
	assert.NoError(t, err)

	var capturedRole string

	handler := AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		capturedRole, _ = GetRoleFromRequest(r)
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.Equal(t, "admin", capturedRole)
}

func TestGetRoleFromRequest_NoContext(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	_, ok := GetRoleFromRequest(req)
	assert.False(t, ok)
}

func TestGetRoleFromRequest_WithContext(t *testing.T) {
	ctx := context.WithValue(context.Background(), roleKey, "admin")
	req := httptest.NewRequest(http.MethodGet, "/test", nil).WithContext(ctx)

	role, ok := GetRoleFromRequest(req)
	assert.True(t, ok)
	assert.Equal(t, "admin", role)
}

func TestGetRoleFromRequest_InvalidType(t *testing.T) {
	ctx := context.WithValue(context.Background(), roleKey, 12345)
	req := httptest.NewRequest(http.MethodGet, "/test", nil).WithContext(ctx)

	role, ok := GetRoleFromRequest(req)
	assert.False(t, ok)
	assert.Equal(t, "", role)
}

func TestAdminMiddleware_AdminRole_Allowed(t *testing.T) {
	testUserID := uuid.New()

	token, err := auth.GenerateToken(testUserID, "adminuser", "admin")
	assert.NoError(t, err)

	handler := AuthMiddleware(AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusOK, recorder.Code)
}

func TestAdminMiddleware_UserRole_Forbidden(t *testing.T) {
	testUserID := uuid.New()

	token, err := auth.GenerateToken(testUserID, "regularuser", "user")
	assert.NoError(t, err)

	handler := AuthMiddleware(AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusForbidden, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Admin access required")
}

func TestAdminMiddleware_NoRole_Forbidden(t *testing.T) {
	testUserID := uuid.New()

	token, err := auth.GenerateToken(testUserID, "testuser", "")
	assert.NoError(t, err)

	handler := AuthMiddleware(AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusForbidden, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Admin access required")
}

func TestAdminMiddleware_NoAuth_Forbidden(t *testing.T) {
	handler := AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/test", nil)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusForbidden, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Admin access required")
}

func TestAuthMiddlewareThenAdminMiddleware_ValidAdmin(t *testing.T) {
	testUserID := uuid.New()
	testUsername := "adminuser"
	testRole := "admin"

	token, err := auth.GenerateToken(testUserID, testUsername, testRole)
	assert.NoError(t, err)

	var reachedHandler bool
	handler := AuthMiddleware(AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		reachedHandler = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/admin/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.True(t, reachedHandler)
}

func TestAuthMiddlewareThenAdminMiddleware_ValidUserFailsAdmin(t *testing.T) {
	testUserID := uuid.New()
	testUsername := "regularuser"
	testRole := "user"

	token, err := auth.GenerateToken(testUserID, testUsername, testRole)
	assert.NoError(t, err)

	var reachedHandler bool
	handler := AuthMiddleware(AdminMiddleware(func(w http.ResponseWriter, r *http.Request) {
		reachedHandler = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodPost, "/admin/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusForbidden, recorder.Code)
	assert.False(t, reachedHandler)
}