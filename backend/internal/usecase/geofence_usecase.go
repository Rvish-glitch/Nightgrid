package usecase

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/repository"
	"geofencing-backend/pkg/errors"
	"geofencing-backend/pkg/geo"
)

type GeofenceUseCase struct {
	repo repository.GeofenceRepository
}

func NewGeofenceUseCase(repo repository.GeofenceRepository) *GeofenceUseCase {
	return &GeofenceUseCase{repo: repo}
}

func (u *GeofenceUseCase) CreateGeofence(ctx context.Context, req domain.CreateGeofenceRequest) (*domain.Geofence, error) {
	if strings.TrimSpace(req.Name) == "" {
		return nil, errors.NewValidationError("name is required")
	}

	if !domain.IsValidCategory(req.Category) {
		return nil, errors.NewValidationError(fmt.Sprintf("invalid category '%s', must be one of: delivery_zone, restricted_zone, toll_zone, customer_area", req.Category))
	}

	if err := geo.ValidatePolygonCoordinates(req.Coordinates); err != nil {
		return nil, errors.NewValidationError(err.Error())
	}

	geofence := &domain.Geofence{
		ID:          "geo_" + uuid.New().String()[:8],
		Name:        req.Name,
		Description: req.Description,
		Coordinates: req.Coordinates,
		Category:    req.Category,
		CreatedAt:   time.Now().UTC(),
	}

	if err := u.repo.Create(ctx, geofence); err != nil {
		return nil, fmt.Errorf("failed to save geofence: %w", err)
	}

	return geofence, nil
}

func (u *GeofenceUseCase) ListGeofences(ctx context.Context, category string) ([]domain.Geofence, error) {
	return u.repo.GetAll(ctx, category)
}

func (u *GeofenceUseCase) GetGeofence(ctx context.Context, id string) (*domain.Geofence, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *GeofenceUseCase) UpdateStatus(ctx context.Context, id string, status string) error {
	status = strings.ToLower(strings.TrimSpace(status))
	if status != "active" && status != "inactive" {
		return errors.NewValidationError("status must be active or inactive")
	}
	return u.repo.UpdateStatus(ctx, id, status)
}

func (u *GeofenceUseCase) DeleteGeofence(ctx context.Context, id string) error {
	return u.repo.Delete(ctx, id)
}

