package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/MasonD-007/template/backend/cmd/server/handlers"
	_ "github.com/MasonD-007/template/backend/docs"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/MasonD-007/template/backend/internal/db/migrate"
	"github.com/MasonD-007/template/backend/internal/db/postgres"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

// @title Tech Radar API
// @version 1.0
// @description API for managing blips, technologies, users, and user technologies
// @host localhost:8080
// @BasePath /
func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set in environment variables")
	}

	log.Printf("[%s] [INFO] [main] [START] database_url=%s", time.Now().Format(time.RFC3339), dbURL)

	conn, err := postgres.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close()

	log.Printf("[%s] [INFO] [main] [DB_CONNECTED]", time.Now().Format(time.RFC3339))

	if err := migrate.RunMigrations(context.Background(), conn); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	q := db.New(conn)

	registerBlipsRoutes(q)
	registerTechnologiesRoutes(q)
	registerUsersRoutes(q)
	registerUserTechnologiesRoutes(q)

	http.HandleFunc("/swagger/*", httpSwagger.Handler())

	http.HandleFunc("/health", loggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, err := w.Write([]byte("OK"))
		if err != nil {
			log.Printf("[%s] [INFO] [health] [ERROR] error=%v", time.Now().Format(time.RFC3339), err)
		}
	}))

	log.Printf("[%s] [INFO] [main] [SERVER_START] port=8080", time.Now().Format(time.RFC3339))
	fmt.Println("Server starting on :8080")
	fmt.Println("Swagger docs at http://localhost:8080/swagger/index.html")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func registerBlipsRoutes(q *db.Queries) {
	http.HandleFunc("POST /blips", loggingMiddleware(handlers.CreateBlip(q)))
	http.HandleFunc("GET /blips/{id}", loggingMiddleware(handlers.GetBlip(q)))
	http.HandleFunc("PUT /blips/{id}", loggingMiddleware(handlers.UpdateBlip(q)))
	http.HandleFunc("DELETE /blips/{id}", loggingMiddleware(handlers.DeleteBlip(q)))
}

func registerTechnologiesRoutes(q *db.Queries) {
	http.HandleFunc("POST /technologies", loggingMiddleware(handlers.CreateTechnology(q)))
	http.HandleFunc("GET /technologies/{id}", loggingMiddleware(handlers.GetTechnology(q)))
	http.HandleFunc("GET /technologies/by-name/{name}", loggingMiddleware(handlers.GetTechnologyByName(q)))
	http.HandleFunc("GET /technologies/by-quadrant/{quadrant_id}", loggingMiddleware(handlers.GetTechnologiesByQuadrant(q)))
	http.HandleFunc("PUT /technologies/{id}", loggingMiddleware(handlers.UpdateTechnology(q)))
	http.HandleFunc("DELETE /technologies/{id}", loggingMiddleware(handlers.DeleteTechnology(q)))
}

func registerUsersRoutes(q *db.Queries) {
	http.HandleFunc("POST /users", loggingMiddleware(handlers.CreateUser(q)))
	http.HandleFunc("GET /users/{id}", loggingMiddleware(handlers.GetUser(q)))
	http.HandleFunc("GET /users/by-email/{email}", loggingMiddleware(handlers.GetUserByEmail(q)))
	http.HandleFunc("PUT /users/{id}", loggingMiddleware(handlers.UpdateUser(q)))
	http.HandleFunc("DELETE /users/{id}", loggingMiddleware(handlers.DeleteUser(q)))
}

func registerUserTechnologiesRoutes(q *db.Queries) {
	http.HandleFunc("POST /user-technologies", loggingMiddleware(handlers.CreateUserTechnology(q)))
	http.HandleFunc("GET /user-technologies/{id}", loggingMiddleware(handlers.GetUserTechnology(q)))
	http.HandleFunc("GET /users/{user_id}/technologies", loggingMiddleware(handlers.GetUserTechnologiesByUser(q)))
	http.HandleFunc("PUT /user-technologies/{id}", loggingMiddleware(handlers.UpdateUserTechnology(q)))
	http.HandleFunc("DELETE /user-technologies/{id}", loggingMiddleware(handlers.DeleteUserTechnology(q)))
}
