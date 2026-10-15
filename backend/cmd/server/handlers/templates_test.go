package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
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
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

const (
	tplTech1 = "11111111-1111-1111-1111-111111111111"
	tplTech2 = "22222222-2222-2222-2222-222222222222"
)

func TestListTemplates(t *testing.T) {
	tests := []struct {
		name     string
		rows     []db.ListTemplatesRow
		err      error
		wantCode int
		wantLen  int
	}{
		{"summaries", []db.ListTemplatesRow{{Slug: "a", Name: "A", Description: "d", TechnologyCount: 3}}, nil, http.StatusOK, 1},
		{"empty", []db.ListTemplatesRow{}, nil, http.StatusOK, 0},
		{"db error", nil, errors.New("boom"), http.StatusInternalServerError, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m := mocks.NewMockQuerier()
			m.On("ListTemplates", mock.Anything).Return(tt.rows, tt.err)
			rr := httptest.NewRecorder()
			handlers.ListTemplates(m)(rr, httptest.NewRequest(http.MethodGet, "/templates", nil))
			assert.Equal(t, tt.wantCode, rr.Code)
			if tt.wantCode == http.StatusOK {
				assert.True(t, strings.HasPrefix(strings.TrimSpace(rr.Body.String()), "["))
				var out []dto.TemplateSummary
				assert.NoError(t, json.Unmarshal(rr.Body.Bytes(), &out))
				assert.Len(t, out, tt.wantLen)
				if tt.wantLen == 1 {
					assert.Equal(t, 3, out[0].TechnologyCount)
				}
			}
		})
	}
}

func TestGetTemplate(t *testing.T) {
	techID := pgtype.UUID{Bytes: uuid.MustParse(tplTech1), Valid: true}
	tests := []struct {
		name     string
		tplErr   error
		itemsErr error
		wantCode int
	}{
		{"unknown slug", pgx.ErrNoRows, nil, http.StatusNotFound},
		{"lookup error", errors.New("boom"), nil, http.StatusInternalServerError},
		{"found", nil, nil, http.StatusOK},
		{"items error", nil, errors.New("boom"), http.StatusInternalServerError},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m := mocks.NewMockQuerier()
			m.On("GetTemplateBySlug", mock.Anything, "web").Return(db.Template{ID: 7, Slug: "web", Name: "Web"}, tt.tplErr)
			m.On("ListTemplateItems", mock.Anything, int32(7)).Return([]db.ListTemplateItemsRow{
				{TechnologyID: techID, Name: "Go", QuadrantID: 1, QuadrantName: "Languages", RingID: 2, RingName: "Trial"},
			}, tt.itemsErr).Maybe()
			req := httptest.NewRequest(http.MethodGet, "/templates/web", nil)
			req.SetPathValue("slug", "web")
			rr := httptest.NewRecorder()
			handlers.GetTemplate(m)(rr, req)
			assert.Equal(t, tt.wantCode, rr.Code)
			if tt.wantCode == http.StatusOK {
				var out dto.TemplateDetail
				assert.NoError(t, json.Unmarshal(rr.Body.Bytes(), &out))
				assert.Equal(t, "web", out.Slug)
				if assert.Len(t, out.Radar, 1) {
					assert.Equal(t, tplTech1, out.Radar[0].TechnologyID)
					assert.Equal(t, "Trial", out.Radar[0].RingName)
				}
			}
		})
	}
}

func tplBody(slug, name, desc string, items ...dto.TemplateItemRequest) []byte {
	b, _ := json.Marshal(dto.TemplateRequest{Slug: slug, Name: name, Description: desc, Items: items})
	return b
}

func tplItems() []dto.TemplateItemRequest {
	return []dto.TemplateItemRequest{{TechnologyID: tplTech1, RingID: 1}, {TechnologyID: tplTech2, RingID: 4}}
}

func adminReq(method, target string, body []byte) *http.Request {
	req := httptest.NewRequest(method, target, bytes.NewReader(body))
	ctx := context.WithValue(req.Context(), handlers.UserIDKey, uuid.MustParse(validUUIDStr))
	ctx = context.WithValue(ctx, handlers.RoleKey, "admin")
	return req.WithContext(ctx)
}

