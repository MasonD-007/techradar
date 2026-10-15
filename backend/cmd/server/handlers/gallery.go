package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	galleryPageSize    = 12
	galleryTopTechs    = 5
	gallerySearchMax   = 64
	galleryMaxQuadrant = 4
	galleryMaxPage     = 10000
)

// escapeLike makes s match literally inside an ILIKE pattern that uses
// backslash as the escape character.
func escapeLike(s string) string {
	r := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return r.Replace(s)
}

// GetGallery godoc
// @Summary List gallery radars
// @Description List public radars whose owners opted into the gallery. No authentication required.
// @Tags gallery
// @Produce json
// @Param q query string false "Search username or technology name"
// @Param quadrant query int false "Quadrant id (1-4)"
// @Param page query int false "Page number, starting at 1"
// @Success 200 {object} GalleryResponse
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /gallery [get]
func GetGallery(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()

		page := 1
		if p, err := strconv.Atoi(query.Get("page")); err == nil && p >= 1 {
			page = p
		}
		if page > galleryMaxPage {
			page = galleryMaxPage
		}

		params := db.ListGalleryRadarsParams{
			PageLimit:  galleryPageSize + 1,
			PageOffset: int32((page - 1) * galleryPageSize),
		}

		if raw := query.Get("quadrant"); raw != "" {
			n, err := strconv.Atoi(raw)
			if err != nil || n < 1 || n > galleryMaxQuadrant {
				http.Error(w, "quadrant must be between 1 and 4", http.StatusBadRequest)
				return
			}
			params.Quadrant = pgtype.Int4{Int32: int32(n), Valid: true}
		}

		term := strings.ToValidUTF8(query.Get("q"), "")
		term = strings.ReplaceAll(term, "\x00", "")
		if runes := []rune(term); len(runes) > gallerySearchMax {
			term = string(runes[:gallerySearchMax])
		}
		if term = strings.TrimSpace(term); term != "" {
			params.Search = pgtype.Text{String: escapeLike(term), Valid: true}
		}

		rows, err := q.ListGalleryRadars(r.Context(), params)
		if err != nil {
			http.Error(w, "Failed to load gallery", http.StatusInternalServerError)
			return
		}

		hasMore := len(rows) > galleryPageSize
		if hasMore {
			rows = rows[:galleryPageSize]
		}

		entries := make([]dto.GalleryEntry, len(rows))
		codes := make([]string, len(rows))
		index := make(map[string]int, len(rows))
		for i, row := range rows {
			entries[i] = dto.GalleryEntry{
				Code:            row.Code,
				Username:        row.Username,
				BlipCount:       int(row.BlipCount),
				TopTechnologies: []string{},
				UpdatedAt:       row.UpdatedAt.Time.UTC().Format("2006-01-02T15:04:05Z"),
			}
			codes[i] = row.Code
			index[row.Code] = i
		}

		if len(codes) > 0 {
			techs, err := q.ListGalleryTopTechnologies(r.Context(), codes)
			if err != nil {
				http.Error(w, "Failed to load gallery", http.StatusInternalServerError)
				return
			}
			for _, t := range techs {
				i, ok := index[t.Code]
				if !ok || len(entries[i].TopTechnologies) >= galleryTopTechs {
					continue
				}
				entries[i].TopTechnologies = append(entries[i].TopTechnologies, t.Name)
			}
		}

		writeShareJSON(w, http.StatusOK, dto.GalleryResponse{
			Radars:  entries,
			Page:    page,
			HasMore: hasMore,
		})
	}
}
