package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

var templateSlugRe = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

const (
	templateMaxItems = 100
	templateMaxName  = 80
	templateMaxDesc  = 500
	templateMaxSlug  = 64
)

// cleanText reports whether s is valid UTF-8 without NUL bytes (Postgres text
// rejects both, which would otherwise surface as a 500).
func cleanText(s string) bool {
	return utf8.ValidString(s) && !strings.ContainsRune(s, 0)
}

// validTemplateSlug reports whether s is a well-formed template slug.
func validTemplateSlug(s string) bool {
	return len(s) <= templateMaxSlug && templateSlugRe.MatchString(s)
}

// validateTemplateRequest checks a create/update body and returns the parsed
// technology ids alongside it.
func validateTemplateRequest(req dto.TemplateRequest, needSlug bool) ([]uuid.UUID, string) {
	if needSlug && !validTemplateSlug(req.Slug) {
		return nil, "slug must be lowercase letters, digits and single hyphens (max 64)"
	}
	if !cleanText(req.Name) || !cleanText(req.Description) {
		return nil, "name and description must be valid text"
	}
	name := strings.TrimSpace(req.Name)
	if name == "" || utf8.RuneCountInString(name) > templateMaxName {
		return nil, "name is required (max 80 characters)"
	}
	if utf8.RuneCountInString(req.Description) > templateMaxDesc {
		return nil, "description is too long (max 500 characters)"
	}
	if len(req.Items) > templateMaxItems {
		return nil, "too many technologies (max 100)"
	}
	ids := make([]uuid.UUID, len(req.Items))
	seen := make(map[uuid.UUID]bool, len(req.Items))
	for i, item := range req.Items {
		id, err := uuid.Parse(item.TechnologyID)
		if err != nil {
			return nil, "invalid technology_id"
		}
		if item.RingID < 1 || item.RingID > 4 {
			return nil, "ring_id must be between 1 and 4"
		}
		if seen[id] {
			return nil, "duplicate technology_id"
		}
		seen[id] = true
		ids[i] = id
	}
	return ids, ""
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

// isForeignKeyViolation reports a nonexistent (or deleted) technology or ring.
func isForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
}

// ListTemplates godoc
// @Summary List starter templates
// @Tags templates
// @Produce json
// @Success 200 {array} TemplateSummary
// @Failure 500 {object} Error
// @Router /templates [get]
func ListTemplates(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := q.ListTemplates(r.Context())
		if err != nil {
			http.Error(w, "Failed to load templates", http.StatusInternalServerError)
			return
		}
		out := make([]dto.TemplateSummary, len(rows))
		for i, row := range rows {
			out[i] = dto.TemplateSummary{
				Slug:            row.Slug,
				Name:            row.Name,
				Description:     row.Description,
				TechnologyCount: int(row.TechnologyCount),
			}
		}
		writeShareJSON(w, http.StatusOK, out)
	}
}

// GetTemplate godoc
// @Summary Get a starter template
// @Tags templates
// @Produce json
// @Param slug path string true "Template slug"
// @Success 200 {object} TemplateDetail
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /templates/{slug} [get]
func GetTemplate(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := r.PathValue("slug")
		if !validTemplateSlug(slug) {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		tpl, err := q.GetTemplateBySlug(r.Context(), slug)
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "Failed to load template", http.StatusInternalServerError)
			return
		}
		items, err := q.ListTemplateItems(r.Context(), tpl.ID)
		if err != nil {
			http.Error(w, "Failed to load template", http.StatusInternalServerError)
			return
		}
		radar := make([]dto.RadarGraphItem, len(items))
		for i, it := range items {
			radar[i] = graphItem(it.TechnologyID, it.Name, it.QuadrantID, it.QuadrantName, it.RingID, it.RingName, it.IconUrl, it.BlipContext)
		}
		writeShareJSON(w, http.StatusOK, dto.TemplateDetail{
			Slug:        tpl.Slug,
			Name:        tpl.Name,
			Description: tpl.Description,
			Radar:       radar,
		})
	}
}

