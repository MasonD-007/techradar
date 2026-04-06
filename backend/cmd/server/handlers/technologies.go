package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/MasonD-007/template/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/MasonD-007/template/backend/internal/uuidutil"
	"github.com/jackc/pgx/v5/pgtype"
)

// GetTechnology godoc
// @Summary Get a technology
// @Description Get technology by ID
// @Tags technologies
// @Accept json
// @Produce json
// @Param id path string true "Technology ID"
// @Success 200 {object} Technology
// @Failure 400 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /technologies/{id} [get]
func GetTechnology(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}

		id, err := uuidutil.Parse(idStr)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		tech, err := q.GetTechnologyID(r.Context(), id)
		if err != nil {
			http.Error(w, "Technology not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(tech)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// GetTechnologyByName godoc
// @Summary Get a technology by name
// @Description Get technology by name
// @Tags technologies
// @Accept json
// @Produce json
// @Param name path string true "Technology name"
// @Success 200 {object} Technology
// @Failure 400 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /technologies/by-name/{name} [get]
func GetTechnologyByName(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name := r.PathValue("name")
		if name == "" {
			http.Error(w, "Missing name parameter", http.StatusBadRequest)
			return
		}

		tech, err := q.GetTechnologyName(r.Context(), name)
		if err != nil {
			http.Error(w, "Technology not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(tech)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// GetTechnologiesByQuadrant godoc
// @Summary Get technologies by quadrant
// @Description Get all technologies in a quadrant
// @Tags technologies
// @Accept json
// @Produce json
// @Param quadrant_id path int true "Quadrant ID"
// @Success 200 {array} Technology
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /technologies/by-quadrant/{quadrant_id} [get]
func GetTechnologiesByQuadrant(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		quadrantIDStr := r.PathValue("quadrant_id")
		if quadrantIDStr == "" {
			http.Error(w, "Missing quadrant_id parameter", http.StatusBadRequest)
			return
		}

		quadrantID, err := strconv.ParseInt(quadrantIDStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid quadrant_id", http.StatusBadRequest)
			return
		}

		technologies, err := q.GetTechnologyQuad(r.Context(), int32(quadrantID))
		if err != nil {
			http.Error(w, "Failed to fetch technologies", http.StatusInternalServerError)
			return
		}

		if technologies == nil {
			technologies = []db.Technology{}
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(technologies)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// CreateTechnology godoc
// @Summary Create a technology
// @Description Create a new technology
// @Tags technologies
// @Accept json
// @Produce json
// @Param Technology body CreateTechnologyRequest true "Technology data"
// @Success 201 {object} Technology
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /technologies [post]
func CreateTechnology(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params dto.CreateTechnologyRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		tech, err := q.CreateTechnology(r.Context(), db.CreateTechnologyParams{
			ID:         params.ID,
			Name:       params.Name,
			BlipID:     params.BlipID,
			QuadrantID: params.QuadrantID,
		})
		if err != nil {
			http.Error(w, "Failed to create technology", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(tech)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// DeleteTechnology godoc
// @Summary Delete a technology
// @Description Delete technology by ID
// @Tags technologies
// @Accept json
// @Produce json
// @Param id path string true "Technology ID"
// @Success 204
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /technologies/{id} [delete]
func DeleteTechnology(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}

		id, err := uuidutil.Parse(idStr)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		if err := q.DeleteTechnology(r.Context(), id); err != nil {
			http.Error(w, "Failed to delete technology", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// UpdateTechnology godoc
// @Summary Update a technology
// @Description Update technology by ID
// @Tags technologies
// @Accept json
// @Produce json
// @Param id path string true "Technology ID"
// @Param Technology body UpdateTechnologyRequest true "Technology data"
// @Success 200 {object} Technology
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /technologies/{id} [put]
func UpdateTechnology(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}

		id, err := uuidutil.Parse(idStr)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		var params dto.UpdateTechnologyRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		tech, err := q.UpdateTechnology(r.Context(), db.UpdateTechnologyParams{
			ID:         id,
			Name:       params.Name,
			BlipID:     params.BlipID,
			QuadrantID: params.QuadrantID,
		})
		if err != nil {
			http.Error(w, "Failed to update technology", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(tech)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// Technology represents a technology in the database
type Technology struct {
	ID         pgtype.UUID `json:"id"`
	Name       string      `json:"name"`
	BlipID     int32       `json:"blip_id"`
	QuadrantID int32       `json:"quadrant_id"`
	CreatedAt  string      `json:"created_at"`
	UpdatedAt  string      `json:"updated_at"`
}
