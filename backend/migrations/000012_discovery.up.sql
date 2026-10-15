ALTER TABLE share_codes
    ADD COLUMN listed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT share_codes_listed_requires_public
        CHECK (NOT listed OR visibility = 'public');

CREATE INDEX idx_share_codes_listed ON share_codes(listed) WHERE listed;

CREATE TABLE templates (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE template_technologies (
    template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    technology_id UUID NOT NULL REFERENCES technology(id) ON DELETE CASCADE,
    ring_id INTEGER NOT NULL REFERENCES rings(id),
    PRIMARY KEY (template_id, technology_id)
);

CREATE INDEX idx_template_technologies_technology_id ON template_technologies(technology_id);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_technologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_select ON templates FOR SELECT USING (true);
CREATE POLICY templates_admin ON templates
  FOR ALL USING (current_setting('app.current_role', true) = 'admin');

CREATE POLICY template_technologies_select ON template_technologies FOR SELECT USING (true);
CREATE POLICY template_technologies_admin ON template_technologies
  FOR ALL USING (current_setting('app.current_role', true) = 'admin');
