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
	"github.com/MasonD-007/template/backend/cmd/server/handlers/mocks"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestGetUser(t *testing.T) {
	testUserID := uuid.MustParse(validUUIDStr)
	tests := []struct {
		name       string
		pathID     string
		userID     string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing id returns bad request",
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "invalid uuid returns bad request",
			pathID:   "invalid-uuid",
			wantCode: http.StatusBadRequest,
		},
		{
			name:   "not found error returns 404",
			pathID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserID", mock.Anything, validUUID).Return(db.User{}, errors.New("not found"))
			},
			wantCode: http.StatusNotFound,
		},
		{
			name:   "successful fetch returns user",
			pathID: validUUIDStr,
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserID", mock.Anything, validUUID).Return(db.User{ID: validUUID, Email: "test@example.com"}, nil)
			},
			wantCode: http.StatusOK,
		},
		{
			name:   "unauthorized when different user",
			pathID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserID", mock.Anything, validUUID).Return(db.User{ID: validUUID, Email: "test@example.com"}, nil)
			},
			wantCode: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			if tt.mockExpect != nil {
				tt.mockExpect(mockQuerier)
			}

			handler := handlers.GetUser(mockQuerier)
			req := httptest.NewRequest(http.MethodGet, "/users/"+tt.pathID, nil)
			if tt.pathID != "" {
				req.SetPathValue("id", tt.pathID)
			}
			if tt.userID != "" {
				req = req.WithContext(context.WithValue(req.Context(), "user_id", testUserID))
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			if tt.wantCode == http.StatusOK {
				var resp map[string]any
				requireNoErr := json.Unmarshal(recorder.Body.Bytes(), &resp)
				assert.NoError(t, requireNoErr)
				assert.Equal(t, "test@example.com", resp["email"])
			}
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestGetUserByEmail(t *testing.T) {
	tests := []struct {
		name       string
		pathEmail  string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing email returns bad request",
			wantCode: http.StatusBadRequest,
		},
		{
			name:      "not found error returns 404",
			pathEmail: "unknown@example.com",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserEmail", mock.Anything, "unknown@example.com").Return(db.User{}, errors.New("not found"))
			},
			wantCode: http.StatusNotFound,
		},
		{
			name:      "successful fetch returns user",
			pathEmail: "found@example.com",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserEmail", mock.Anything, "found@example.com").Return(db.User{Email: "found@example.com"}, nil)
			},
			wantCode: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			if tt.mockExpect != nil {
				tt.mockExpect(mockQuerier)
			}

			handler := handlers.GetUserByEmail(mockQuerier)
			req := httptest.NewRequest(http.MethodGet, "/users/by-email/"+tt.pathEmail, nil)
			if tt.pathEmail != "" {
				req.SetPathValue("email", tt.pathEmail)
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestCreateUser(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "invalid JSON returns bad request",
			body:     `{bad json}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name: "database error returns 500",
			body: `{"email":"test@test.com", "username":"testuser"}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("CreateUser", mock.Anything, mock.AnythingOfType("db.CreateUserParams")).Return(db.User{}, errors.New("db error"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name: "successful create returns 201",
			body: `{"email":"test@test.com", "username":"testuser"}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("CreateUser", mock.Anything, mock.AnythingOfType("db.CreateUserParams")).Return(db.User{Email: "test@test.com"}, nil)
			},
			wantCode: http.StatusCreated,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			if tt.mockExpect != nil {
				tt.mockExpect(mockQuerier)
			}

			handler := handlers.CreateUser(mockQuerier)
			req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(tt.body))
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestUpdateUser(t *testing.T) {
	testUserID := uuid.MustParse(validUUIDStr)

	tests := []struct {
		name       string
		pathID     string
		body       string
		userID     string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing id returns bad request",
			body:     `{"email":"new@example.com"}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "invalid id returns bad request",
			pathID:   "invalid-uuid",
			body:     `{"email":"new@example.com"}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "invalid json returns bad request",
			pathID:   validUUIDStr,
			body:     `{bad json}`,
			userID:   validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserID", mock.Anything, validUUID).Return(db.User{ID: validUUID}, nil)
			},
			wantCode: http.StatusBadRequest,
		},
		{
			name:   "update error returns 500",
			pathID: validUUIDStr,
			body:   `{"email":"new@example.com"}`,
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserID", mock.Anything, validUUID).Return(db.User{ID: validUUID}, nil)
				m.On("UpdateUser", mock.Anything, mock.AnythingOfType("db.UpdateUserParams")).Return(db.User{}, errors.New("fail"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful update returns payload",
			pathID: validUUIDStr,
			body:   `{"email":"new@example.com"}`,
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserID", mock.Anything, validUUID).Return(db.User{ID: validUUID}, nil)
				m.On("UpdateUser", mock.Anything, mock.AnythingOfType("db.UpdateUserParams")).Return(db.User{Email: "new@example.com"}, nil)
			},
			wantCode: http.StatusOK,
		},
		{
			name:   "unauthorized when different user",
			pathID: validUUIDStr,
			body:   `{"email":"new@example.com"}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserID", mock.Anything, validUUID).Return(db.User{ID: validUUID}, nil)
			},
			wantCode: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			if tt.mockExpect != nil {
				tt.mockExpect(mockQuerier)
			}

			handler := handlers.UpdateUser(mockQuerier)
			req := httptest.NewRequest(http.MethodPut, "/users/"+tt.pathID, strings.NewReader(tt.body))
			if tt.pathID != "" {
				req.SetPathValue("id", tt.pathID)
			}
			if tt.userID != "" {
				req = req.WithContext(context.WithValue(req.Context(), "user_id", testUserID))
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestDeleteUser(t *testing.T) {
	tests := []struct {
		name       string
		pathID     string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing id returns bad request",
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "invalid id returns bad request",
			pathID:   "invalid-uuid",
			wantCode: http.StatusBadRequest,
		},
		{
			name:   "delete error returns 500",
			pathID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("DeleteUser", mock.Anything, validUUID).Return(errors.New("boom"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful delete returns no content",
			pathID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("DeleteUser", mock.Anything, validUUID).Return(nil)
			},
			wantCode: http.StatusNoContent,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			if tt.mockExpect != nil {
				tt.mockExpect(mockQuerier)
			}

			handler := handlers.DeleteUser(mockQuerier)
			req := httptest.NewRequest(http.MethodDelete, "/users/"+tt.pathID, nil)
			if tt.pathID != "" {
				req.SetPathValue("id", tt.pathID)
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}
