package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, "postgres://app:change-me-in-production@localhost:5432/appdb")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer pool.Close()

	_, err = pool.Exec(ctx, "SET LOCAL app.current_user_id = $1, SET LOCAL app.current_role = $2", "82d29d7f-0c19-4fba-9006-b224817a0fa7", "user")
	if err != nil {
		fmt.Printf("Error with SET LOCAL: %v\n", err)
	} else {
		fmt.Println("SET LOCAL succeeded")
	}

    _, err = pool.Exec(ctx, "SELECT set_config('app.current_user_id', $1, true), set_config('app.current_role', $2, true)", "82d29d7f-0c19-4fba-9006-b224817a0fa7", "user")
	if err != nil {
		fmt.Printf("Error with set_config: %v\n", err)
	} else {
		fmt.Println("set_config succeeded")
	}
}
