package handlers

import "github.com/MasonD-007/techradar/backend/cmd/server/handlers/dto"

type CreateBlipRequest = dto.CreateBlipRequest
type UpdateBlipRequest = dto.UpdateBlipRequest

type CreateTechnologyRequest = dto.CreateTechnologyRequest
type UpdateTechnologyRequest = dto.UpdateTechnologyRequest

type CreateUserRequest = dto.CreateUserRequest
type UpdateUserRequest = dto.UpdateUserRequest

type CreateUserTechnologyRequest = dto.CreateUserTechnologyRequest
type UpdateUserTechnologyRequest = dto.UpdateUserTechnologyRequest

type ShareCodeResponse = dto.ShareCodeResponse
type SetVisibilityRequest = dto.SetVisibilityRequest
type AddViewerRequest = dto.AddViewerRequest
type ShareViewersResponse = dto.ShareViewersResponse
type RadarGraphItem = dto.RadarGraphItem
type RadarGraphResponse = dto.RadarGraphResponse
type GalleryEntry = dto.GalleryEntry
type GalleryResponse = dto.GalleryResponse
type TemplateSummary = dto.TemplateSummary
type TemplateDetail = dto.TemplateDetail
type TemplateItemRequest = dto.TemplateItemRequest
type TemplateRequest = dto.TemplateRequest
type ImportSource = dto.ImportSource
type ImportRequest = dto.ImportRequest
type ImportResponse = dto.ImportResponse

// Error documents the standard error payload returned by handlers.
type Error struct {
	Message string `json:"message"`
}
