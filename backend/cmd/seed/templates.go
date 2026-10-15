package main

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"github.com/MasonD-007/techradar/backend/internal/db"
	"github.com/jackc/pgx/v5"
)

//go:embed templates/templates.json
var templateSeedFS embed.FS

type templateSeedItem struct {
	Name string `json:"name"`
	Ring string `json:"ring"`
}

type templateSeed struct {
	Slug         string             `json:"slug"`
	Name         string             `json:"name"`
	Description  string             `json:"description"`
	Technologies []templateSeedItem `json:"technologies"`
}

func loadTemplateSeeds() ([]templateSeed, error) {
	data, err := templateSeedFS.ReadFile("templates/templates.json")
	if err != nil {
		return nil, fmt.Errorf("failed to read template seed: %w", err)
	}
	var seeds []templateSeed
	if err := json.Unmarshal(data, &seeds); err != nil {
		return nil, fmt.Errorf("failed to parse template seed: %w", err)
	}
	return seeds, nil
}

// seedTemplates inserts templates whose slug does not exist yet. Existing
// templates are left untouched so edits made in the admin area survive deploys.
func seedTemplates(ctx context.Context, q *db.Queries) (int, error) {
	seeds, err := loadTemplateSeeds()
	if err != nil {
		return 0, err
	}

	created := 0
	for _, seed := range seeds {
		id, err := q.InsertTemplateIfMissing(ctx, db.InsertTemplateIfMissingParams{
			Slug:        seed.Slug,
			Name:        seed.Name,
			Description: seed.Description,
		})
		if errors.Is(err, pgx.ErrNoRows) {
			log.Printf("Template already exists, skipping: %s", seed.Slug)
			continue
		}
		if err != nil {
			return created, fmt.Errorf("failed to insert template %q: %w", seed.Slug, err)
		}

		for _, item := range seed.Technologies {
			tech, err := q.GetTechnologyName(ctx, item.Name)
			if err != nil {
				return created, fmt.Errorf("template %q: technology %q: %w", seed.Slug, item.Name, err)
			}
			ring, err := q.GetRingByName(ctx, item.Ring)
			if err != nil {
				return created, fmt.Errorf("template %q: ring %q: %w", seed.Slug, item.Ring, err)
			}
			err = q.AddTemplateItem(ctx, db.AddTemplateItemParams{
				TemplateID:   id,
				TechnologyID: tech.ID,
				RingID:       ring.ID,
			})
			if err != nil {
				return created, fmt.Errorf("template %q: failed to add %q: %w", seed.Slug, item.Name, err)
			}
		}
		created++
		log.Printf("Seeded template: %s", seed.Slug)
	}
	return created, nil
}
