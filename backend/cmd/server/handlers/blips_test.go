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
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestGetBlip(t *testing.T) {
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
			pathID:   "abc",
			wantCode: http.StatusBadRequest,
		},
		{
			name:   "not found error returns 404",
			pathID: "5",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetBlip", mock.Anything, int32(5)).Return(db.Blip{}, pgx.ErrNoRows)
			},
			wantCode: http.StatusNotFound,
		},
		{
			name:   "successful fetch returns blip",
			pathID: "7",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetBlip", mock.Anything, int32(7)).Return(db.Blip{ID: 7, Context: []byte("hello")}, nil)
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

			handler := handlers.GetBlip(mockQuerier)
			req := httptest.NewRequest(http.MethodGet, "/blips/"+tt.pathID, nil)
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
				assert.Equal(t, float64(7), resp["id"])
			}

			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestCreateBlip(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "invalid JSON returns bad request",
			body:     `{"context":123}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name: "database error returns 500",
			body: `{"context":{"message":"hello"}}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("CreateBlip", mock.Anything, []byte(`{"message":"hello"}`)).Return(db.Blip{}, errors.New("oops"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name: "successful create returns 201",
			body: `{"context":{"message":"hello"}}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("CreateBlip", mock.Anything, []byte(`{"message":"hello"}`)).Return(db.Blip{ID: 1, Context: []byte(`{"message":"hello"}`)}, nil)
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

			handler := handlers.CreateBlip(mockQuerier)
			req := httptest.NewRequest(http.MethodPost, "/blips", strings.NewReader(tt.body))
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestUpdateBlip(t *testing.T) {
	tests := []struct {
		name       string
		pathID     string
		body       string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing id returns bad request",
			body:     `{"context":{"message":"hello"}}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "invalid id returns bad request",
			pathID:   "abc",
			body:     `{"context":{"message":"hello"}}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "invalid json returns bad request",
			pathID:   "1",
			body:     `{"context":5}`,
			wantCode: http.StatusBadRequest,
		},
		{
			name:   "update error returns 500",
			pathID: "2",
			body:   `{"context":{"message":"hello"}}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("UpdateBlip", mock.Anything, db.UpdateBlipParams{ID: 2, Context: []byte(`{"message":"hello"}`)}).Return(db.Blip{}, errors.New("fail"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful update returns payload",
			pathID: "3",
			body:   `{"context":{"message":"hello"}}`,
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("UpdateBlip", mock.Anything, db.UpdateBlipParams{ID: 3, Context: []byte(`{"message":"hello"}`)}).Return(db.Blip{ID: 3, Context: []byte(`{"message":"hello"}`)}, nil)
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

			handler := handlers.UpdateBlip(mockQuerier)
			req := httptest.NewRequest(http.MethodPut, "/blips/"+tt.pathID, strings.NewReader(tt.body))
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

func TestDeleteBlip(t *testing.T) {
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
			pathID:   "bad",
			wantCode: http.StatusBadRequest,
		},
		{
			name:   "delete error returns 500",
			pathID: "4",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("DeleteBlip", mock.Anything, int32(4)).Return(errors.New("boom"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful delete returns no content",
			pathID: "6",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("DeleteBlip", mock.Anything, int32(6)).Return(nil)
			},
			wantCode: http.StatusNoContent,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			if tt.mockExpect != nil {
				tt := tt
				tt.mockExpect(mockQuerier)
			}

			handler := handlers.DeleteBlip(mockQuerier)
			req := httptest.NewRequest(http.MethodDelete, "/blips/"+tt.pathID, nil)
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
