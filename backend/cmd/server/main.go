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
	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

// @title Tech Radar API
// @version 1.0
// @description API for managing blips, technologies, users, and user technologies
// @host localhost:8080
// @BasePath /
func main() {
	_ = godotenv.Load("../.env")

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

	if err := migrate.RunMigrations(context.Background(), dbURL); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	q := db.New(conn)

	r := chi.NewRouter()

	registerBlipsRoutes(r, q)
	registerTechnologiesRoutes(r, q)
	registerUsersRoutes(r, q)
	registerUserTechnologiesRoutes(r, q)

	r.HandleFunc("/swagger/doc.json", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "docs/swagger.json")
	})

	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("http://localhost:8080/swagger/doc.json"),
	))

	r.Get("/health", loggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, err := w.Write([]byte("OK"))
		if err != nil {
			log.Printf("[%s] [INFO] [health] [ERROR] error=%v", time.Now().Format(time.RFC3339), err)
		}
	}))

	log.Printf("[%s] [INFO] [main] [SERVER_START] port=8080", time.Now().Format(time.RFC3339))
	fmt.Println("Server starting on :8080")
	fmt.Println("Swagger docs at http://localhost:8080/swagger/index.html")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func registerBlipsRoutes(r chi.Router, q *db.Queries) {
	r.Post("/blips", loggingMiddleware(handlers.CreateBlip(q)))
	r.Get("/blips/{id}", loggingMiddleware(handlers.GetBlip(q)))
	r.Put("/blips/{id}", loggingMiddleware(handlers.UpdateBlip(q)))
	r.Delete("/blips/{id}", loggingMiddleware(handlers.DeleteBlip(q)))
}

func registerTechnologiesRoutes(r chi.Router, q *db.Queries) {
	r.Post("/technologies", loggingMiddleware(handlers.CreateTechnology(q)))
	r.Get("/technologies/{id}", loggingMiddleware(handlers.GetTechnology(q)))
	r.Get("/technologies/by-name/{name}", loggingMiddleware(handlers.GetTechnologyByName(q)))
	r.Get("/technologies/by-quadrant/{quadrant_id}", loggingMiddleware(handlers.GetTechnologiesByQuadrant(q)))
	r.Put("/technologies/{id}", loggingMiddleware(handlers.UpdateTechnology(q)))
	r.Delete("/technologies/{id}", loggingMiddleware(handlers.DeleteTechnology(q)))
}

func registerUsersRoutes(r chi.Router, q *db.Queries) {
	r.Post("/users", loggingMiddleware(handlers.CreateUser(q)))
	r.Get("/users/{id}", loggingMiddleware(handlers.GetUser(q)))
	r.Get("/users/by-email/{email}", loggingMiddleware(handlers.GetUserByEmail(q)))
	r.Put("/users/{id}", loggingMiddleware(handlers.UpdateUser(q)))
	r.Delete("/users/{id}", loggingMiddleware(handlers.DeleteUser(q)))
}

func registerUserTechnologiesRoutes(r chi.Router, q *db.Queries) {
	r.Post("/user-technologies", loggingMiddleware(handlers.CreateUserTechnology(q)))
	r.Get("/user-technologies/{id}", loggingMiddleware(handlers.GetUserTechnology(q)))
	r.Get("/user-technologies/user/{user_id}", loggingMiddleware(handlers.GetUserTechnologiesByUser(q)))
	r.Put("/user-technologies/{id}", loggingMiddleware(handlers.UpdateUserTechnology(q)))
	r.Delete("/user-technologies/{id}", loggingMiddleware(handlers.DeleteUserTechnology(q)))
}
