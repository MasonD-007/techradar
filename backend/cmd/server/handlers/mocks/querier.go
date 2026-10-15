package mocks

import (
	"context"

	"github.com/MasonD-007/techradar/backend/internal/db"
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

func (m *MockQuerier) UpdateUserLastLogin(ctx context.Context, params db.UpdateUserLastLoginParams) error {
	args := m.Called(ctx, params)
	return args.Error(0)
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

func (m *MockQuerier) GetShareCodeByCode(ctx context.Context, id string) (db.ShareCode, error) {
	args := m.Called(ctx, id)
	sc, _ := args.Get(0).(db.ShareCode)
	return sc, args.Error(1)
}

func (m *MockQuerier) GetShareCodeByUserId(ctx context.Context, userID pgtype.UUID) (db.ShareCode, error) {
	args := m.Called(ctx, userID)
	sc, _ := args.Get(0).(db.ShareCode)
	return sc, args.Error(1)
}

func (m *MockQuerier) CreateShareCode(ctx context.Context, params db.CreateShareCodeParams) (db.ShareCode, error) {
	args := m.Called(ctx, params)
	sc, _ := args.Get(0).(db.ShareCode)
	return sc, args.Error(1)
}

func (m *MockQuerier) DeleteShareCode(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockQuerier) GetRadarGraphByShareCode(ctx context.Context, code string) ([]db.GetRadarGraphByShareCodeRow, error) {
	args := m.Called(ctx, code)
	list, _ := args.Get(0).([]db.GetRadarGraphByShareCodeRow)
	return list, args.Error(1)
}

func (m *MockQuerier) SetShareCodeVisibility(ctx context.Context, params db.SetShareCodeVisibilityParams) (db.ShareCode, error) {
	args := m.Called(ctx, params)
	sc, _ := args.Get(0).(db.ShareCode)
	return sc, args.Error(1)
}

func (m *MockQuerier) CanViewShareCode(ctx context.Context, params db.CanViewShareCodeParams) (bool, error) {
	args := m.Called(ctx, params)
	return args.Bool(0), args.Error(1)
}

func (m *MockQuerier) AddShareCodeViewer(ctx context.Context, params db.AddShareCodeViewerParams) error {
	args := m.Called(ctx, params)
	return args.Error(0)
}

func (m *MockQuerier) RemoveShareCodeViewer(ctx context.Context, params db.RemoveShareCodeViewerParams) error {
	args := m.Called(ctx, params)
	return args.Error(0)
}

func (m *MockQuerier) ListShareCodeViewers(ctx context.Context, shareCodeID string) ([]string, error) {
	args := m.Called(ctx, shareCodeID)
	list, _ := args.Get(0).([]string)
	return list, args.Error(1)
}

func (m *MockQuerier) GetUserByUsername(ctx context.Context, username string) (db.User, error) {
	args := m.Called(ctx, username)
	u, _ := args.Get(0).(db.User)
	return u, args.Error(1)
}

func (m *MockQuerier) SetShareCodeListed(ctx context.Context, params db.SetShareCodeListedParams) (db.ShareCode, error) {
	args := m.Called(ctx, params)
	sc, _ := args.Get(0).(db.ShareCode)
	return sc, args.Error(1)
}

func (m *MockQuerier) ListGalleryRadars(ctx context.Context, params db.ListGalleryRadarsParams) ([]db.ListGalleryRadarsRow, error) {
	args := m.Called(ctx, params)
	list, _ := args.Get(0).([]db.ListGalleryRadarsRow)
	return list, args.Error(1)
}

func (m *MockQuerier) ListGalleryTopTechnologies(ctx context.Context, codes []string) ([]db.ListGalleryTopTechnologiesRow, error) {
	args := m.Called(ctx, codes)
	list, _ := args.Get(0).([]db.ListGalleryTopTechnologiesRow)
	return list, args.Error(1)
}

func (m *MockQuerier) ListTemplates(ctx context.Context) ([]db.ListTemplatesRow, error) {
	args := m.Called(ctx)
	list, _ := args.Get(0).([]db.ListTemplatesRow)
	return list, args.Error(1)
}

func (m *MockQuerier) GetTemplateBySlug(ctx context.Context, slug string) (db.Template, error) {
	args := m.Called(ctx, slug)
	t, _ := args.Get(0).(db.Template)
	return t, args.Error(1)
}

func (m *MockQuerier) ListTemplateItems(ctx context.Context, templateID int32) ([]db.ListTemplateItemsRow, error) {
	args := m.Called(ctx, templateID)
	list, _ := args.Get(0).([]db.ListTemplateItemsRow)
	return list, args.Error(1)
}

func (m *MockQuerier) CreateTemplate(ctx context.Context, params db.CreateTemplateParams) (db.Template, error) {
	args := m.Called(ctx, params)
	t, _ := args.Get(0).(db.Template)
	return t, args.Error(1)
}

func (m *MockQuerier) UpdateTemplate(ctx context.Context, params db.UpdateTemplateParams) (db.Template, error) {
	args := m.Called(ctx, params)
	t, _ := args.Get(0).(db.Template)
	return t, args.Error(1)
}

func (m *MockQuerier) DeleteTemplate(ctx context.Context, slug string) (int64, error) {
	args := m.Called(ctx, slug)
	n, _ := args.Get(0).(int64)
	return n, args.Error(1)
}

func (m *MockQuerier) DeleteTemplateItems(ctx context.Context, templateID int32) error {
	args := m.Called(ctx, templateID)
	return args.Error(0)
}

func (m *MockQuerier) AddTemplateItem(ctx context.Context, params db.AddTemplateItemParams) error {
	args := m.Called(ctx, params)
	return args.Error(0)
}

func (m *MockQuerier) AddUserTechnologyIfMissing(ctx context.Context, params db.AddUserTechnologyIfMissingParams) (int64, error) {
	args := m.Called(ctx, params)
	n, _ := args.Get(0).(int64)
	return n, args.Error(1)
}
