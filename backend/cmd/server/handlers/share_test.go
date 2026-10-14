package handlers_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers"
	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/mocks"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestCreateShareCode(t *testing.T) {
	testUserID := uuid.MustParse(validUUIDStr)
	tests := []struct {
		name       string
		userID     string
		mockExpect func(*mocks.MockQuerier, *mocks.MockRLSExecutor)
		wantCode   int
	}{
		{
			name:     "missing auth returns unauthorized",
			wantCode: http.StatusUnauthorized,
		},
		{
			name:   "existing code returned on duplicate create",
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("GetShareCodeByUserId", mock.Anything, mock.AnythingOfType("pgtype.UUID")).Return(db.ShareCode{ID: "abc123"}, nil)
			},
			wantCode: http.StatusOK,
		},
		{
			name:   "database error returns 500",
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
				m.On("GetShareCodeByUserId", mock.Anything, mock.AnythingOfType("pgtype.UUID")).Return(db.ShareCode{}, errors.New("not found"))
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(errors.New("db error")).Once()
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful create returns 201",
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
				m.On("GetShareCodeByUserId", mock.Anything, mock.AnythingOfType("pgtype.UUID")).Return(db.ShareCode{}, errors.New("not found"))
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
				m.On("CreateShareCode", mock.Anything, mock.AnythingOfType("db.CreateShareCodeParams")).Return(db.ShareCode{ID: "abc123"}, nil)
			},
			wantCode: http.StatusCreated,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			mockRLS := mocks.NewMockRLSExecutor()
			mockRLS.SetQuerier(mockQuerier)
			if tt.mockExpect != nil {
				tt.mockExpect(mockQuerier, mockRLS)
			}

			handler := handlers.CreateShareCode(mockQuerier, mockRLS)
			req := httptest.NewRequest(http.MethodPost, "/share-codes", nil)
			if tt.userID != "" {
				req = req.WithContext(context.WithValue(req.Context(), handlers.UserIDKey, testUserID))
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			if tt.wantCode == http.StatusCreated || tt.wantCode == http.StatusOK {
				var resp map[string]any
				err := json.Unmarshal(recorder.Body.Bytes(), &resp)
				assert.NoError(t, err)
				assert.Equal(t, "abc123", resp["code"])
			}
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestGetMyShareCode(t *testing.T) {
	testUserID := uuid.MustParse(validUUIDStr)
	tests := []struct {
		name       string
		userID     string
		mockExpect func(*mocks.MockQuerier, *mocks.MockRLSExecutor)
		wantCode   int
	}{
		{
			name:     "missing auth returns unauthorized",
			wantCode: http.StatusUnauthorized,
		},
		{
			name:   "not found auto-creates and returns share code",
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
				m.On("GetShareCodeByUserId", mock.Anything, mock.AnythingOfType("pgtype.UUID")).Return(db.ShareCode{}, errors.New("not found"))
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
				m.On("CreateShareCode", mock.Anything, mock.AnythingOfType("db.CreateShareCodeParams")).Return(db.ShareCode{ID: "newcode"}, nil)
			},
			wantCode: http.StatusOK,
		},
		{
			name:   "successful fetch returns share code",
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("GetShareCodeByUserId", mock.Anything, mock.AnythingOfType("pgtype.UUID")).Return(db.ShareCode{ID: "xyz789"}, nil)
			},
			wantCode: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			mockRLS := mocks.NewMockRLSExecutor()
			mockRLS.SetQuerier(mockQuerier)
			if tt.mockExpect != nil {
				tt.mockExpect(mockQuerier, mockRLS)
			}

			handler := handlers.GetMyShareCode(mockQuerier, mockRLS)
			req := httptest.NewRequest(http.MethodGet, "/share-codes/my", nil)
			if tt.userID != "" {
				req = req.WithContext(context.WithValue(req.Context(), handlers.UserIDKey, testUserID))
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			if tt.wantCode == http.StatusOK {
				var resp map[string]any
				err := json.Unmarshal(recorder.Body.Bytes(), &resp)
				assert.NoError(t, err)
				code, ok := resp["code"].(string)
				assert.True(t, ok, "code should be a string")
				assert.NotEmpty(t, code)
			}
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestGetShareCodeByCode(t *testing.T) {
	tests := []struct {
		name       string
		pathCode   string
		mockExpect func(*mocks.MockQuerier)
		wantCode   int
	}{
		{
			name:     "missing code returns bad request",
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "not found returns 404 (empty result)",
			pathCode: "nonexist",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetRadarGraphByShareCode", mock.Anything, "nonexist").Return([]db.GetRadarGraphByShareCodeRow(nil), errors.New("not found"))
			},
			wantCode: http.StatusNotFound,
		},
		{
			name:     "empty radar returns 200 with empty list",
			pathCode: "nope",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetRadarGraphByShareCode", mock.Anything, "nope").Return([]db.GetRadarGraphByShareCodeRow{}, nil)
				m.On("GetShareCodeByCode", mock.Anything, "nope").Return(db.ShareCode{
					ID:     "nope",
					UserID: pgtype.UUID{Bytes: uuid.MustParse(validUUIDStr), Valid: true},
				}, nil)
				m.On("GetUserID", mock.Anything, mock.AnythingOfType("pgtype.UUID")).Return(db.User{
					Username: "johndoe",
				}, nil)
			},
			wantCode: http.StatusOK,
		},
		{
			name:     "successful fetch returns radar graph",
			pathCode: "abc123",
			mockExpect: func(m *mocks.MockQuerier) {
				m.On("GetRadarGraphByShareCode", mock.Anything, "abc123").Return([]db.GetRadarGraphByShareCodeRow{
					{
						Username:     "johndoe",
						Name:         "React",
						QuadrantID:   2,
						QuadrantName: "tool",
						RingID:       1,
						RingName:     "adopt",
						BlipContext:  `{"description":"A UI library"}`,
					},
				}, nil)
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

			handler := handlers.GetShareCodeByCode(mockQuerier)
			req := httptest.NewRequest(http.MethodGet, "/share-codes/"+tt.pathCode, nil)
			if tt.pathCode != "" {
				req.SetPathValue("code", tt.pathCode)
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			if tt.wantCode == http.StatusOK {
				var resp map[string]any
				err := json.Unmarshal(recorder.Body.Bytes(), &resp)
				assert.NoError(t, err)
				assert.Equal(t, "johndoe", resp["username"])
				radar, ok := resp["radar"].([]any)
				assert.True(t, ok)
				if len(radar) > 0 {
					item := radar[0].(map[string]any)
					assert.Equal(t, "React", item["name"])
					assert.Equal(t, "A UI library", item["description"])
				}
			}
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestDeleteShareCode(t *testing.T) {
	testUserID := uuid.MustParse(validUUIDStr)
	tests := []struct {
		name       string
		pathCode   string
		userID     string
		mockExpect func(*mocks.MockQuerier, *mocks.MockRLSExecutor)
		wantCode   int
	}{
		{
			name:     "missing code returns bad request",
			wantCode: http.StatusBadRequest,
		},
		{
			name:     "missing auth returns unauthorized",
			pathCode: "abc123",
			wantCode: http.StatusUnauthorized,
		},
		{
			name:     "delete error returns 500",
			pathCode: "abc123",
			userID:   validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(errors.New("db error"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:     "successful delete returns no content",
			pathCode: "abc123",
			userID:   validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("DeleteShareCode", mock.Anything, "abc123").Return(nil)
			},
			wantCode: http.StatusNoContent,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockQuerier := mocks.NewMockQuerier()
			mockRLS := mocks.NewMockRLSExecutor()
			mockRLS.SetQuerier(mockQuerier)
			if tt.mockExpect != nil {
				tt.mockExpect(mockQuerier, mockRLS)
			}

			handler := handlers.DeleteShareCode(mockQuerier, mockRLS)
			req := httptest.NewRequest(http.MethodDelete, "/share-codes/"+tt.pathCode, nil)
			if tt.pathCode != "" {
				req.SetPathValue("code", tt.pathCode)
			}
			if tt.userID != "" {
				req = req.WithContext(context.WithValue(req.Context(), handlers.UserIDKey, testUserID))
			}
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}
