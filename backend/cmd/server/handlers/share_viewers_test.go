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
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

var otherUserUUID = uuid.MustParse("660e8400-e29b-41d4-a716-446655440001")

func ownerRequest(method, target, body string, loggedIn bool) *http.Request {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	if loggedIn {
		ctx := context.WithValue(req.Context(), handlers.UserIDKey, uuid.MustParse(validUUIDStr))
		ctx = context.WithValue(ctx, handlers.RoleKey, "user")
		req = req.WithContext(ctx)
	}
	return req
}

func newOwnerMocks() (*mocks.MockQuerier, *mocks.MockRLSExecutor) {
	m := mocks.NewMockQuerier()
	rls := mocks.NewMockRLSExecutor()
	rls.SetQuerier(m)
	rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	m.On("GetShareCodeByUserId", mock.Anything, mock.AnythingOfType("pgtype.UUID")).Return(db.ShareCode{
		ID:     "abc123",
		UserID: pgtype.UUID{Bytes: uuid.MustParse(validUUIDStr), Valid: true},
	}, nil).Maybe()
	return m, rls
}

func TestSetShareVisibility(t *testing.T) {
	tests := []struct {
		name     string
		loggedIn bool
		body     string
		setup    func(*mocks.MockQuerier)
		want     int
	}{
		{name: "unauthenticated", body: `{"visibility":"public"}`, want: http.StatusUnauthorized},
		{name: "bad json", loggedIn: true, body: `{`, want: http.StatusBadRequest},
		{name: "invalid value", loggedIn: true, body: `{"visibility":"friends"}`, want: http.StatusBadRequest},
		{
			name: "success", loggedIn: true, body: `{"visibility":"public"}`, want: http.StatusOK,
			setup: func(m *mocks.MockQuerier) {
				m.On("SetShareCodeVisibility", mock.Anything, mock.MatchedBy(func(p db.SetShareCodeVisibilityParams) bool {
					return p.Visibility == "public" && p.UserID.Valid
				})).Return(db.ShareCode{ID: "abc123", Visibility: "public"}, nil)
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m, rls := newOwnerMocks()
			if tt.setup != nil {
				tt.setup(m)
			}
			rec := httptest.NewRecorder()
			handlers.SetShareVisibility(rls)(rec, ownerRequest(http.MethodPatch, "/share-codes/my", tt.body, tt.loggedIn))
			assert.Equal(t, tt.want, rec.Code)
			if tt.want == http.StatusOK {
				var resp map[string]any
				assert.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
				assert.Equal(t, "public", resp["visibility"])
			}
		})
	}
}

func TestAddShareViewer(t *testing.T) {
	bob := db.User{ID: pgtype.UUID{Bytes: otherUserUUID, Valid: true}, Username: "bob"}
	self := db.User{ID: pgtype.UUID{Bytes: uuid.MustParse(validUUIDStr), Valid: true}, Username: "me"}

	tests := []struct {
		name     string
		loggedIn bool
		body     string
		setup    func(*mocks.MockQuerier)
		want     int
	}{
		{name: "unauthenticated", body: `{"username":"bob"}`, want: http.StatusUnauthorized},
		{name: "empty username", loggedIn: true, body: `{"username":"   "}`, want: http.StatusBadRequest},
		{
			name: "unknown user", loggedIn: true, body: `{"username":"ghost"}`, want: http.StatusNotFound,
			setup: func(m *mocks.MockQuerier) {
				m.On("GetUserByUsername", mock.Anything, "ghost").Return(db.User{}, pgx.ErrNoRows)
			},
		},
		{
			name: "cannot add yourself", loggedIn: true, body: `{"username":"me"}`, want: http.StatusBadRequest,
			setup: func(m *mocks.MockQuerier) {
				m.On("GetUserByUsername", mock.Anything, "me").Return(self, nil)
			},
		},
		{
			name: "lookup db error", loggedIn: true, body: `{"username":"bob"}`, want: http.StatusInternalServerError,
			setup: func(m *mocks.MockQuerier) {
				m.On("GetUserByUsername", mock.Anything, "bob").Return(db.User{}, errors.New("boom"))
			},
		},
		{
			name: "success trims whitespace", loggedIn: true, body: `{"username":"  bob "}`, want: http.StatusNoContent,
			setup: func(m *mocks.MockQuerier) {
				m.On("GetUserByUsername", mock.Anything, "bob").Return(bob, nil)
				m.On("AddShareCodeViewer", mock.Anything, db.AddShareCodeViewerParams{ShareCodeID: "abc123", UserID: bob.ID}).Return(nil)
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m, rls := newOwnerMocks()
			if tt.setup != nil {
				tt.setup(m)
			}
			rec := httptest.NewRecorder()
			handlers.AddShareViewer(m, rls)(rec, ownerRequest(http.MethodPost, "/share-codes/my/viewers", tt.body, tt.loggedIn))
			assert.Equal(t, tt.want, rec.Code)
			m.AssertExpectations(t)
		})
	}
}

