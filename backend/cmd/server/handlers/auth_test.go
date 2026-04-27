package handlers_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MasonD-007/template/backend/cmd/server/handlers"
	"github.com/MasonD-007/template/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/template/backend/cmd/server/handlers/mocks"
	"github.com/MasonD-007/template/backend/internal/auth"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func init() {
	auth.InitAuth("test-secret-key", 24)
}

var (
	authValidUUID     = uuid.New()
	authValidUUIDStr  = authValidUUID.String()
	testUserEmail = "test@example.com"
)

func hashPassword(password string) string {
	hashed, _ := auth.HashPassword(password)
	return hashed
}

func TestRegister_ValidInput(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	mockQuerier.On("CreateUser", mock.Anything, mock.AnythingOfType("db.CreateUserParams")).
		Return(db.User{
			ID:             pgtype.UUID{Bytes: authValidUUID, Valid: true},
			Name:           "Test User",
			Email:          testUserEmail,
			Username:       "testuser",
			HashedPassword: hashPassword("password123"),
		}, nil)

	handler := handlers.Register(mockQuerier)
	body := `{"name":"Test User","email":"test@example.com","username":"testuser","password":"password123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusCreated, recorder.Code)

	var resp dto.AuthResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, testUserEmail, resp.User.Email)
	assert.Equal(t, "testuser", resp.User.Username)
	assert.Equal(t, "Test User", resp.User.Name)
	assert.False(t, resp.User.IsAdmin)

	mockQuerier.AssertExpectations(t)
}

func TestRegister_MissingName(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	handler := handlers.Register(mockQuerier)
	body := `{"email":"test@example.com","username":"testuser","password":"password123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Missing required fields")
}

func TestRegister_MissingEmail(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	handler := handlers.Register(mockQuerier)
	body := `{"name":"Test User","username":"testuser","password":"password123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Missing required fields")
}

func TestRegister_MissingPassword(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	handler := handlers.Register(mockQuerier)
	body := `{"name":"Test User","email":"test@example.com","username":"testuser"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Missing required fields")
}

func TestRegister_MissingUsername(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	handler := handlers.Register(mockQuerier)
	body := `{"name":"Test User","email":"test@example.com","password":"password123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Missing required fields")
}

func TestRegister_InvalidJSON(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	handler := handlers.Register(mockQuerier)
	body := `{invalid json}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Invalid request body")
}

func TestRegister_DatabaseError(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	mockQuerier.On("CreateUser", mock.Anything, mock.AnythingOfType("db.CreateUserParams")).
		Return(db.User{}, errors.New("database error"))

	handler := handlers.Register(mockQuerier)
	body := `{"name":"Test User","email":"test@example.com","username":"testuser","password":"password123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusInternalServerError, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Failed to create user")
	mockQuerier.AssertExpectations(t)
}

func TestLogin_ValidCredentials(t *testing.T) {
	password := "password123"
	hashedPassword := hashPassword(password)

	mockQuerier := mocks.NewMockQuerier()
	mockQuerier.On("GetUserEmail", mock.Anything, testUserEmail).
		Return(db.User{
			ID:             pgtype.UUID{Bytes: authValidUUID, Valid: true},
			Name:           "Test User",
			Email:          testUserEmail,
			Username:       "testuser",
			HashedPassword: hashedPassword,
		}, nil)

	handler := handlers.Login(mockQuerier)
	body := `{"email":"test@example.com","password":"` + password + `"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusOK, recorder.Code)

	var resp dto.AuthResponse
	err := json.Unmarshal(recorder.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, testUserEmail, resp.User.Email)
	assert.Equal(t, "testuser", resp.User.Username)

	mockQuerier.AssertExpectations(t)
}

func TestLogin_MissingEmail(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	handler := handlers.Login(mockQuerier)
	body := `{"password":"password123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Missing email or password")
}

func TestLogin_MissingPassword(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	handler := handlers.Login(mockQuerier)
	body := `{"email":"test@example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Missing email or password")
}

func TestLogin_UserNotFound(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	mockQuerier.On("GetUserEmail", mock.Anything, "notfound@example.com").
		Return(db.User{}, errors.New("sql: no rows in result set"))

	handler := handlers.Login(mockQuerier)
	body := `{"email":"notfound@example.com","password":"password123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Invalid credentials")
	mockQuerier.AssertExpectations(t)
}

func TestLogin_WrongPassword(t *testing.T) {
	hashedPassword := hashPassword("correctpassword")

	mockQuerier := mocks.NewMockQuerier()
	mockQuerier.On("GetUserEmail", mock.Anything, testUserEmail).
		Return(db.User{
			ID:             pgtype.UUID{Bytes: authValidUUID, Valid: true},
			Name:           "Test User",
			Email:          testUserEmail,
			Username:       "testuser",
			HashedPassword: hashedPassword,
		}, nil)

	handler := handlers.Login(mockQuerier)
	body := `{"email":"test@example.com","password":"wrongpassword"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Invalid credentials")
	mockQuerier.AssertExpectations(t)
}

func TestLogin_InvalidJSON(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	handler := handlers.Login(mockQuerier)
	body := `{invalid json}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Invalid request body")
}

func TestRegister_EmptyStrings(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantFields []string
	}{
		{
			name:       "empty name",
			body:       `{"name":"","email":"test@example.com","username":"testuser","password":"password123"}`,
			wantFields: []string{"name"},
		},
		{
			name:       "empty email",
			body:       `{"name":"Test","email":"","username":"testuser","password":"password123"}`,
			wantFields: []string{"email"},
		},
		{
			name:       "empty username",
			body:       `{"name":"Test","email":"test@example.com","username":"","password":"password123"}`,
			wantFields: []string{"username"},
		},
		{
			name:       "empty password",
			body:       `{"name":"Test","email":"test@example.com","username":"testuser","password":""}`,
			wantFields: []string{"password"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			handler := handlers.Register(mockQuerier)
			req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, http.StatusBadRequest, recorder.Code)
		})
	}
}

func TestRegister_SQLInjectionAttempt(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	mockQuerier.On("CreateUser", mock.Anything, mock.AnythingOfType("db.CreateUserParams")).
		Return(db.User{}, errors.New("database error"))

	handler := handlers.Register(mockQuerier)
	body := `{"name":"Test User","email":"test@example.com","username":"testuser","password":"password'); DROP TABLE users;--"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusInternalServerError, recorder.Code)
	mockQuerier.AssertExpectations(t)
}

func TestLogin_SQLInjectionAttempt(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	mockQuerier.On("GetUserEmail", context.Background(), "test@example.com' OR '1'='1").
		Return(db.User{}, errors.New("sql: no rows in result set"))

	handler := handlers.Login(mockQuerier)
	body := `{"email":"test@example.com' OR '1'='1","password":"password"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Invalid credentials")
	mockQuerier.AssertExpectations(t)
}

func TestLogin_InvalidUserData(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	mockQuerier.On("GetUserEmail", mock.Anything, testUserEmail).
		Return(db.User{
			ID:             pgtype.UUID{Valid: false},
			Name:           "Test User",
			Email:          testUserEmail,
			Username:       "testuser",
			HashedPassword: hashPassword("password123"),
		}, nil)

	handler := handlers.Login(mockQuerier)
	body := `{"email":"test@example.com","password":"password123"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusInternalServerError, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Invalid user data")
	mockQuerier.AssertExpectations(t)
}

func TestLogout_Success(t *testing.T) {
	mockQuerier := mocks.NewMockQuerier()
	handler := handlers.Logout(mockQuerier)
	req := httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "Logged out successfully")
}