package handlers_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MasonD-007/template/backend/cmd/server/handlers"
	"github.com/MasonD-007/template/backend/cmd/server/handlers/mocks"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestGetUserTechnology(t *testing.T) {
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
			name:     "invalid uuid returns bad request",
			pathID:   "invalid-uuid",
			wantCode: http.StatusBadRequest,
		},
		{
			name:   "not found error returns 404",
			pathID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{}, errors.New("not found"))
			},
			wantCode: http.StatusNotFound,
		},
		{
			name:   "successful fetch returns user technology",
			pathID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{ID: validUUID, RingID: 3}, nil)
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

			handler := handlers.GetUserTechnology(mockQuerier)
			req := httptest.NewRequest(http.MethodGet, "/user-technologies/"+tt.pathID, nil)
			if tt.pathID != "" {
				req.SetPathValue("id", tt.pathID)
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			if tt.wantCode == http.StatusOK {
				var resp map[string]any
				requireNoErr := json.Unmarshal(recorder.Body.Bytes(), &resp)
				assert.NoError(t, requireNoErr)
				assert.Equal(t, float64(3), resp["ring_id"])
			}
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestGetUserTechnologiesByUser(t *testing.T) {
	tests := []struct {
		name       string
		pathUserID string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing user id returns bad request",
			wantCode: http.StatusBadRequest,
		},
		{
			name:       "invalid user id returns bad request",
			pathUserID: "invalid-uuid",
			wantCode:   http.StatusBadRequest,
		},
		{
			name:       "fetch error returns 500",
			pathUserID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserTechnologyUserId", mock.Anything, validUUID).Return([]db.UserTechnology(nil), errors.New("db error"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:       "successful fetch returns list",
			pathUserID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetUserTechnologyUserId", mock.Anything, validUUID).Return([]db.UserTechnology{{RingID: 2}}, nil)
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

			handler := handlers.GetUserTechnologiesByUser(mockQuerier)
			req := httptest.NewRequest(http.MethodGet, "/user-technologies/user/"+tt.pathUserID, nil)
			if tt.pathUserID != "" {
				req.SetPathValue("user_id", tt.pathUserID)
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestCreateUserTechnology(t *testing.T) {
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
			body: `{"user_id":"` + validUUIDStr + `", "technology_id":"` + validUUIDStr + `", "ring_id":1}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("CreateUserTechnology", mock.Anything, mock.AnythingOfType("db.CreateUserTechnologyParams")).Return(db.UserTechnology{}, errors.New("db error"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name: "successful create returns 201",
			body: `{"user_id":"` + validUUIDStr + `", "technology_id":"` + validUUIDStr + `", "ring_id":1}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("CreateUserTechnology", mock.Anything, mock.AnythingOfType("db.CreateUserTechnologyParams")).Return(db.UserTechnology{ID: validUUID, RingID: 1}, nil)
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

			handler := handlers.CreateUserTechnology(mockQuerier)
			req := httptest.NewRequest(http.MethodPost, "/user-technologies", strings.NewReader(tt.body))
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestUpdateUserTechnology(t *testing.T) {
	tests := []struct {
		name       string
		pathID     string
		body       string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing id returns bad request",
			body:     `{"ring_id":2}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "invalid id returns bad request",
			pathID:   "invalid-uuid",
			body:     `{"ring_id":2}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "invalid json returns bad request",
			pathID:   validUUIDStr,
			body:     `{bad}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name:   "update error returns 500",
			pathID: validUUIDStr,
			body:   `{"ring_id":2}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("UpdateUserTechnology", mock.Anything, mock.AnythingOfType("db.UpdateUserTechnologyParams")).Return(db.UserTechnology{}, errors.New("fail"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful update returns payload",
			pathID: validUUIDStr,
			body:   `{"ring_id":2}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("UpdateUserTechnology", mock.Anything, mock.AnythingOfType("db.UpdateUserTechnologyParams")).Return(db.UserTechnology{ID: validUUID, RingID: 2}, nil)
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

			handler := handlers.UpdateUserTechnology(mockQuerier)
			req := httptest.NewRequest(http.MethodPut, "/user-technologies/"+tt.pathID, strings.NewReader(tt.body))
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

func TestDeleteUserTechnology(t *testing.T) {
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
				m.On("DeleteUserTechnology", mock.Anything, validUUID).Return(errors.New("boom"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful delete returns no content",
			pathID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("DeleteUserTechnology", mock.Anything, validUUID).Return(nil)
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

			handler := handlers.DeleteUserTechnology(mockQuerier)
			req := httptest.NewRequest(http.MethodDelete, "/user-technologies/"+tt.pathID, nil)
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
