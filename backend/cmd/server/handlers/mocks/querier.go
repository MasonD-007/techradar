package mocks

import (
	"context"

	"github.com/MasonD-007/template/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/mock"
)

// MockQuerier satisfies handlers.Querier for use in unit tests.
type MockQuerier struct {
	mock.Mock
}

func NewMockQuerier() *MockQuerier {
	return &MockQuerier{}
}

func (m *MockQuerier) GetBlip(ctx context.Context, id int32) (db.GetBlipRow, error) {
	args := m.Called(ctx, id)
	blip, _ := args.Get(0).(db.GetBlipRow)
	return blip, args.Error(1)
}

func (m *MockQuerier) CreateBlip(ctx context.Context, context []byte) (db.CreateBlipRow, error) {
	args := m.Called(ctx, context)
	blip, _ := args.Get(0).(db.CreateBlipRow)
	return blip, args.Error(1)
}

func (m *MockQuerier) UpdateBlip(ctx context.Context, params db.UpdateBlipParams) (db.UpdateBlipRow, error) {
	args := m.Called(ctx, params)
	blip, _ := args.Get(0).(db.UpdateBlipRow)
	return blip, args.Error(1)
}

func (m *MockQuerier) DeleteBlip(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockQuerier) GetAllBlips(ctx context.Context) ([]db.GetAllBlipsRow, error) {
	args := m.Called(ctx)
	list, _ := args.Get(0).([]db.GetAllBlipsRow)
	return list, args.Error(1)
}

func (m *MockQuerier) GetTechnologyID(ctx context.Context, id pgtype.UUID) (db.Technology, error) {
	args := m.Called(ctx, id)
	tech, _ := args.Get(0).(db.Technology)
	return tech, args.Error(1)
}

func (m *MockQuerier) GetTechnologyName(ctx context.Context, name string) (db.Technology, error) {
	args := m.Called(ctx, name)
	tech, _ := args.Get(0).(db.Technology)
	return tech, args.Error(1)
}

func (m *MockQuerier) GetTechnologyQuad(ctx context.Context, quadrantID int32) ([]db.Technology, error) {
	args := m.Called(ctx, quadrantID)
	list, _ := args.Get(0).([]db.Technology)
	return list, args.Error(1)
}

func (m *MockQuerier) GetAllTechnologies(ctx context.Context) ([]db.Technology, error) {
	args := m.Called(ctx)
	list, _ := args.Get(0).([]db.Technology)
	return list, args.Error(1)
}

func (m *MockQuerier) CreateTechnology(ctx context.Context, params db.CreateTechnologyParams) (db.Technology, error) {
	args := m.Called(ctx, params)
	tech, _ := args.Get(0).(db.Technology)
	return tech, args.Error(1)
}

func (m *MockQuerier) UpdateTechnology(ctx context.Context, params db.UpdateTechnologyParams) (db.Technology, error) {
	args := m.Called(ctx, params)
	tech, _ := args.Get(0).(db.Technology)
	return tech, args.Error(1)
}

func (m *MockQuerier) DeleteTechnology(ctx context.Context, id pgtype.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockQuerier) GetUserID(ctx context.Context, id pgtype.UUID) (db.User, error) {
	args := m.Called(ctx, id)
	user, _ := args.Get(0).(db.User)
	return user, args.Error(1)
}

func (m *MockQuerier) GetUserEmail(ctx context.Context, email string) (db.User, error) {
	args := m.Called(ctx, email)
	user, _ := args.Get(0).(db.User)
	return user, args.Error(1)
}

func (m *MockQuerier) GetAllUsers(ctx context.Context) ([]db.User, error) {
	args := m.Called(ctx)
	list, _ := args.Get(0).([]db.User)
	return list, args.Error(1)
}

func (m *MockQuerier) CreateUser(ctx context.Context, params db.CreateUserParams) (db.User, error) {
	args := m.Called(ctx, params)
	user, _ := args.Get(0).(db.User)
	return user, args.Error(1)
}

func (m *MockQuerier) UpdateUser(ctx context.Context, params db.UpdateUserParams) (db.User, error) {
	args := m.Called(ctx, params)
	user, _ := args.Get(0).(db.User)
	return user, args.Error(1)
}

func (m *MockQuerier) DeleteUser(ctx context.Context, id pgtype.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockQuerier) GetUserTechnologyID(ctx context.Context, id pgtype.UUID) (db.UserTechnology, error) {
	args := m.Called(ctx, id)
	ut, _ := args.Get(0).(db.UserTechnology)
	return ut, args.Error(1)
}

func (m *MockQuerier) GetUserTechnologyUserId(ctx context.Context, userID pgtype.UUID) ([]db.UserTechnology, error) {
	args := m.Called(ctx, userID)
	list, _ := args.Get(0).([]db.UserTechnology)
	return list, args.Error(1)
}

func (m *MockQuerier) CreateUserTechnology(ctx context.Context, params db.CreateUserTechnologyParams) (db.UserTechnology, error) {
	args := m.Called(ctx, params)
	ut, _ := args.Get(0).(db.UserTechnology)
	return ut, args.Error(1)
}

func (m *MockQuerier) UpdateUserTechnology(ctx context.Context, params db.UpdateUserTechnologyParams) (db.UserTechnology, error) {
	args := m.Called(ctx, params)
	ut, _ := args.Get(0).(db.UserTechnology)
	return ut, args.Error(1)
}

func (m *MockQuerier) DeleteUserTechnology(ctx context.Context, id pgtype.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}
