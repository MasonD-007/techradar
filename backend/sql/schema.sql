CREATE TABLE rings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE quadrants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE blips (
    id SERIAL PRIMARY KEY,
    context JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE technology (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    blip_id INTEGER NOT NULL REFERENCES blips(id) ON DELETE CASCADE,
    quadrant_id INTEGER NOT NULL REFERENCES quadrants(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_logged_in TIMESTAMPTZ
);

CREATE TABLE user_technologies (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    technology_id UUID NOT NULL REFERENCES technology(id) ON DELETE CASCADE,
    ring_id INTEGER NOT NULL REFERENCES rings(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, technology_id)
);

CREATE INDEX idx_technology_name ON technology(name);
CREATE INDEX idx_technology_blip_id ON technology(blip_id);
CREATE INDEX idx_technology_quadrant_id ON technology(quadrant_id);
CREATE INDEX idx_rings_name ON rings(name);
CREATE INDEX idx_quadrants_name ON quadrants(name);
CREATE INDEX idx_user_technologies_user_id ON user_technologies(user_id);
CREATE INDEX idx_user_technologies_technology_id ON user_technologies(technology_id);
CREATE INDEX idx_user_technologies_ring_id ON user_technologies(ring_id);
