package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MasonD-007/techradar/backend/internal/auth"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func discoveryRouter() chi.Router {
	r := chi.NewRouter()
	// nil deps are fine: middleware must reject before any handler runs.
	registerDiscoveryRoutes(r, (*db.Queries)(nil), nil)
	return r
}

var protectedDiscoveryRoutes = []struct{ method, path string }{
	{http.MethodPost, "/templates"},
	{http.MethodPut, "/templates/some-slug"},
	{http.MethodDelete, "/templates/some-slug"},
	{http.MethodPost, "/radar/import"},
}

func TestDiscoveryRoutes_RequireAuth(t *testing.T) {
	r := discoveryRouter()
	for _, rt := range protectedDiscoveryRoutes {
		req := httptest.NewRequest(rt.method, rt.path, nil)
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusUnauthorized, rec.Code, "%s %s", rt.method, rt.path)
	}
}

func TestDiscoveryRoutes_TemplateAdminRoutesForbidNonAdmin(t *testing.T) {
	token, err := auth.GenerateToken(uuid.New(), "regularuser", "user")
	assert.NoError(t, err)

	r := discoveryRouter()
	for _, rt := range protectedDiscoveryRoutes[:3] {
		req := httptest.NewRequest(rt.method, rt.path, nil)
		req.Header.Set("Authorization", "Bearer "+token)
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		assert.Equal(t, http.StatusForbidden, rec.Code, "%s %s", rt.method, rt.path)
	}
}
