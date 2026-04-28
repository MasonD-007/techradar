package uuidutil

import (
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func Parse(idStr string) (pgtype.UUID, error) {
	var id pgtype.UUID
	u, err := uuid.Parse(idStr)
	if err != nil {
		return id, err
	}
	id.Bytes = u
	id.Valid = true
	return id, nil
}

func New() pgtype.UUID {
	var id pgtype.UUID
	u := uuid.New()
	id.Bytes = u
	id.Valid = true
	return id
}
