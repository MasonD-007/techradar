package handlers_test

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers"
	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/mocks"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func galleryRows(n int) []db.ListGalleryRadarsRow {
	rows := make([]db.ListGalleryRadarsRow, n)
	for i := range rows {
		rows[i] = db.ListGalleryRadarsRow{
			Code:      fmt.Sprintf("code%02d", i),
			Username:  fmt.Sprintf("user%02d", i),
			BlipCount: 3,
			UpdatedAt: pgtype.Timestamptz{Valid: true},
		}
	}
	return rows
}

func serveGallery(m *mocks.MockQuerier, target string) *httptest.ResponseRecorder {
	rr := httptest.NewRecorder()
	handlers.GetGallery(m)(rr, httptest.NewRequest(http.MethodGet, target, nil))
	return rr
}

func decodeGallery(t *testing.T, rr *httptest.ResponseRecorder) dto.GalleryResponse {
	t.Helper()
	var resp dto.GalleryResponse
	assert.NoError(t, json.Unmarshal(rr.Body.Bytes(), &resp))
	return resp
}

func TestGetGallery(t *testing.T) {
	anyTechs := func(m *mocks.MockQuerier) {
		m.On("ListGalleryTopTechnologies", mock.Anything, mock.Anything).Return([]db.ListGalleryTopTechnologiesRow{}, nil).Maybe()
	}

	t.Run("default params", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		anyTechs(m)
		m.On("ListGalleryRadars", mock.Anything, db.ListGalleryRadarsParams{PageLimit: 13, PageOffset: 0}).Return(galleryRows(2), nil).Once()
		rr := serveGallery(m, "/gallery")
		assert.Equal(t, http.StatusOK, rr.Code)
		resp := decodeGallery(t, rr)
		assert.Len(t, resp.Radars, 2)
		assert.False(t, resp.HasMore)
		assert.Equal(t, 1, resp.Page)
		m.AssertExpectations(t)
	})

	t.Run("has_more when 13 rows come back", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		anyTechs(m)
		m.On("ListGalleryRadars", mock.Anything, mock.Anything).Return(galleryRows(13), nil)
		resp := decodeGallery(t, serveGallery(m, "/gallery"))
		assert.Len(t, resp.Radars, 12)
		assert.True(t, resp.HasMore)
	})

	t.Run("page 3 offset", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		anyTechs(m)
		m.On("ListGalleryRadars", mock.Anything, db.ListGalleryRadarsParams{PageLimit: 13, PageOffset: 24}).Return(galleryRows(1), nil).Once()
		rr := serveGallery(m, "/gallery?page=3")
		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, 3, decodeGallery(t, rr).Page)
		m.AssertExpectations(t)
	})

	t.Run("bad page falls back to 1", func(t *testing.T) {
		for _, target := range []string{"/gallery?page=abc", "/gallery?page=-2"} {
			m := mocks.NewMockQuerier()
			anyTechs(m)
			m.On("ListGalleryRadars", mock.Anything, db.ListGalleryRadarsParams{PageLimit: 13, PageOffset: 0}).Return(galleryRows(1), nil).Once()
			rr := serveGallery(m, target)
			assert.Equal(t, http.StatusOK, rr.Code, target)
			assert.Equal(t, 1, decodeGallery(t, rr).Page, target)
			m.AssertExpectations(t)
		}
	})

	t.Run("quadrant filter", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		anyTechs(m)
		m.On("ListGalleryRadars", mock.Anything, db.ListGalleryRadarsParams{
			Quadrant: pgtype.Int4{Int32: 2, Valid: true}, PageLimit: 13,
		}).Return(galleryRows(1), nil).Once()
		rr := serveGallery(m, "/gallery?quadrant=2")
		assert.Equal(t, http.StatusOK, rr.Code)
		m.AssertExpectations(t)
	})

	t.Run("invalid quadrant", func(t *testing.T) {
		for _, target := range []string{"/gallery?quadrant=9", "/gallery?quadrant=x"} {
			m := mocks.NewMockQuerier()
			rr := serveGallery(m, target)
			assert.Equal(t, http.StatusBadRequest, rr.Code, target)
			m.AssertNotCalled(t, "ListGalleryRadars", mock.Anything, mock.Anything)
		}
	})

	t.Run("search escapes wildcards", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		anyTechs(m)
		m.On("ListGalleryRadars", mock.Anything, db.ListGalleryRadarsParams{
			Search: pgtype.Text{String: "100\\%\\_x", Valid: true}, PageLimit: 13,
		}).Return(galleryRows(1), nil).Once()
		rr := serveGallery(m, "/gallery?q=100%25_x")
		assert.Equal(t, http.StatusOK, rr.Code)
		m.AssertExpectations(t)
	})

	t.Run("search sanitising", func(t *testing.T) {
		long := strings.Repeat("é", 100)
		cases := []struct{ name, target, want string }{
			{"backslash escaped", "/gallery?q=a%5Cb", `a\\b`},
			{"multibyte truncated by runes", "/gallery?q=" + long, strings.Repeat("é", 64)},
			{"invalid utf8 dropped", "/gallery?q=ab%FFcd", "abcd"},
			{"nul stripped", "/gallery?q=ab%00cd", "abcd"},
		}
		for _, c := range cases {
			m := mocks.NewMockQuerier()
			anyTechs(m)
			m.On("ListGalleryRadars", mock.Anything, mock.MatchedBy(func(p db.ListGalleryRadarsParams) bool {
				return p.Search.Valid && p.Search.String == c.want && utf8.ValidString(p.Search.String) &&
					utf8.RuneCountInString(p.Search.String) <= 64 && !strings.ContainsRune(p.Search.String, 0)
			})).Return(galleryRows(1), nil).Once()
			rr := serveGallery(m, c.target)
			assert.Equal(t, http.StatusOK, rr.Code, c.name)
			m.AssertExpectations(t)
		}
	})

	t.Run("huge page is clamped", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		anyTechs(m)
		m.On("ListGalleryRadars", mock.Anything, db.ListGalleryRadarsParams{PageLimit: 13, PageOffset: 119988}).Return(galleryRows(1), nil).Once()
		rr := serveGallery(m, "/gallery?page=200000000")
		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, 10000, decodeGallery(t, rr).Page)
		m.AssertExpectations(t)
	})

	t.Run("blank search is no filter", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		anyTechs(m)
		m.On("ListGalleryRadars", mock.Anything, mock.MatchedBy(func(p db.ListGalleryRadarsParams) bool {
			return !p.Search.Valid
		})).Return(galleryRows(1), nil).Once()
		serveGallery(m, "/gallery?q=%20%20")
		m.AssertExpectations(t)
	})

	t.Run("top technologies grouped and capped", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		rows := []db.ListGalleryRadarsRow{{Code: "abc123", Username: "alice", BlipCount: 7}}
		m.On("ListGalleryRadars", mock.Anything, mock.Anything).Return(rows, nil)
		var techs []db.ListGalleryTopTechnologiesRow
		for i := 1; i <= 7; i++ {
			techs = append(techs, db.ListGalleryTopTechnologiesRow{Code: "abc123", Name: fmt.Sprintf("tech%d", i), RingID: 1})
		}
		m.On("ListGalleryTopTechnologies", mock.Anything, []string{"abc123"}).Return(techs, nil).Once()
		resp := decodeGallery(t, serveGallery(m, "/gallery"))
		assert.Equal(t, []string{"tech1", "tech2", "tech3", "tech4", "tech5"}, resp.Radars[0].TopTechnologies)
		m.AssertExpectations(t)
	})

	t.Run("no email in body", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		anyTechs(m)
		m.On("ListGalleryRadars", mock.Anything, mock.Anything).Return(galleryRows(2), nil)
		rr := serveGallery(m, "/gallery")
		assert.NotContains(t, strings.ToLower(rr.Body.String()), `"email"`)
	})

	t.Run("empty result", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		m.On("ListGalleryRadars", mock.Anything, mock.Anything).Return([]db.ListGalleryRadarsRow{}, nil)
		rr := serveGallery(m, "/gallery")
		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Contains(t, rr.Body.String(), `"radars":[]`)
		m.AssertNotCalled(t, "ListGalleryTopTechnologies", mock.Anything, mock.Anything)
	})

	t.Run("db error", func(t *testing.T) {
		m := mocks.NewMockQuerier()
		m.On("ListGalleryRadars", mock.Anything, mock.Anything).Return(nil, errors.New("boom"))
		assert.Equal(t, http.StatusInternalServerError, serveGallery(m, "/gallery").Code)
	})
}
