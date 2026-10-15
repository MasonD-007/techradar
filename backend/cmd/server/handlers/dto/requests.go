package dto

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type CreateBlipRequest struct {
	Context map[string]interface{} `json:"context"`
}

type UpdateBlipRequest struct {
	Context map[string]interface{} `json:"context"`
}

type CreateTechnologyRequest struct {
	ID          pgtype.UUID `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	QuadrantID  int32       `json:"quadrant_id"`
	IconUrl     string      `json:"icon_url"`
}

type UpdateTechnologyRequest struct {
	Name       string `json:"name"`
	BlipID     int32  `json:"blip_id"`
	QuadrantID int32  `json:"quadrant_id"`
	IconUrl    string `json:"icon_url"`
}

type CreateUserRequest struct {
	ID             pgtype.UUID        `json:"id"`
	Name           string             `json:"name"`
	Email          string             `json:"email"`
	Username       string             `json:"username"`
	HashedPassword string             `json:"hashed_password"`
	LastLoggedIn   pgtype.Timestamptz `json:"last_logged_in" swaggertype:"string"`
}

type UpdateUserRequest struct {
	Name           string             `json:"name"`
	Email          string             `json:"email"`
	Username       string             `json:"username"`
	HashedPassword string             `json:"hashed_password"`
	Role           string             `json:"role"`
	LastLoggedIn   pgtype.Timestamptz `json:"last_logged_in" swaggertype:"string"`
}

type CreateUserTechnologyRequest struct {
	ID           pgtype.UUID `json:"id"`
	UserID       pgtype.UUID `json:"user_id"`
	TechnologyID pgtype.UUID `json:"technology_id"`
	RingID       int32       `json:"ring_id"`
}

type UpdateUserTechnologyRequest struct {
	UserID       pgtype.UUID `json:"user_id"`
	TechnologyID pgtype.UUID `json:"technology_id"`
	RingID       int32       `json:"ring_id"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ShareCodeResponse struct {
	Code       string `json:"code"`
	CreatedAt  string `json:"created_at"`
	Visibility string `json:"visibility"`
	Listed     bool   `json:"listed"`
}

type RadarGraphItem struct {
	TechnologyID string `json:"technology_id"`
	Name         string `json:"name"`
	QuadrantID   int32  `json:"quadrant_id"`
	QuadrantName string `json:"quadrant_name"`
	RingID       int32  `json:"ring_id"`
	RingName     string `json:"ring_name"`
	IconURL      string `json:"icon_url,omitempty"`
	Description  string `json:"description,omitempty"`
}

type RadarGraphResponse struct {
	Username string           `json:"username"`
	Radar    []RadarGraphItem `json:"radar"`
}

type AuthResponse struct {
	Token string  `json:"token"`
	User  UserDTO `json:"user"`
}

type UserDTO struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Username string `json:"username"`
	IsAdmin  bool   `json:"is_admin"`
}

type SetVisibilityRequest struct {
	Visibility string `json:"visibility,omitempty"`
	Listed     *bool  `json:"listed,omitempty"`
}

type GalleryEntry struct {
	Code            string   `json:"code"`
	Username        string   `json:"username"`
	BlipCount       int      `json:"blip_count"`
	TopTechnologies []string `json:"top_technologies"`
	UpdatedAt       string   `json:"updated_at"`
}

type GalleryResponse struct {
	Radars  []GalleryEntry `json:"radars"`
	Page    int            `json:"page"`
	HasMore bool           `json:"has_more"`
}

type TemplateSummary struct {
	Slug            string `json:"slug"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	TechnologyCount int    `json:"technology_count"`
}

type TemplateDetail struct {
	Slug        string           `json:"slug"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Radar       []RadarGraphItem `json:"radar"`
}

type TemplateItemRequest struct {
	TechnologyID string `json:"technology_id"`
	RingID       int32  `json:"ring_id"`
}

type TemplateRequest struct {
	Slug        string                `json:"slug"`
	Name        string                `json:"name"`
	Description string                `json:"description"`
	Items       []TemplateItemRequest `json:"items"`
}

type ImportSource struct {
	ShareCode    string `json:"shareCode,omitempty"`
	TemplateSlug string `json:"templateSlug,omitempty"`
}

type ImportRequest struct {
	Source        ImportSource `json:"source"`
	TechnologyIDs []string     `json:"technologyIds,omitempty"`
}

type ImportResponse struct {
	Added   int `json:"added"`
	Skipped int `json:"skipped"`
}

type AddViewerRequest struct {
	Username string `json:"username"`
}

type ShareViewersResponse struct {
	Viewers []string `json:"viewers"`
}
