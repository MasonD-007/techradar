package handlers_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers"
	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/mocks"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestGetUserTechnology(t *testing.T) {
	testUserID := uuid.MustParse(validUUIDStr)
	tests := []struct {
		name       string
		pathID     string
		userID     string
		mockExpect func(*mocks.MockQuerier, *mocks.MockRLSExecutor)
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
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{}, errors.New("not found"))
			},
			wantCode: http.StatusNotFound,
		},
		{
			name:   "successful fetch returns user technology",
			pathID: validUUIDStr,
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{ID: validUUID, UserID: validUUID, RingID: 3}, nil)
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

			handler := handlers.GetUserTechnology(mockQuerier, mockRLS)
			req := httptest.NewRequest(http.MethodGet, "/user-technologies/"+tt.pathID, nil)
			if tt.pathID != "" {
				req.SetPathValue("id", tt.pathID)
			}
			if tt.userID != "" {
				req = req.WithContext(context.WithValue(req.Context(), handlers.UserIDKey, testUserID))
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
	testUserID := uuid.MustParse(validUUIDStr)
	tests := []struct {
		name       string
		pathUserID string
		mockExpect func(*mocks.MockQuerier, *mocks.MockRLSExecutor)
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
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("GetUserTechnologyUserId", mock.Anything, validUUID).Return([]db.UserTechnology(nil), errors.New("db error"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:       "successful fetch returns list",
			pathUserID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("GetUserTechnologyUserId", mock.Anything, validUUID).Return([]db.UserTechnology{{RingID: 2}}, nil)
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

			handler := handlers.GetUserTechnologiesByUser(mockQuerier, mockRLS)
			req := httptest.NewRequest(http.MethodGet, "/user-technologies/user/"+tt.pathUserID, nil)
			if tt.pathUserID != "" {
				req.SetPathValue("user_id", tt.pathUserID)
			}
			if tt.pathUserID == validUUIDStr {
				req = req.WithContext(context.WithValue(req.Context(), handlers.UserIDKey, testUserID))
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
		mockExpect func(*mocks.MockQuerier, *mocks.MockRLSExecutor)
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
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("CreateUserTechnology", mock.Anything, mock.AnythingOfType("db.CreateUserTechnologyParams")).Return(db.UserTechnology{}, errors.New("db error"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name: "successful create returns 201",
			body: `{"user_id":"` + validUUIDStr + `", "technology_id":"` + validUUIDStr + `", "ring_id":1}`,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("CreateUserTechnology", mock.Anything, mock.AnythingOfType("db.CreateUserTechnologyParams")).Return(db.UserTechnology{ID: validUUID, RingID: 1}, nil)
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

			handler := handlers.CreateUserTechnology(mockQuerier, mockRLS)
			req := httptest.NewRequest(http.MethodPost, "/user-technologies", strings.NewReader(tt.body))
			req = req.WithContext(context.WithValue(req.Context(), handlers.UserIDKey, uuid.MustParse(validUUIDStr)))
			recorder := httptest.NewRecorder()
			handler(recorder, req)

			assert.Equal(t, tt.wantCode, recorder.Code)
			mockQuerier.AssertExpectations(t)
		})
	}
}

func TestUpdateUserTechnology(t *testing.T) {
	testUserID := uuid.MustParse(validUUIDStr)
	tests := []struct {
		name       string
		pathID     string
		body       string
		userID     string
		mockExpect func(*mocks.MockQuerier, *mocks.MockRLSExecutor)
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
			name:   "invalid json returns bad request",
			pathID: validUUIDStr,
			body:   `{bad}`,
			userID: validUUIDStr,
			wantCode: http.StatusBadRequest,
		},
		{
			name:   "update error returns 500",
			pathID: validUUIDStr,
			body:   `{"ring_id":2}`,
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				m.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{ID: validUUID, UserID: validUUID}, nil)
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("UpdateUserTechnology", mock.Anything, mock.Anything).Return(db.UserTechnology{}, errors.New("fail"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful update returns payload",
			pathID: validUUIDStr,
			userID: validUUIDStr,
			body:   `{"ring_id":2}`,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				m.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{ID: validUUID, UserID: validUUID}, nil)
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("UpdateUserTechnology", mock.Anything, mock.Anything).Return(db.UserTechnology{ID: validUUID, RingID: 2}, nil)
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

			handler := handlers.UpdateUserTechnology(mockQuerier, mockRLS)
			req := httptest.NewRequest(http.MethodPut, "/user-technologies/"+tt.pathID, strings.NewReader(tt.body))
			if tt.pathID != "" {
				req.SetPathValue("id", tt.pathID)
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

func TestDeleteUserTechnology(t *testing.T) {
	testUserID := uuid.MustParse(validUUIDStr)
	tests := []struct {
		name       string
		pathID     string
		userID     string
		mockExpect func(*mocks.MockQuerier, *mocks.MockRLSExecutor)
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
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				m.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{ID: validUUID, UserID: validUUID}, nil)
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("DeleteUserTechnology", mock.Anything, validUUID).Return(errors.New("boom"))
			},
			wantCode: http.StatusInternalServerError,
		},
		{
			name:   "successful delete returns no content",
			pathID: validUUIDStr,
			userID: validUUIDStr,
			mockExpect: func(m *mocks.MockQuerier, rls *mocks.MockRLSExecutor) {
				m.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{ID: validUUID, UserID: validUUID}, nil)
				rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
				m.On("DeleteUserTechnology", mock.Anything, validUUID).Return(nil)
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

			handler := handlers.DeleteUserTechnology(mockQuerier, mockRLS)
			req := httptest.NewRequest(http.MethodDelete, "/user-technologies/"+tt.pathID, nil)
			if tt.pathID != "" {
				req.SetPathValue("id", tt.pathID)
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

var (
	callerUUID = uuid.MustParse(validUUIDStr)
	otherUUID  = uuid.MustParse("11111111-1111-1111-1111-111111111111")
)

// withCaller attaches an authenticated identity to the request context.
func withCaller(r *http.Request, id uuid.UUID, role string) *http.Request {
	ctx := context.WithValue(r.Context(), handlers.UserIDKey, id)
	ctx = context.WithValue(ctx, handlers.RoleKey, role)
	return r.WithContext(ctx)
}

type caller struct {
	set  bool
	id   uuid.UUID
	role string
}

var (
	anon       = caller{}
	asOwner    = caller{set: true, id: callerUUID, role: "user"}
	asOther    = caller{set: true, id: otherUUID, role: "user"}
	asAdmin    = caller{set: true, id: otherUUID, role: "admin"}
	ownerPgUID = validUUID
)

func (c caller) apply(r *http.Request) *http.Request {
	if !c.set {
		return r
	}
	return withCaller(r, c.id, c.role)
}

func TestGetUserTechnologiesByUser_Authz(t *testing.T) {
	tests := []struct {
		name       string
		caller     caller
		wantCode   int
		wantReads  bool
	}{
		{"owner allowed", asOwner, http.StatusOK, true},
		{"admin allowed", asAdmin, http.StatusOK, true},
		{"different user denied", asOther, http.StatusForbidden, false},
		{"unauthenticated denied", anon, http.StatusUnauthorized, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mq := mocks.NewMockQuerier()
			rls := mocks.NewMockRLSExecutor()
			rls.SetQuerier(mq)
			rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()
			mq.On("GetUserTechnologyUserId", mock.Anything, validUUID).Return([]db.UserTechnology{{RingID: 2}}, nil).Maybe()
			req := httptest.NewRequest(http.MethodGet, "/user-technologies/user/"+validUUIDStr, nil)
			req.SetPathValue("user_id", validUUIDStr)
			rec := httptest.NewRecorder()
			handlers.GetUserTechnologiesByUser(mq, rls)(rec, tt.caller.apply(req))

			assert.Equal(t, tt.wantCode, rec.Code)
			if !tt.wantReads {
				assert.Empty(t, rls.Calls)
				mq.AssertNotCalled(t, "GetUserTechnologyUserId", mock.Anything, mock.Anything)
			}
		})
	}
}

func TestGetUserTechnology_Authz(t *testing.T) {
	tests := []struct {
		name     string
		caller   caller
		rowOwner pgtype.UUID
		wantCode int
	}{
		{"owner allowed", asOwner, ownerPgUID, http.StatusOK},
		{"admin allowed", asAdmin, ownerPgUID, http.StatusOK},
		{"different user gets 404", asOther, ownerPgUID, http.StatusNotFound},
		{"unauthenticated denied", anon, ownerPgUID, http.StatusUnauthorized},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mq := mocks.NewMockQuerier()
			rls := mocks.NewMockRLSExecutor()
			rls.SetQuerier(mq)
			rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()
			mq.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{ID: validUUID, UserID: tt.rowOwner, RingID: 3}, nil).Maybe()

			req := httptest.NewRequest(http.MethodGet, "/user-technologies/"+validUUIDStr, nil)
			req.SetPathValue("id", validUUIDStr)
			rec := httptest.NewRecorder()
			handlers.GetUserTechnology(mq, rls)(rec, tt.caller.apply(req))

			assert.Equal(t, tt.wantCode, rec.Code)
			if tt.wantCode != http.StatusOK {
				assert.NotContains(t, rec.Body.String(), `"ring_id"`)
			}
		})
	}
}

func TestCreateUserTechnology_Authz(t *testing.T) {
	body := func(uid string) string {
		return `{"user_id":"` + uid + `","technology_id":"` + validUUIDStr + `","ring_id":1}`
	}
	tests := []struct {
		name       string
		caller     caller
		body       string
		wantCode   int
		wantUserID pgtype.UUID
	}{
		{"owner creates own", asOwner, body(validUUIDStr), http.StatusCreated, validUUID},
		{"owner omitting user_id defaults to self", asOwner, `{"technology_id":"` + validUUIDStr + `","ring_id":1}`, http.StatusCreated, validUUID},
		{"admin creates for another user", asAdmin, body(validUUIDStr), http.StatusCreated, validUUID},
		{"user cannot create for another user", asOther, body(validUUIDStr), http.StatusForbidden, pgtype.UUID{}},
		{"unauthenticated denied", anon, body(validUUIDStr), http.StatusUnauthorized, pgtype.UUID{}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mq := mocks.NewMockQuerier()
			rls := mocks.NewMockRLSExecutor()
			rls.SetQuerier(mq)
			rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()
			mq.On("CreateUserTechnology", mock.Anything, mock.Anything).Return(db.UserTechnology{ID: validUUID, RingID: 1}, nil).Maybe()
			req := httptest.NewRequest(http.MethodPost, "/user-technologies", strings.NewReader(tt.body))
			rec := httptest.NewRecorder()
			handlers.CreateUserTechnology(mq, rls)(rec, tt.caller.apply(req))

			assert.Equal(t, tt.wantCode, rec.Code)
			if tt.wantCode != http.StatusCreated {
				assert.Empty(t, rls.Calls)
				mq.AssertNotCalled(t, "CreateUserTechnology", mock.Anything, mock.Anything)
			} else {
				mq.AssertCalled(t, "CreateUserTechnology", mock.Anything, mock.MatchedBy(func(p db.CreateUserTechnologyParams) bool {
					return p.UserID == tt.wantUserID
				}))
			}
		})
	}
}

func TestUpdateUserTechnology_Authz(t *testing.T) {
	tests := []struct {
		name     string
		caller   caller
		body     string
		wantCode int
	}{
		{"owner allowed", asOwner, `{"ring_id":2}`, http.StatusOK},
		{"admin allowed", asAdmin, `{"ring_id":2}`, http.StatusOK},
		{"different user gets 404", asOther, `{"ring_id":2}`, http.StatusNotFound},
		{"owner cannot reassign row to another user", asOwner, `{"user_id":"` + otherUUID.String() + `","ring_id":2}`, http.StatusForbidden},
		{"unauthenticated denied", anon, `{"ring_id":2}`, http.StatusUnauthorized},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mq := mocks.NewMockQuerier()
			rls := mocks.NewMockRLSExecutor()
			rls.SetQuerier(mq)
			mq.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{ID: validUUID, UserID: ownerPgUID}, nil).Maybe()
			rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()
			mq.On("UpdateUserTechnology", mock.Anything, mock.Anything).Return(db.UserTechnology{ID: validUUID, RingID: 2}, nil).Maybe()
			req := httptest.NewRequest(http.MethodPut, "/user-technologies/"+validUUIDStr, strings.NewReader(tt.body))
			req.SetPathValue("id", validUUIDStr)
			rec := httptest.NewRecorder()
			handlers.UpdateUserTechnology(mq, rls)(rec, tt.caller.apply(req))

			assert.Equal(t, tt.wantCode, rec.Code)
			if tt.wantCode != http.StatusOK {
				assert.Empty(t, rls.Calls)
				mq.AssertNotCalled(t, "UpdateUserTechnology", mock.Anything, mock.Anything)
			}
		})
	}
}

