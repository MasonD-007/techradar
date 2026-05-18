package handlers

import (
	"context"

	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RLSExecutor interface {
	Execute(ctx context.Context, userID string, role string, fn func(Querier) error) error
}

type DBRLSExecutor struct {
	pool *pgxpool.Pool
}

func NewDBRLSExecutor(pool *pgxpool.Pool) *DBRLSExecutor {
	return &DBRLSExecutor{pool: pool}
}

func (e *DBRLSExecutor) Execute(ctx context.Context, userID string, role string, fn func(Querier) error) error {
	return db.WithRLS(ctx, e.pool, userID, role, nil, func(q *db.Queries) error {
		return fn(q)
	})
}