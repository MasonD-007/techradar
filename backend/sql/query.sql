
-- name: CreateTechnology :one
INSERT INTO technology (
    id,
    name,
    blip_id,
    quadrant_id
)
VALUES ($1, $2, $3, $4)
RETURNING id,
    name,
    blip_id,
    quadrant_id,
    created_at,
    updated_at;

-- name: GetTechnologyID :one
SELECT
    id,
    name,
    blip_id,
    quadrant_id,
    created_at,
    updated_at
FROM
    technology
WHERE
    id = $1;


-- name: GetTechnologyName :one
SELECT
    id,
    name,
    blip_id,
    quadrant_id,
    created_at,
    updated_at
FROM
    technology
WHERE
    name = $1;

-- name: GetTechnologyQuad :many
SELECT
    id,
    name,
    blip_id,
    quadrant_id,
    created_at,
    updated_at
FROM
    technology
WHERE
    quadrant_id = $1;

-- name: UpdateTechnology :one
UPDATE technology
SET name = $2,
    blip_id = $3,
    quadrant_id = $4,
    updated_at = NOW()
WHERE
    id = $1
RETURNING id,
    name,
    blip_id,
    quadrant_id,
    created_at,
    updated_at;

-- name: DeleteTechnology :exec
DELETE FROM technology
WHERE
    id = $1;

-- name: CreateBlip :one
INSERT INTO blips (
    context
)
VALUES ($1)
RETURNING id,
    context::text,
    created_at,
    updated_at;

-- name: GetBlip :one
SELECT
    id,
    context::text,
    created_at,
    updated_at
FROM
    blips
WHERE
    id = $1;

-- name: UpdateBlip :one
UPDATE blips
SET context = $2,
    updated_at = NOW()
WHERE
    id = $1
RETURNING id,
    context::text,
    created_at,
    updated_at;

-- name: DeleteBlip :exec
DELETE FROM blips
WHERE
    id = $1;

-- name: CreateUser :one
INSERT INTO users (
    id,
    name,
    email,
    username,
    hashed_password,
    last_logged_in
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id,
    name,
    email,
    username,
    hashed_password,
    created_at,
    last_logged_in;

-- name: GetUserID :one
SELECT
    id,
    name,
    email,
    username,
    hashed_password,
    created_at,
    last_logged_in
FROM
    users
WHERE
    id = $1;

-- name: GetUserEmail :one
SELECT
    id,
    name,
    email,
    username,
    hashed_password,
    created_at,
    last_logged_in
FROM
    users
WHERE
    email = $1;

-- name: UpdateUser :one
UPDATE users
SET name = $2,
    email = $3,
    username = $4,
    hashed_password = $5,
    last_logged_in = $6
WHERE
    id = $1
RETURNING id,
    name,
    email,
    username,
    hashed_password,
    created_at,
    last_logged_in;

-- name: DeleteUser :exec
DELETE FROM users
WHERE
    id = $1;

-- name: CreateUserTechnology :one
INSERT INTO user_technologies (
    id,
    user_id,
    technology_id,
    ring_id
)
VALUES ($1, $2, $3, $4)
RETURNING id,
    user_id,
    technology_id,
    ring_id,
    created_at,
    updated_at;

-- name: GetUserTechnologyID :one
SELECT
    id,
    user_id,
    technology_id,
    ring_id,
    created_at,
    updated_at
FROM
    user_technologies
WHERE
    id = $1;

-- name: GetUserTechnologyUserId :many
SELECT
    id,
    user_id,
    technology_id,
    ring_id,
    created_at,
    updated_at
FROM
    user_technologies
WHERE
    user_id = $1;

-- name: UpdateUserTechnology :one
UPDATE user_technologies
SET user_id = $2,
    technology_id = $3,
    ring_id = $4,
    updated_at = NOW()
WHERE
    id = $1
RETURNING id,
    user_id,
    technology_id,
    ring_id,
    created_at,
    updated_at;

-- name: DeleteUserTechnology :exec
DELETE FROM user_technologies
WHERE
    id = $1;
