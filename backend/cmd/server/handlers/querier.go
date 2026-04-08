package handlers

import (
	"context"

	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

// Querier captures the database operations required by the HTTP handlers.
type Querier interface {
	// Blips
	GetBlip(ctx context.Context, id int32) (db.Blip, error)
	CreateBlip(ctx context.Context, context []byte) (db.Blip, error)
	UpdateBlip(ctx context.Context, params db.UpdateBlipParams) (db.Blip, error)
	DeleteBlip(ctx context.Context, id int32) error

	// Technologies
	GetTechnologyID(ctx context.Context, id pgtype.UUID) (db.Technology, error)
	GetTechnologyName(ctx context.Context, name string) (db.Technology, error)
	GetTechnologyQuad(ctx context.Context, quadrantID int32) ([]db.Technology, error)
	CreateTechnology(ctx context.Context, params db.CreateTechnologyParams) (db.Technology, error)
	UpdateTechnology(ctx context.Context, params db.UpdateTechnologyParams) (db.Technology, error)
	DeleteTechnology(ctx context.Context, id pgtype.UUID) error

	// Users
	GetUserID(ctx context.Context, id pgtype.UUID) (db.User, error)
	GetUserEmail(ctx context.Context, email string) (db.User, error)
	CreateUser(ctx context.Context, params db.CreateUserParams) (db.User, error)
	UpdateUser(ctx context.Context, params db.UpdateUserParams) (db.User, error)
	DeleteUser(ctx context.Context, id pgtype.UUID) error

	// User Technologies
	GetUserTechnologyID(ctx context.Context, id pgtype.UUID) (db.UserTechnology, error)
	GetUserTechnologyUserId(ctx context.Context, userID pgtype.UUID) ([]db.UserTechnology, error)
	CreateUserTechnology(ctx context.Context, params db.CreateUserTechnologyParams) (db.UserTechnology, error)
	UpdateUserTechnology(ctx context.Context, params db.UpdateUserTechnologyParams) (db.UserTechnology, error)
	DeleteUserTechnology(ctx context.Context, id pgtype.UUID) error
}