func newTplMocks() (*mocks.MockQuerier, *mocks.MockRLSExecutor) {
	m := mocks.NewMockQuerier()
	rls := mocks.NewMockRLSExecutor()
	rls.SetQuerier(m)
	return m, rls
}

func TestCreateTemplate(t *testing.T) {
	long := func(n int) string { return strings.Repeat("a", n) }
	badRequests := []struct {
		name string
		body []byte
	}{
		{"slug uppercase and space", tplBody("Bad Slug", "N", "")},
		{"slug empty", tplBody("", "N", "")},
		{"slug double hyphen", tplBody("a--b", "N", "")},
		{"slug too long", tplBody(long(65), "N", "")},
		{"empty name", tplBody("ok", "   ", "")},
		{"name too long", tplBody("ok", long(81), "")},
		{"description too long", tplBody("ok", "N", long(501))},
		{"too many items", func() []byte {
			items := make([]dto.TemplateItemRequest, 101)
			for i := range items {
				items[i] = dto.TemplateItemRequest{TechnologyID: uuid.NewString(), RingID: 1}
			}
			return tplBody("ok", "N", "", items...)
		}()},
		{"ring 5", tplBody("ok", "N", "", dto.TemplateItemRequest{TechnologyID: tplTech1, RingID: 5})},
		{"ring 0", tplBody("ok", "N", "", dto.TemplateItemRequest{TechnologyID: tplTech1, RingID: 0})},
		{"bad uuid", tplBody("ok", "N", "", dto.TemplateItemRequest{TechnologyID: "nope", RingID: 1})},
		{"duplicate technology", tplBody("ok", "N", "",
			dto.TemplateItemRequest{TechnologyID: tplTech1, RingID: 1},
			dto.TemplateItemRequest{TechnologyID: tplTech1, RingID: 2})},
		{"name NUL byte", tplBody("ok", "a\x00b", "")},
		{"description NUL byte", tplBody("ok", "N", "a\x00b")},
		{"invalid json", []byte("{")},
	}
	for _, tt := range badRequests {
		t.Run("400 "+tt.name, func(t *testing.T) {
			m, rls := newTplMocks()
			rr := httptest.NewRecorder()
			handlers.CreateTemplate(rls)(rr, adminReq(http.MethodPost, "/templates", tt.body))
			assert.Equal(t, http.StatusBadRequest, rr.Code)
			rls.AssertNotCalled(t, "Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
			m.AssertNotCalled(t, "CreateTemplate", mock.Anything, mock.Anything)
			m.AssertNotCalled(t, "AddTemplateItem", mock.Anything, mock.Anything)
		})
	}

	t.Run("unauthorized", func(t *testing.T) {
		_, rls := newTplMocks()
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/templates", bytes.NewReader(tplBody("ok", "N", "")))
		handlers.CreateTemplate(rls)(rr, req)
		assert.Equal(t, http.StatusUnauthorized, rr.Code)
	})

	t.Run("success", func(t *testing.T) {
		m, rls := newTplMocks()
		rls.On("Execute", mock.Anything, mock.Anything, "admin", mock.Anything).Return(nil).Once()
		var order []string
		m.On("CreateTemplate", mock.Anything, db.CreateTemplateParams{Slug: "web", Name: "Web", Description: "d"}).
			Run(func(mock.Arguments) { order = append(order, "create") }).
			Return(db.Template{ID: 9, Slug: "web", Name: "Web", Description: "d"}, nil).Once()
		m.On("AddTemplateItem", mock.Anything, mock.AnythingOfType("db.AddTemplateItemParams")).
			Run(func(mock.Arguments) { order = append(order, "add") }).Return(nil).Twice()
		rr := httptest.NewRecorder()
		handlers.CreateTemplate(rls)(rr, adminReq(http.MethodPost, "/templates", tplBody("web", " Web ", "d", tplItems()...)))
		assert.Equal(t, http.StatusCreated, rr.Code)
		assert.Equal(t, []string{"create", "add", "add"}, order)
		var out dto.TemplateSummary
		assert.NoError(t, json.Unmarshal(rr.Body.Bytes(), &out))
		assert.Equal(t, 2, out.TechnologyCount)
		m.AssertExpectations(t)
	})

	t.Run("multibyte within rune limit but over byte limit accepted", func(t *testing.T) {
		m, rls := newTplMocks()
		name := strings.Repeat("é", 80)  // 160 bytes
		desc := strings.Repeat("日", 500) // 1500 bytes
		rls.On("Execute", mock.Anything, mock.Anything, "admin", mock.Anything).Return(nil).Once()
		m.On("CreateTemplate", mock.Anything, db.CreateTemplateParams{Slug: "web", Name: name, Description: desc}).
			Return(db.Template{ID: 1, Slug: "web", Name: name, Description: desc}, nil).Once()
		rr := httptest.NewRecorder()
		handlers.CreateTemplate(rls)(rr, adminReq(http.MethodPost, "/templates", tplBody("web", name, desc)))
		assert.Equal(t, http.StatusCreated, rr.Code)
	})

	t.Run("duplicate slug 409", func(t *testing.T) {
		m, rls := newTplMocks()
		rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
		m.On("CreateTemplate", mock.Anything, mock.Anything).Return(db.Template{}, &pgconn.PgError{Code: "23505"}).Once()
		rr := httptest.NewRecorder()
		handlers.CreateTemplate(rls)(rr, adminReq(http.MethodPost, "/templates", tplBody("web", "Web", "", tplItems()...)))
		assert.Equal(t, http.StatusConflict, rr.Code)
		m.AssertNotCalled(t, "AddTemplateItem", mock.Anything, mock.Anything)
	})

	t.Run("unknown technology or ring 400", func(t *testing.T) {
		m, rls := newTplMocks()
		rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
		m.On("CreateTemplate", mock.Anything, mock.Anything).Return(db.Template{ID: 1, Slug: "web"}, nil).Once()
		m.On("AddTemplateItem", mock.Anything, mock.Anything).Return(&pgconn.PgError{Code: "23503"}).Once()
		rr := httptest.NewRecorder()
		handlers.CreateTemplate(rls)(rr, adminReq(http.MethodPost, "/templates", tplBody("web", "Web", "", tplItems()...)))
		assert.Equal(t, http.StatusBadRequest, rr.Code)
		assert.Contains(t, rr.Body.String(), "Unknown technology or ring")
	})

	t.Run("db error 500", func(t *testing.T) {
		m, rls := newTplMocks()
		rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
		m.On("CreateTemplate", mock.Anything, mock.Anything).Return(db.Template{}, errors.New("boom")).Once()
		rr := httptest.NewRecorder()
		handlers.CreateTemplate(rls)(rr, adminReq(http.MethodPost, "/templates", tplBody("web", "Web", "")))
		assert.Equal(t, http.StatusInternalServerError, rr.Code)
	})
}

func updateReq(body []byte) *http.Request {
	req := adminReq(http.MethodPut, "/templates/web", body)
	req.SetPathValue("slug", "web")
	return req
}

func TestUpdateTemplate(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		m, rls := newTplMocks()
		rls.On("Execute", mock.Anything, mock.Anything, "admin", mock.Anything).Return(nil).Once()
		var order []string
		m.On("UpdateTemplate", mock.Anything, db.UpdateTemplateParams{Slug: "web", Name: "Web", Description: "d"}).
			Run(func(mock.Arguments) { order = append(order, "update") }).
			Return(db.Template{ID: 9, Slug: "web", Name: "Web", Description: "d"}, nil).Once()
		m.On("DeleteTemplateItems", mock.Anything, int32(9)).
			Run(func(mock.Arguments) { order = append(order, "delete") }).Return(nil).Once()
		m.On("AddTemplateItem", mock.Anything, mock.AnythingOfType("db.AddTemplateItemParams")).
			Run(func(mock.Arguments) { order = append(order, "add") }).Return(nil).Twice()
		rr := httptest.NewRecorder()
		handlers.UpdateTemplate(rls)(rr, updateReq(tplBody("ignored", "Web", "d", tplItems()...)))
		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, []string{"update", "delete", "add", "add"}, order)
		m.AssertExpectations(t)
	})

	t.Run("unknown slug 404", func(t *testing.T) {
		m, rls := newTplMocks()
		rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
		m.On("UpdateTemplate", mock.Anything, mock.Anything).Return(db.Template{}, pgx.ErrNoRows).Once()
		rr := httptest.NewRecorder()
		handlers.UpdateTemplate(rls)(rr, updateReq(tplBody("", "Web", "")))
		assert.Equal(t, http.StatusNotFound, rr.Code)
		m.AssertNotCalled(t, "DeleteTemplateItems", mock.Anything, mock.Anything)
	})

	t.Run("invalid body 400 without writes", func(t *testing.T) {
		m, rls := newTplMocks()
		rr := httptest.NewRecorder()
		handlers.UpdateTemplate(rls)(rr, updateReq(tplBody("", "", "")))
		assert.Equal(t, http.StatusBadRequest, rr.Code)
		m.AssertNotCalled(t, "UpdateTemplate", mock.Anything, mock.Anything)
	})

	t.Run("NUL in name 400", func(t *testing.T) {
		_, rls := newTplMocks()
		rr := httptest.NewRecorder()
		handlers.UpdateTemplate(rls)(rr, updateReq(tplBody("", "a\x00", "")))
		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("unknown technology or ring 400", func(t *testing.T) {
		m, rls := newTplMocks()
		rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
		m.On("UpdateTemplate", mock.Anything, mock.Anything).Return(db.Template{ID: 9, Slug: "web"}, nil).Once()
		m.On("DeleteTemplateItems", mock.Anything, int32(9)).Return(nil).Once()
		m.On("AddTemplateItem", mock.Anything, mock.Anything).Return(&pgconn.PgError{Code: "23503"}).Once()
		rr := httptest.NewRecorder()
		handlers.UpdateTemplate(rls)(rr, updateReq(tplBody("", "Web", "", tplItems()...)))
		assert.Equal(t, http.StatusBadRequest, rr.Code)
		assert.Contains(t, rr.Body.String(), "Unknown technology or ring")
	})

	t.Run("db error 500", func(t *testing.T) {
		m, rls := newTplMocks()
		rls.On("Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
		m.On("UpdateTemplate", mock.Anything, mock.Anything).Return(db.Template{}, errors.New("boom")).Once()
		rr := httptest.NewRecorder()
		handlers.UpdateTemplate(rls)(rr, updateReq(tplBody("", "Web", "")))
		assert.Equal(t, http.StatusInternalServerError, rr.Code)
	})
}

func TestDeleteTemplate(t *testing.T) {
	tests := []struct {
		name     string
		n        int64
		err      error
		wantCode int
	}{
		{"deleted", 1, nil, http.StatusNoContent},
		{"not found", 0, nil, http.StatusNotFound},
		{"db error", 0, errors.New("boom"), http.StatusInternalServerError},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			m, rls := newTplMocks()
			rls.On("Execute", mock.Anything, mock.Anything, "admin", mock.Anything).Return(nil).Once()
			m.On("DeleteTemplate", mock.Anything, "web").Return(tt.n, tt.err).Once()
			req := adminReq(http.MethodDelete, "/templates/web", nil)
			req.SetPathValue("slug", "web")
			rr := httptest.NewRecorder()
			handlers.DeleteTemplate(rls)(rr, req)
			assert.Equal(t, tt.wantCode, rr.Code)
		})
	}
}

