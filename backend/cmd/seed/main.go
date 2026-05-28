package main

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"sort"
	"strconv"
	"strings"

	"github.com/MasonD-007/techradar/backend/internal/auth"
	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/MasonD-007/techradar/backend/internal/db/migrate"
	"github.com/MasonD-007/techradar/backend/internal/db/postgres"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/joho/godotenv"
)

type technologySeedRecord struct {
	Name        string
	Description string
	Category    string
	IconUrl     string
}

//go:embed data/*.json
var seedDataFS embed.FS

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

	seededCount, err := seedTechnologies(context.Background(), tx, q)
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

func seedTechnologies(ctx context.Context, tx pgx.Tx, q *db.Queries) (int, error) {
	records, err := loadTechnologySeeds()
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
			IconUrl:    pgtype.Text{String: record.IconUrl, Valid: record.IconUrl != ""},
		})
		if err != nil {
			return seededCount, fmt.Errorf("failed to create technology %q: %w", record.Name, err)
		}

		seededCount++
		log.Printf("Seeded technology: %s", record.Name)
	}

	return seededCount, nil
}

func loadTechnologySeeds() ([]technologySeedRecord, error) {
	entries, err := seedDataFS.ReadDir("data")
	if err != nil {
		return nil, fmt.Errorf("failed to read embedded seed data directory: %w", err)
	}

	fileNames := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".json") {
			fileNames = append(fileNames, entry.Name())
		}
	}
	sort.Strings(fileNames)

	var records []technologySeedRecord
	for _, fileName := range fileNames {
		path := "data/" + fileName
		content, err := seedDataFS.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("failed to read embedded seed data %q: %w", path, err)
		}

		var fileRecords []technologySeedRecord
		if err := json.Unmarshal(content, &fileRecords); err != nil {
			return nil, fmt.Errorf("failed to parse seed data %q: %w", path, err)
		}

		for _, record := range fileRecords {
			record.Name = strings.TrimSpace(record.Name)
			record.Description = strings.TrimSpace(record.Description)
			record.Category = strings.ToLower(strings.TrimSpace(record.Category))
			record.IconUrl = strings.TrimSpace(record.IconUrl)

			if record.Name == "" || record.Description == "" || record.Category == "" {
				return nil, fmt.Errorf("seed data %q contains an incomplete technology record", path)
			}

			records = append(records, record)
		}
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
