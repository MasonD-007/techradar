package main

import (
	"context"
	"log"
	"os"
	"strconv"

	"github.com/MasonD-007/template/backend/internal/auth"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/MasonD-007/template/backend/internal/db/postgres"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../../.env")

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is not set in environment variables")
	}
	tokenExpiry, _ := strconv.Atoi(os.Getenv("TOKEN_EXPIRY_HOUR"))
	if tokenExpiry == 0 {
		tokenExpiry = 24
	}
	auth.InitAuth(jwtSecret, tokenExpiry)

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set in environment variables")
	}

	conn, err := postgres.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close()

	q := db.New(conn)

	adminUsername := os.Getenv("SEED_ADMIN_USERNAME")
	if adminUsername == "" {
		adminUsername = "admin"
	}

	adminEmail := os.Getenv("SEED_ADMIN_EMAIL")
	if adminEmail == "" {
		adminEmail = "admin@techradar.local"
	}

	adminPassword := os.Getenv("SEED_ADMIN_PASSWORD")
	if adminPassword == "" {
		adminPassword = "admin123"
	}

	existingUser, err := q.GetUserEmail(context.Background(), adminEmail)
	if err == nil && existingUser.ID.Valid {
		log.Printf("Admin user already exists with email: %s", adminEmail)
		return
	}

	hashedPassword, err := auth.HashPassword(adminPassword)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

adminID := uuid.New()
	_, err = q.CreateUser(context.Background(), db.CreateUserParams{
		ID:             auth.ToPgType(adminID),
		Name:           "Admin User",
		Email:          adminEmail,
		Username:       adminUsername,
		HashedPassword: hashedPassword,
		Role:           "admin",
	})
	if err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	log.Printf("Admin user created successfully!")
	log.Printf("  Username: %s", adminUsername)
	log.Printf("  Email: %s", adminEmail)
	log.Printf("  Password: %s", adminPassword)
	log.Printf("  Role: admin")

	token, err := auth.GenerateToken(adminID, adminUsername, "admin")
	if err != nil {
		log.Printf("Warning: Failed to generate token: %v", err)
	} else {
		log.Printf("  Token: %s", token)
	}
}