func writeTemplateItems(ctx context.Context, q Querier, templateID int32, req dto.TemplateRequest, ids []uuid.UUID) error {
	for i, item := range req.Items {
		err := q.AddTemplateItem(ctx, db.AddTemplateItemParams{
			TemplateID:   templateID,
			TechnologyID: pgtype.UUID{Bytes: ids[i], Valid: true},
			RingID:       item.RingID,
		})
		if err != nil {
			return err
		}
	}
	return nil
}

// CreateTemplate godoc
// @Summary Create a starter template (admin)
// @Tags templates
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param template body TemplateRequest true "Template"
// @Success 201 {object} TemplateSummary
// @Failure 400 {object} Error
// @Failure 401 {object} Error
// @Failure 409 {object} Error
// @Failure 500 {object} Error
// @Router /templates [post]
func CreateTemplate(rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		var req dto.TemplateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		ids, msg := validateTemplateRequest(req, true)
		if msg != "" {
			http.Error(w, msg, http.StatusBadRequest)
			return
		}

		var created db.Template
		err := rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			var err error
			created, err = q.CreateTemplate(r.Context(), db.CreateTemplateParams{
				Slug:        req.Slug,
				Name:        strings.TrimSpace(req.Name),
				Description: req.Description,
			})
			if err != nil {
				return err
			}
			return writeTemplateItems(r.Context(), q, created.ID, req, ids)
		})
		if isUniqueViolation(err) {
			http.Error(w, "A template with that slug already exists", http.StatusConflict)
			return
		}
		if isForeignKeyViolation(err) {
			http.Error(w, "Unknown technology or ring", http.StatusBadRequest)
			return
		}
		if err != nil {
			http.Error(w, "Failed to create template", http.StatusInternalServerError)
			return
		}
		writeShareJSON(w, http.StatusCreated, dto.TemplateSummary{
			Slug: created.Slug, Name: created.Name, Description: created.Description, TechnologyCount: len(req.Items),
		})
	}
}

// UpdateTemplate godoc
// @Summary Replace a starter template (admin)
// @Tags templates
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param slug path string true "Template slug"
// @Param template body TemplateRequest true "Template"
// @Success 200 {object} TemplateSummary
// @Failure 400 {object} Error
// @Failure 401 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /templates/{slug} [put]
func UpdateTemplate(rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		slug := r.PathValue("slug")
		if !validTemplateSlug(slug) {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		var req dto.TemplateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		ids, msg := validateTemplateRequest(req, false)
		if msg != "" {
			http.Error(w, msg, http.StatusBadRequest)
			return
		}

		var updated db.Template
		err := rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			var err error
			updated, err = q.UpdateTemplate(r.Context(), db.UpdateTemplateParams{
				Slug:        slug,
				Name:        strings.TrimSpace(req.Name),
				Description: req.Description,
			})
			if err != nil {
				return err
			}
			if err := q.DeleteTemplateItems(r.Context(), updated.ID); err != nil {
				return err
			}
			return writeTemplateItems(r.Context(), q, updated.ID, req, ids)
		})
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		if isForeignKeyViolation(err) {
			http.Error(w, "Unknown technology or ring", http.StatusBadRequest)
			return
		}
		if err != nil {
			http.Error(w, "Failed to update template", http.StatusInternalServerError)
			return
		}
		writeShareJSON(w, http.StatusOK, dto.TemplateSummary{
			Slug: updated.Slug, Name: updated.Name, Description: updated.Description, TechnologyCount: len(req.Items),
		})
	}
}

// DeleteTemplate godoc
// @Summary Delete a starter template (admin)
// @Tags templates
// @Security BearerAuth
// @Param slug path string true "Template slug"
// @Success 204
// @Failure 401 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /templates/{slug} [delete]
func DeleteTemplate(rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		slug := r.PathValue("slug")
		if !validTemplateSlug(slug) {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		var n int64
		err := rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			var err error
			n, err = q.DeleteTemplate(r.Context(), slug)
			return err
		})
		if err != nil {
			http.Error(w, "Failed to delete template", http.StatusInternalServerError)
			return
		}
		if n == 0 {
			http.Error(w, "Template not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
