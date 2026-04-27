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
	ID         pgtype.UUID `json:"id"`
	Name       string      `json:"name"`
	QuadrantID int32       `json:"quadrant_id"`
}

type UpdateTechnologyRequest struct {
	Name       string `json:"name"`
	BlipID     int32  `json:"blip_id"`
	QuadrantID int32  `json:"quadrant_id"`
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
