package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

// ListPosts godoc
// @Summary List all posts
// @Description Get all posts sorted by creation date
// @Tags posts
// @Accept json
// @Produce json
// @Success 200 {array} Post
// @Failure 500 {object} Error
// @Router /posts [get]
func ListPosts(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		posts, err := q.ListPosts(r.Context())
		if err != nil {
			http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
			return
		}

		if posts == nil {
			posts = []db.Post{}
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(posts)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}

	}
}

// GetPost godoc
// @Summary Get a post
// @Description Get post by ID
// @Tags posts
// @Accept json
// @Produce json
// @Param id query int true "Post ID"
// @Success 200 {object} Post
// @Failure 400 {object} Error
// @Failure 404 {object} Error
// @Router /posts [get]
func GetPost(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			ListPosts(q)(w, r)
			return
		}

		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		post, err := q.GetPost(r.Context(), int32(id))
		if err != nil {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(post)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// CreatePost godoc
// @Summary Create a post
// @Description Create a new post
// @Tags posts
// @Accept json
// @Produce json
// @Param Post body CreatePostRequest true "Post data"
// @Success 201 {object} Post
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /posts [post]
func CreatePost(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params CreatePostRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		post, err := q.CreatePost(r.Context(), db.CreatePostParams{
			Name:        params.Name,
			Description: pgtype.Text{String: params.Description, Valid: true},
		})
		if err != nil {
			http.Error(w, "Failed to create post", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		err = json.NewEncoder(w).Encode(post)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// DeletePost godoc
// @Summary Delete a post
// @Description Delete post by ID
// @Tags posts
// @Accept json
// @Produce json
// @Param id query int true "Post ID"
// @Success 204
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /posts [delete]
func DeletePost(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		if err := q.DeletePost(r.Context(), int32(id)); err != nil {
			http.Error(w, "Failed to delete post", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// UpdatePost godoc
// @Summary Update a post
// @Description Update post by ID
// @Tags posts
// @Accept json
// @Produce json
// @Param id query int true "Post ID"
// @Param Post body UpdatePostRequest true "Post data"
// @Success 200 {object} Post
// @Failure 400 {object} Error
// @Failure 500 {object} Error
// @Router /posts [put]
func UpdatePost(q *db.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.URL.Query().Get("id")
		id, err := strconv.ParseInt(idStr, 10, 32)
		if err != nil {
			http.Error(w, "Invalid id", http.StatusBadRequest)
			return
		}

		var params UpdatePostRequest
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		post, err := q.UpdatePost(r.Context(), db.UpdatePostParams{
			ID:          int32(id),
			Name:        params.Name,
			Description: pgtype.Text{String: params.Description, Valid: true},
		})
		if err != nil {
			http.Error(w, "Failed to update post", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(post)
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

type CreatePostRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type UpdatePostRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Error struct {
	Message string `json:"message"`
}

// Post represents a post in the database
type Post struct {
	ID          int32  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}
