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
	"github.com/MasonD-007/template/backend/internal/uuidutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

var validUUIDStr = "550e8400-e29b-41d4-a716-446655440000"
var validUUID, _ = uuidutil.Parse(validUUIDStr)

func TestGetTechnology(t *testing.T) {
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
				m.On("GetTechnologyID", mock.Anything, validUUID).Return(db.Technology{}, errors.New("not found"))
			},
			wantCode: http.StatusNotFound,
		},
		{
			name:   "successful fetch returns technology",
			pathID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetTechnologyID", mock.Anything, validUUID).Return(db.Technology{ID: validUUID, Name: "Go"}, nil)
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

			handler := handlers.GetTechnology(mockQuerier)
			req := httptest.NewRequest(http.MethodGet, "/technologies/"+tt.pathID, nil)
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
				assert.Equal(t, "Go", resp["name"])
			}
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestGetTechnologyByName(t *testing.T) {
	tests := []struct {
		name       string
		pathName   string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing name returns bad request",
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "not found error returns 404",
			pathName: "UnknownTech",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetTechnologyName", mock.Anything, "UnknownTech").Return(db.Technology{}, errors.New("not found"))
			},
			wantCode: http.StatusNotFound,
		},
		{
			name:     "successful fetch returns technology",
			pathName: "React",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetTechnologyName", mock.Anything, "React").Return(db.Technology{Name: "React"}, nil)
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

			handler := handlers.GetTechnologyByName(mockQuerier)
			req := httptest.NewRequest(http.MethodGet, "/technologies/by-name/"+tt.pathName, nil)
			if tt.pathName != "" {
				req.SetPathValue("name", tt.pathName)
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestGetTechnologiesByQuadrant(t *testing.T) {
	tests := []struct {
		name       string
		pathQuadID string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing quadrant id returns bad request",
			wantCode: http.StatusBadRequest,
		},
		{
			name:       "invalid quadrant id returns bad request",
			pathQuadID: "abc",
			wantCode:   http.StatusBadRequest,
		},
		{
			name:       "fetch error returns 500",
			pathQuadID: "1",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetTechnologyQuad", mock.Anything, int32(1)).Return([]db.Technology(nil), errors.New("db error"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:       "successful fetch returns list",
			pathQuadID: "2",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetTechnologyQuad", mock.Anything, int32(2)).Return([]db.Technology{{Name: "Tech1"}}, nil)
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

			handler := handlers.GetTechnologiesByQuadrant(mockQuerier)
			req := httptest.NewRequest(http.MethodGet, "/technologies/by-quadrant/"+tt.pathQuadID, nil)
			if tt.pathQuadID != "" {
				req.SetPathValue("quadrant_id", tt.pathQuadID)
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestCreateTechnology(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "invalid JSON returns bad request",
			body:     `{invalid}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name: "database error returns 500",
			body: `{"id":"` + validUUIDStr + `", "name":"NewTech", "blip_id":1, "quadrant_id":2}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("CreateTechnology", mock.Anything, mock.AnythingOfType("db.CreateTechnologyParams")).Return(db.Technology{}, errors.New("db error"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name: "successful create returns 201",
			body: `{"id":"` + validUUIDStr + `", "name":"NewTech", "blip_id":1, "quadrant_id":2}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("CreateTechnology", mock.Anything, mock.AnythingOfType("db.CreateTechnologyParams")).Return(db.Technology{ID: validUUID, Name: "NewTech"}, nil)
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

			handler := handlers.CreateTechnology(mockQuerier)
			req := httptest.NewRequest(http.MethodPost, "/technologies", strings.NewReader(tt.body))
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestUpdateTechnology(t *testing.T) {
	tests := []struct {
		name       string
		pathID     string
		body       string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing id returns bad request",
			body:     `{"name":"UpdatedTech"}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "invalid id returns bad request",
			pathID:   "invalid-uuid",
			body:     `{"name":"UpdatedTech"}`,
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
			body:   `{"name":"UpdatedTech"}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("UpdateTechnology", mock.Anything, mock.AnythingOfType("db.UpdateTechnologyParams")).Return(db.Technology{}, errors.New("fail"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful update returns payload",
			pathID: validUUIDStr,
			body:   `{"name":"UpdatedTech"}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("UpdateTechnology", mock.Anything, mock.AnythingOfType("db.UpdateTechnologyParams")).Return(db.Technology{ID: validUUID, Name: "UpdatedTech"}, nil)
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

			handler := handlers.UpdateTechnology(mockQuerier)
			req := httptest.NewRequest(http.MethodPut, "/technologies/"+tt.pathID, strings.NewReader(tt.body))
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

func TestDeleteTechnology(t *testing.T) {
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
				m.On("DeleteTechnology", mock.Anything, validUUID).Return(errors.New("boom"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful delete returns no content",
			pathID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("DeleteTechnology", mock.Anything, validUUID).Return(nil)
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

			handler := handlers.DeleteTechnology(mockQuerier)
			req := httptest.NewRequest(http.MethodDelete, "/technologies/"+tt.pathID, nil)
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
