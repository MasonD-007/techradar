-- name: CreatePost :one 
INSERT INTO posts(
    name,
    description
)
VALUES ($1, $2) RETURNING id,
name,
description,
created_at,
updated_at;

-- name: GetPost :one
SELECT
    id,
    name,
    description,
    created_at,
    updated_at
FROM
    posts
WHERE
    id = $1;

-- name: UpdatePost :one
UPDATE posts
SET name = $2,
description = $3,
updated_at = NOW()
WHERE
    id = $1 RETURNING id,
    name,
    description,
    created_at,
    updated_at;

-- name: DeletePost :exec
DELETE FROM posts
WHERE
    id = $1;

-- name: ListPosts :many
SELECT
    id,
    name,
    description,
    created_at,
    updated_at
FROM
    posts
ORDER BY
    created_at DESC;
