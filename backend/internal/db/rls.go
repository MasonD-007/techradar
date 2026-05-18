package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func WithRLS(ctx context.Context, pool *pgxpool.Pool, userID, role string, q *Queries, fn func(*Queries) error) error {
	if pool == nil {
		if q != nil {
			return fn(q)
		}
		return fn(nil)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if userID == "" {
		_, err = tx.Exec(ctx, "SELECT set_config('app.current_role', 'user', true)")
	} else {
		_, err = tx.Exec(ctx, "SELECT set_config('app.current_user_id', $1, true), set_config('app.current_role', $2, true)", userID, role)
	}
	if err != nil {
		return err
	}

	rlsQ := New(tx)
	if err := fn(rlsQ); err != nil {
		return err
	}

	return tx.Commit(ctx)
}