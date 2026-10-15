package handlers_test

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers"
	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/mocks"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

const (
	impTech1 = "11111111-1111-1111-1111-111111111111"
	impTech2 = "22222222-2222-2222-2222-222222222222"
	impTech3 = "33333333-3333-3333-3333-333333333333"
)

func pgu(s string) pgtype.UUID { return pgtype.UUID{Bytes: uuid.MustParse(s), Valid: true} }

func importGraph() []db.GetRadarGraphByShareCodeRow {
	return []db.GetRadarGraphByShareCodeRow{
		{TechnologyID: pgu(impTech1), RingID: 1},
		{TechnologyID: pgu(impTech2), RingID: 3},
	}
}

func importBody(source string, ids ...string) string {
	b := `{"source":` + source
	if len(ids) > 0 {
		j, _ := json.Marshal(ids)
		b += `,"technologyIds":` + string(j)
	}
	return b + `}`
}

func TestImportRadar(t *testing.T) {
	const codeSrc = `{"shareCode":"abc123"}`
	allowCode := func(m *mocks.MockQuerier) {
		m.On("CanViewShareCode", mock.Anything, mock.Anything).Return(true, nil)
		m.On("GetRadarGraphByShareCode", mock.Anything, "abc123").Return(importGraph(), nil)
	}
	tests := []struct {
		name      string
		loggedIn  bool
		body      string
		setup     func(*mocks.MockQuerier)
		want      int
		added     int
		skipped   int
		noCalls   []string
		insertCnt int
	}{
		{name: "unauthenticated", body: importBody(codeSrc), want: 401,
			noCalls: []string{"CanViewShareCode", "GetRadarGraphByShareCode", "AddUserTechnologyIfMissing"}},
		{name: "bad json", loggedIn: true, body: `{`, want: 400},
		{name: "body too large", loggedIn: true, body: importBody(`{"shareCode":"` + strings.Repeat("a", 2<<20) + `"}`), want: 413,
			noCalls: []string{"CanViewShareCode", "AddUserTechnologyIfMissing"}},
		{name: "neither source", loggedIn: true, body: importBody(`{}`), want: 400},
		{name: "both sources", loggedIn: true, body: importBody(`{"shareCode":"abc","templateSlug":"web"}`), want: 400,
			noCalls: []string{"CanViewShareCode", "GetTemplateBySlug"}},
		{name: "not viewable", loggedIn: true, body: importBody(codeSrc), want: 404,
			setup: func(m *mocks.MockQuerier) {
				m.On("CanViewShareCode", mock.Anything, mock.Anything).Return(false, nil)
			},
			noCalls: []string{"GetRadarGraphByShareCode", "AddUserTechnologyIfMissing"}},
		{name: "access check error", loggedIn: true, body: importBody(codeSrc), want: 500,
			setup: func(m *mocks.MockQuerier) {
				m.On("CanViewShareCode", mock.Anything, mock.Anything).Return(false, errors.New("boom"))
			},
			noCalls: []string{"GetRadarGraphByShareCode", "AddUserTechnologyIfMissing"}},
		{name: "both new", loggedIn: true, body: importBody(codeSrc), want: 200, added: 2, insertCnt: 2,
			setup: func(m *mocks.MockQuerier) {
				allowCode(m)
				m.On("AddUserTechnologyIfMissing", mock.Anything, mock.Anything).Return(int64(1), nil)
			}},
		{name: "second already owned, idempotent", loggedIn: true, body: importBody(codeSrc), want: 200, added: 1, skipped: 1, insertCnt: 2,
			setup: func(m *mocks.MockQuerier) {
				allowCode(m)
				m.On("AddUserTechnologyIfMissing", mock.Anything, mock.MatchedBy(func(p db.AddUserTechnologyIfMissingParams) bool {
					return p.TechnologyID == pgu(impTech1)
				})).Return(int64(1), nil)
				m.On("AddUserTechnologyIfMissing", mock.Anything, mock.MatchedBy(func(p db.AddUserTechnologyIfMissingParams) bool {
					return p.TechnologyID == pgu(impTech2)
				})).Return(int64(0), nil)
			}},
		{name: "second run adds nothing", loggedIn: true, body: importBody(codeSrc), want: 200, added: 0, skipped: 2, insertCnt: 2,
			setup: func(m *mocks.MockQuerier) {
				allowCode(m)
				m.On("AddUserTechnologyIfMissing", mock.Anything, mock.Anything).Return(int64(0), nil)
			}},
		{name: "subset", loggedIn: true, body: importBody(codeSrc, impTech2), want: 200, added: 1, insertCnt: 1,
			setup: func(m *mocks.MockQuerier) {
				allowCode(m)
				m.On("AddUserTechnologyIfMissing", mock.Anything, mock.MatchedBy(func(p db.AddUserTechnologyIfMissingParams) bool {
					return p.TechnologyID == pgu(impTech2) && p.RingID == 3
				})).Return(int64(1), nil)
			}},
		{name: "duplicate ids deduped", loggedIn: true, body: importBody(codeSrc, impTech1, impTech1), want: 200, added: 1, insertCnt: 1,
			setup: func(m *mocks.MockQuerier) {
				allowCode(m)
				m.On("AddUserTechnologyIfMissing", mock.Anything, mock.Anything).Return(int64(1), nil)
			}},
		{name: "id not in source", loggedIn: true, body: importBody(codeSrc, impTech1, impTech3), want: 400,
			setup:   allowCode,
			noCalls: []string{"AddUserTechnologyIfMissing"}},
		{name: "malformed uuid", loggedIn: true, body: importBody(codeSrc, "nope"), want: 400,
			setup:   allowCode,
			noCalls: []string{"AddUserTechnologyIfMissing"}},
		{name: "too many ids", loggedIn: true, body: importBody(codeSrc, manyIDs(501)...), want: 400,
			noCalls: []string{"CanViewShareCode", "AddUserTechnologyIfMissing"}},
		{name: "template not found", loggedIn: true, body: importBody(`{"templateSlug":"web"}`), want: 404,
			setup: func(m *mocks.MockQuerier) {
				m.On("GetTemplateBySlug", mock.Anything, "web").Return(db.Template{}, pgx.ErrNoRows)
			},
			noCalls: []string{"ListTemplateItems", "AddUserTechnologyIfMissing"}},
		{name: "template found", loggedIn: true, body: importBody(`{"templateSlug":"web"}`), want: 200, added: 2, insertCnt: 2,
			setup: func(m *mocks.MockQuerier) {
				m.On("GetTemplateBySlug", mock.Anything, "web").Return(db.Template{ID: 7, Slug: "web"}, nil)
				m.On("ListTemplateItems", mock.Anything, int32(7)).Return([]db.ListTemplateItemsRow{
					{TechnologyID: pgu(impTech1), RingID: 2}, {TechnologyID: pgu(impTech2), RingID: 4},
				}, nil)
				m.On("AddUserTechnologyIfMissing", mock.Anything, mock.Anything).Return(int64(1), nil)
			}},
		{name: "empty source", loggedIn: true, body: importBody(codeSrc), want: 200,
			setup: func(m *mocks.MockQuerier) {
				m.On("CanViewShareCode", mock.Anything, mock.Anything).Return(true, nil)
				m.On("GetRadarGraphByShareCode", mock.Anything, "abc123").Return([]db.GetRadarGraphByShareCodeRow{}, nil)
			},
			noCalls: []string{"AddUserTechnologyIfMissing"}},
		{name: "insert error", loggedIn: true, body: importBody(codeSrc), want: 500,
			setup: func(m *mocks.MockQuerier) {
				allowCode(m)
				m.On("AddUserTechnologyIfMissing", mock.Anything, mock.Anything).Return(int64(0), errors.New("boom"))
			}},
		// input hygiene: rejected before touching the database
		{name: "share code too long", loggedIn: true, body: importBody(`{"shareCode":"` + strings.Repeat("a", 65) + `"}`), want: 404,
			noCalls: []string{"CanViewShareCode", "GetRadarGraphByShareCode", "AddUserTechnologyIfMissing"}},
		{name: "share code NUL", loggedIn: true, body: importBody(`{"shareCode":"ab\u0000c"}`), want: 404,
			noCalls: []string{"CanViewShareCode", "GetRadarGraphByShareCode", "AddUserTechnologyIfMissing"}},
		{name: "slug too long", loggedIn: true, body: importBody(`{"templateSlug":"` + strings.Repeat("a", 65) + `"}`), want: 404,
			noCalls: []string{"GetTemplateBySlug", "AddUserTechnologyIfMissing"}},
		{name: "slug NUL", loggedIn: true, body: importBody(`{"templateSlug":"a\u0000b"}`), want: 404,
			noCalls: []string{"GetTemplateBySlug", "AddUserTechnologyIfMissing"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m, rls := newOwnerMocks()
			if tt.setup != nil {
				tt.setup(m)
			}
			rr := httptest.NewRecorder()
			handlers.ImportRadar(m, rls)(rr, ownerRequest(http.MethodPost, "/radar/import", tt.body, tt.loggedIn))
			assert.Equal(t, tt.want, rr.Code, rr.Body.String())
			if tt.want == 200 {
				var out dto.ImportResponse
				assert.NoError(t, json.Unmarshal(rr.Body.Bytes(), &out))
				assert.Equal(t, tt.added, out.Added)
				assert.Equal(t, tt.skipped, out.Skipped)
			}
			for _, c := range tt.noCalls {
				m.AssertNotCalled(t, c, mock.Anything, mock.Anything)
			}
			if tt.name == "unauthenticated" {
				assert.Empty(t, m.Calls)
				rls.AssertNotCalled(t, "Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
			}
			if tt.insertCnt > 0 {
				n := 0
				for _, c := range m.Calls {
					if c.Method == "AddUserTechnologyIfMissing" {
						n++
					}
				}
				assert.Equal(t, tt.insertCnt, n)
			}
		})
	}
}

func manyIDs(n int) []string {
	out := make([]string, n)
	for i := range out {
		out[i] = fmt.Sprintf("00000000-0000-0000-0000-%012d", i)
	}
	return out
}

func TestImportRadarInsertParams(t *testing.T) {
	m, rls := newOwnerMocks()
	m.On("CanViewShareCode", mock.Anything, mock.Anything).Return(true, nil)
	m.On("GetRadarGraphByShareCode", mock.Anything, "abc123").Return(importGraph(), nil)
	m.On("AddUserTechnologyIfMissing", mock.Anything, mock.Anything).Return(int64(1), nil)
	rr := httptest.NewRecorder()
	handlers.ImportRadar(m, rls)(rr, ownerRequest(http.MethodPost, "/radar/import", importBody(`{"shareCode":"abc123"}`), true))
	assert.Equal(t, 200, rr.Code)
	ids := map[pgtype.UUID]bool{}
	rings := map[pgtype.UUID]int32{}
	for _, c := range m.Calls {
		if c.Method != "AddUserTechnologyIfMissing" {
			continue
		}
		p := c.Arguments.Get(1).(db.AddUserTechnologyIfMissingParams)
		assert.Equal(t, pgu(validUUIDStr), p.UserID)
		assert.True(t, p.ID.Valid)
		assert.NotEqual(t, [16]byte{}, p.ID.Bytes)
		ids[p.ID] = true
		rings[p.TechnologyID] = p.RingID
	}
	assert.Len(t, ids, 2)
	assert.Equal(t, int32(1), rings[pgu(impTech1)])
	assert.Equal(t, int32(3), rings[pgu(impTech2)])
}

func TestImportRadarAdminFlag(t *testing.T) {
	for _, role := range []string{"admin", "user"} {
		t.Run(role, func(t *testing.T) {
			m, rls := newOwnerMocks()
			m.On("CanViewShareCode", mock.Anything, mock.MatchedBy(func(p db.CanViewShareCodeParams) bool {
				return p.IsAdmin == (role == "admin") && p.Code == "abc123" && p.ViewerID == pgu(validUUIDStr)
			})).Return(false, nil)
			req := ownerRequest(http.MethodPost, "/radar/import", importBody(`{"shareCode":"abc123"}`), true)
			ctx := context.WithValue(req.Context(), handlers.RoleKey, role)
			rr := httptest.NewRecorder()
			handlers.ImportRadar(m, rls)(rr, req.WithContext(ctx))
			assert.Equal(t, 404, rr.Code)
			m.AssertExpectations(t)
		})
	}
}
