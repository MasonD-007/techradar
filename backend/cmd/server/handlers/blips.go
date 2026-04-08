package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/MasonD-007/template/backend/cmd/server/handlers/dto"
	"github.com/MasonD-007/template/backend/internal/db"
)

// GetBlip godoc
// @Summary Get a blip
// @Description Get blip by ID
// @Tags blips
// @Accept json
// @Produce json
// @Param id path int true "Blip ID"
// @Success 200 {object} Blip
// @Failure 400 {object} Error
// @Failure 404 {object} Error
// @Failure 500 {object} Error
// @Router /blips/{id} [get]
func GetBlip(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}

		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		blip, err := q.GetBlip(r.Context(), int32(id))
		if err != nil {
			http.Error(w, "Blip not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(blip)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// CreateBlip godoc
// @Summary Create a blip
// @Description Create a new blip
// @Tags blips
// @Accept json
// @Produce json
// @Param Blip body CreateBlipRequest true "Blip data"
// @Success 201 {object} Blip
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /blips [post]
func CreateBlip(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params dto.CreateBlipRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		blip, err := q.CreateBlip(r.Context(), params.Context)
		if err != nil {
			http.Error(w, "Failed to create blip", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(blip)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// DeleteBlip godoc
// @Summary Delete a blip
// @Description Delete blip by ID
// @Tags blips
// @Accept json
// @Produce json
// @Param id path int true "Blip ID"
// @Success 204
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /blips/{id} [delete]
func DeleteBlip(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}

		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		if err := q.DeleteBlip(r.Context(), int32(id)); err != nil {
			http.Error(w, "Failed to delete blip", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// UpdateBlip godoc
// @Summary Update a blip
// @Description Update blip by ID
// @Tags blips
// @Accept json
// @Produce json
// @Param id path int true "Blip ID"
// @Param Blip body UpdateBlipRequest true "Blip data"
// @Success 200 {object} Blip
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /blips/{id} [put]
func UpdateBlip(q Querier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		if idStr == "" {
			http.Error(w, "Missing id parameter", http.StatusBadRequest)
			return
		}

		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		var params dto.UpdateBlipRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		blip, err := q.UpdateBlip(r.Context(), db.UpdateBlipParams{
			ID:      int32(id),
			Context: params.Context,
		})
		if err != nil {
			http.Error(w, "Failed to update blip", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(blip)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// Blip represents a blip in the database
type Blip struct {
	ID        int32  `json:"id"`
	Context   []byte `json:"context"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}
