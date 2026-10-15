package main

import "testing"

// Every template must reference technologies and rings that exist, so a typo
// fails here instead of failing a production deploy.
func TestTemplateSeedsReferenceKnownTechnologiesAndRings(t *testing.T) {
	techs, err := loadTechnologySeeds()
	if err != nil {
		t.Fatalf("load technologies: %v", err)
	}
	known := make(map[string]bool, len(techs))
	for _, tech := range techs {
		known[tech.Name] = true
	}

	templates, err := loadTemplateSeeds()
	if err != nil {
		t.Fatalf("load templates: %v", err)
	}
	if len(templates) == 0 {
		t.Fatal("expected at least one template")
	}

	slugs := map[string]bool{}
	validRings := map[string]bool{"Adopt": true, "Trial": true, "Assess": true, "Hold": true}
	for _, tpl := range templates {
		if tpl.Slug == "" || tpl.Name == "" {
			t.Errorf("template %+v needs a slug and name", tpl)
		}
		if slugs[tpl.Slug] {
			t.Errorf("duplicate slug %q", tpl.Slug)
		}
		slugs[tpl.Slug] = true

		seen := map[string]bool{}
		for _, item := range tpl.Technologies {
			if !known[item.Name] {
				t.Errorf("template %q: unknown technology %q", tpl.Slug, item.Name)
			}
			if !validRings[item.Ring] {
				t.Errorf("template %q: unknown ring %q for %q", tpl.Slug, item.Ring, item.Name)
			}
			if seen[item.Name] {
				t.Errorf("template %q: duplicate technology %q", tpl.Slug, item.Name)
			}
			seen[item.Name] = true
		}
	}
}