func TestTemplatePathSlugHygiene(t *testing.T) {
	for _, slug := range []string{"a\x00b", "a\xffb", "Bad Slug", strings.Repeat("a", 65)} {
		t.Run("404 "+strings.ToValidUTF8(strings.ReplaceAll(slug, "\x00", "NUL"), "?"), func(t *testing.T) {
			m, rls := newTplMocks()
			get := httptest.NewRequest(http.MethodGet, "/templates/x", nil)
			get.SetPathValue("slug", slug)
			rr := httptest.NewRecorder()
			handlers.GetTemplate(m)(rr, get)
			assert.Equal(t, http.StatusNotFound, rr.Code)

			up := updateReq(tplBody("", "Web", ""))
			up.SetPathValue("slug", slug)
			rr = httptest.NewRecorder()
			handlers.UpdateTemplate(rls)(rr, up)
			assert.Equal(t, http.StatusNotFound, rr.Code)

			del := adminReq(http.MethodDelete, "/templates/x", nil)
			del.SetPathValue("slug", slug)
			rr = httptest.NewRecorder()
			handlers.DeleteTemplate(rls)(rr, del)
			assert.Equal(t, http.StatusNotFound, rr.Code)
			m.AssertNotCalled(t, "GetTemplateBySlug", mock.Anything, mock.Anything)
			rls.AssertNotCalled(t, "Execute", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
		})
	}
}
