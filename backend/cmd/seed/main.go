package main

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/MasonD-007/template/backend/internal/auth"
	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/MasonD-007/template/backend/internal/db/migrate"
	"github.com/MasonD-007/template/backend/internal/db/postgres"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

type technologySeedRecord struct {
	Name        string
	Description string
	Category    string
}

func main() {
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

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

	if err := migrate.RunMigrations(context.Background(), dbURL); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	conn, err := postgres.Connect(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close()

	tx, err := conn.Begin(context.Background())
	if err != nil {
		log.Fatalf("Failed to start seed transaction: %v", err)
	}
	defer func() {
		if rollbackErr := tx.Rollback(context.Background()); rollbackErr != nil && !errors.Is(rollbackErr, pgx.ErrTxClosed) {
			log.Printf("Warning: failed to rollback seed transaction: %v", rollbackErr)
		}
	}()

	q := db.New(tx)

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

	if err := seedAdminUser(context.Background(), q, adminUsername, adminEmail, adminPassword); err != nil {
		log.Fatalf("Failed to seed admin user: %v", err)
	}

	csvPath := os.Getenv("SEED_DATA_CSV")
	if csvPath == "" {
		csvPath = filepath.Clean(filepath.Join("..", "frontend", "public", "data.csv"))
	}

	seededCount, err := seedTechnologies(context.Background(), tx, q, csvPath)
	if err != nil {
		log.Fatalf("Failed to seed technologies: %v", err)
	}

	if err := tx.Commit(context.Background()); err != nil {
		log.Fatalf("Failed to commit seed transaction: %v", err)
	}

	log.Printf("Seed completed successfully: %d technologies processed", seededCount)
	if seededCount == 0 {
		log.Printf("All technologies from the dataset were already present")
	}
}

func seedAdminUser(ctx context.Context, q *db.Queries, adminUsername, adminEmail, adminPassword string) error {
	existingUser, err := q.GetUserEmail(ctx, adminEmail)
	if err == nil && existingUser.ID.Valid {
		log.Printf("Admin user already exists with email: %s", adminEmail)
		return nil
	}
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("failed to check for existing admin user: %w", err)
	}

	hashedPassword, err := auth.HashPassword(adminPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	adminID := uuid.New()
	_, err = q.CreateUser(ctx, db.CreateUserParams{
		ID:             auth.ToPgType(adminID),
		Name:           "Admin User",
		Email:          adminEmail,
		Username:       adminUsername,
		HashedPassword: hashedPassword,
		Role:           "admin",
	})
	if err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
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

	return nil
}

func seedTechnologies(ctx context.Context, tx pgx.Tx, q *db.Queries, csvPath string) (int, error) {
	records, err := loadTechnologySeeds(csvPath)
	if err != nil {
		return 0, err
	}

	quadrantIDs := map[string]int32{}
	for _, quadrantName := range []string{"Techniques", "Tools", "Platforms", "LanguagesFrameworks"} {
		quadrantID, err := getQuadrantID(ctx, tx, quadrantName)
		if err != nil {
			return 0, err
		}
		quadrantIDs[quadrantName] = quadrantID
	}

	seededCount := 0
	for _, record := range records {
		existingTechnology, err := q.GetTechnologyName(ctx, record.Name)
		if err == nil && existingTechnology.ID.Valid {
			log.Printf("Technology already exists, skipping: %s", record.Name)
			continue
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return seededCount, fmt.Errorf("failed to check for existing technology %q: %w", record.Name, err)
		}

		quadrantName, err := mapCategoryToQuadrant(record.Category)
		if err != nil {
			return seededCount, fmt.Errorf("technology %q: %w", record.Name, err)
		}

		blipContext, err := jsonFromSeed(record)
		if err != nil {
			return seededCount, fmt.Errorf("technology %q: %w", record.Name, err)
		}

		blip, err := q.CreateBlip(ctx, blipContext)
		if err != nil {
			return seededCount, fmt.Errorf("failed to create blip for %q: %w", record.Name, err)
		}

		technologyID := uuid.NewSHA1(uuid.NameSpaceOID, []byte("technology:"+record.Name))
		_, err = q.CreateTechnology(ctx, db.CreateTechnologyParams{
			ID:         auth.ToPgType(technologyID),
			Name:       record.Name,
			BlipID:     blip.ID,
			QuadrantID: quadrantIDs[quadrantName],
		})
		if err != nil {
			return seededCount, fmt.Errorf("failed to create technology %q: %w", record.Name, err)
		}

		seededCount++
		log.Printf("Seeded technology: %s", record.Name)
	}

	return seededCount, nil
}

func loadTechnologySeeds(csvPath string) ([]technologySeedRecord, error) {
	file, err := os.Open(csvPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open seed csv %q: %w", csvPath, err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("failed to read csv header: %w", err)
	}
	if len(header) != 3 || strings.ToLower(strings.TrimSpace(header[0])) != "name" || strings.ToLower(strings.TrimSpace(header[1])) != "description" || strings.ToLower(strings.TrimSpace(header[2])) != "category" {
		return nil, fmt.Errorf("unexpected csv header %v; expected name,description,category", header)
	}

	var records []technologySeedRecord
	for {
		record, err := reader.Read()
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return nil, fmt.Errorf("failed to read csv row: %w", err)
		}
		if len(record) != 3 {
			return nil, fmt.Errorf("invalid csv row %v: expected 3 columns", record)
		}

		records = append(records, technologySeedRecord{
			Name:        strings.TrimSpace(record[0]),
			Description: strings.TrimSpace(record[1]),
			Category:    strings.ToLower(strings.TrimSpace(record[2])),
		})
	}

	return records, nil
}

func mapCategoryToQuadrant(category string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(category)) {
	case "technique":
		return "Techniques", nil
	case "tool":
		return "Tools", nil
	case "platform":
		return "Platforms", nil
	case "language/framework":
		return "LanguagesFrameworks", nil
	default:
		return "", fmt.Errorf("unknown category %q", category)
	}
}

func getQuadrantID(ctx context.Context, tx pgx.Tx, name string) (int32, error) {
	var quadrantID int32
	if err := tx.QueryRow(ctx, `SELECT id FROM quadrants WHERE name = $1`, name).Scan(&quadrantID); err != nil {
		return 0, fmt.Errorf("failed to find quadrant %q: %w", name, err)
	}

	return quadrantID, nil
}

func jsonFromSeed(record technologySeedRecord) ([]byte, error) {
	return json.Marshal(map[string]string{
		"name":        record.Name,
		"description": record.Description,
		"category":    record.Category,
	})
}