func TestDeleteUserTechnology_Authz(t *testing.T) {
	tests := []struct {
		name     string
		caller   caller
		wantCode int
	}{
		{"owner allowed", asOwner, http.StatusNoContent},
		{"admin allowed", asAdmin, http.StatusNoContent},
		{"different user gets 404", asOther, http.StatusNotFound},
		{"unauthenticated denied", anon, http.StatusUnauthorized},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mq := mocks.NewMockQuerier()
			rls := mocks.NewMockRLSExecutor()
			rls.SetQuerier(mq)
			mq.On("GetUserTechnologyID", mock.Anything, validUUID).Return(db.UserTechnology{ID: validUUID, UserID: ownerPgUID}, nil).Maybe()
			rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Maybe()
			mq.On("DeleteUserTechnology", mock.Anything, validUUID).Return(nil).Maybe()
			req := httptest.NewRequest(http.MethodDelete, "/user-technologies/"+validUUIDStr, nil)
			req.SetPathValue("id", validUUIDStr)
			rec := httptest.NewRecorder()
			handlers.DeleteUserTechnology(mq, rls)(rec, tt.caller.apply(req))

			assert.Equal(t, tt.wantCode, rec.Code)
			if tt.wantCode != http.StatusNoContent {
				assert.Empty(t, rls.Calls)
				mq.AssertNotCalled(t, "DeleteUserTechnology", mock.Anything, mock.Anything)
			}
		})
	}
}