func TestRemoveShareViewer(t *testing.T) {
	bob := db.User{ID: pgtype.UUID{Bytes: otherUserUUID, Valid: true}, Username: "bob"}
	tests := []struct {
		name     string
		loggedIn bool
		username string
		setup    func(*mocks.MockQuerier)
		want     int
	}{
		{name: "unauthenticated", username: "bob", want: http.StatusUnauthorized},
		{
			name: "unknown user", loggedIn: true, username: "ghost", want: http.StatusNotFound,
			setup: func(m *mocks.MockQuerier) {
				m.On("GetUserByUsername", mock.Anything, "ghost").Return(db.User{}, pgx.ErrNoRows)
			},
		},
		{
			name: "success", loggedIn: true, username: "bob", want: http.StatusNoContent,
			setup: func(m *mocks.MockQuerier) {
				m.On("GetUserByUsername", mock.Anything, "bob").Return(bob, nil)
				m.On("RemoveShareCodeViewer", mock.Anything, db.RemoveShareCodeViewerParams{ShareCodeID: "abc123", UserID: bob.ID}).Return(nil)
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m, rls := newOwnerMocks()
			if tt.setup != nil {
				tt.setup(m)
			}
			req := ownerRequest(http.MethodDelete, "/share-codes/my/viewers/"+tt.username, "", tt.loggedIn)
			req.SetPathValue("username", tt.username)
			rec := httptest.NewRecorder()
			handlers.RemoveShareViewer(m, rls)(rec, req)
			assert.Equal(t, tt.want, rec.Code)
			m.AssertExpectations(t)
		})
	}
}

func TestListShareViewers(t *testing.T) {
	tests := []struct {
		name    string
		viewers []string
		want    string
	}{
		{name: "lists usernames", viewers: []string{"bob", "carol"}, want: `["bob","carol"]`},
		{name: "empty is an empty array not null", viewers: nil, want: `[]`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m, rls := newOwnerMocks()
			m.On("ListShareCodeViewers", mock.Anything, "abc123").Return(tt.viewers, nil)
			rec := httptest.NewRecorder()
			handlers.ListShareViewers(m, rls)(rec, ownerRequest(http.MethodGet, "/share-codes/my/viewers", "", true))
			assert.Equal(t, http.StatusOK, rec.Code)
			var resp struct {
				Viewers json.RawMessage `json:"viewers"`
			}
			assert.NoError(t, json.Unmarshal(rec.Body.Bytes(), &resp))
			assert.JSONEq(t, tt.want, string(resp.Viewers))
		})
	}

	t.Run("unauthenticated", func(t *testing.T) {
		m, rls := newOwnerMocks()
		rec := httptest.NewRecorder()
		handlers.ListShareViewers(m, rls)(rec, ownerRequest(http.MethodGet, "/share-codes/my/viewers", "", false))
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})
}
