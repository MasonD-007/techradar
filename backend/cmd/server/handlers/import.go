package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/MasonD-007/techradar/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	importMaxTechnologyIDs = 500
	importMaxKeyLen        = 64
)

func validImportKey(s string) bool {
	return len(s) <= importMaxKeyLen && cleanText(s)
}

type importItem struct {
	TechnologyID uuid.UUID
	RingID       int32
}

func uuidFromPg(id pgtype.UUID) (uuid.UUID, bool) {
	if !id.Valid {
		return uuid.UUID{}, false
	}
	return uuid.UUID(id.Bytes), true
}

// ImportRadar godoc
// @Summary Copy technologies into my radar
// @Description Merge technologies from a viewable radar or a template into the caller's radar. Technologies already on the radar are skipped and keep their ring.
// @Tags radar
// @Accept json
// @Produce json
// @Param request body ImportRequest true "Source and optional technology ids"
// @Success 200 {object} ImportResponse
// @Failure 400 {object} Error
// @Failure 401 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /radar/import [post]
func ImportRadar(q Querier, rls RLSExecutor) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := GetUserIDFromRequest(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		role, _ := GetRoleFromRequest(r)

		var req dto.ImportRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if len(req.TechnologyIDs) > importMaxTechnologyIDs {
			http.Error(w, "Too many technology ids", http.StatusBadRequest)
			return
		}
		code := strings.TrimSpace(req.Source.ShareCode)
		slug := strings.TrimSpace(req.Source.TemplateSlug)
		if (code == "") == (slug == "") {
			http.Error(w, "Provide exactly one of source.shareCode or source.templateSlug", http.StatusBadRequest)
			return
		}

		// Reject unusable lookup keys before touching the database
		// (Postgres errors on NUL bytes); reported as "not found".
		if (code != "" && !validImportKey(code)) || (slug != "" && !validImportKey(slug)) {
			http.Error(w, "Not found", http.StatusNotFound)
			return
		}

		var source []importItem
		if code != "" {
			allowed, err := q.CanViewShareCode(r.Context(), db.CanViewShareCodeParams{
				Code:     code,
				IsAdmin:  role == "admin",
				ViewerID: pgtype.UUID{Bytes: userID, Valid: true},
			})
			if err != nil {
				http.Error(w, "Failed to check share code access", http.StatusInternalServerError)
				return
			}
			if !allowed {
				http.Error(w, "Radar not found", http.StatusNotFound)
				return
			}
			rows, err := q.GetRadarGraphByShareCode(r.Context(), code)
			if err != nil {
				http.Error(w, "Radar not found", http.StatusNotFound)
				return
			}
			for _, row := range rows {
				if id, ok := uuidFromPg(row.TechnologyID); ok {
					source = append(source, importItem{id, row.RingID})
				}
			}
		} else {
			tpl, err := q.GetTemplateBySlug(r.Context(), slug)
			if errors.Is(err, pgx.ErrNoRows) {
				http.Error(w, "Template not found", http.StatusNotFound)
				return
			}
			if err != nil {
				http.Error(w, "Failed to load template", http.StatusInternalServerError)
				return
			}
			rows, err := q.ListTemplateItems(r.Context(), tpl.ID)
			if err != nil {
				http.Error(w, "Failed to load template", http.StatusInternalServerError)
				return
			}
			for _, row := range rows {
				if id, ok := uuidFromPg(row.TechnologyID); ok {
					source = append(source, importItem{id, row.RingID})
				}
			}
		}

		selected := source
		if len(req.TechnologyIDs) > 0 {
			bySource := make(map[uuid.UUID]importItem, len(source))
			for _, it := range source {
				bySource[it.TechnologyID] = it
			}
			selected = make([]importItem, 0, len(req.TechnologyIDs))
			seen := make(map[uuid.UUID]bool, len(req.TechnologyIDs))
			for _, raw := range req.TechnologyIDs {
				id, err := uuid.Parse(raw)
				if err != nil {
					http.Error(w, "Invalid technology id", http.StatusBadRequest)
					return
				}
				it, found := bySource[id]
				if !found {
					http.Error(w, "Technology is not part of the source radar", http.StatusBadRequest)
					return
				}
				if seen[id] {
					continue
				}
				seen[id] = true
				selected = append(selected, it)
			}
		}

		var added int64
		err := rls.Execute(r.Context(), userID.String(), role, func(q Querier) error {
			added = 0
			for _, it := range selected {
				n, err := q.AddUserTechnologyIfMissing(r.Context(), db.AddUserTechnologyIfMissingParams{
					ID:           pgtype.UUID{Bytes: uuid.New(), Valid: true},
					UserID:       pgtype.UUID{Bytes: userID, Valid: true},
					TechnologyID: pgtype.UUID{Bytes: it.TechnologyID, Valid: true},
					RingID:       it.RingID,
				})
				if err != nil {
					return err
				}
				added += n
			}
			return nil
		})
		if err != nil {
			http.Error(w, "Failed to import technologies", http.StatusInternalServerError)
			return
		}

		writeShareJSON(w, http.StatusOK, dto.ImportResponse{
			Added:   int(added),
			Skipped: len(selected) - int(added),
		})
	}
}
