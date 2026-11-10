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
)

type AlertUseCase struct {
	alertRepo repository.AlertRepository
	geoRepo   repository.GeofenceRepository
	vehRepo   repository.VehicleRepository
}

func NewAlertUseCase(
	alertRepo repository.AlertRepository,
	geoRepo repository.GeofenceRepository,
	vehRepo repository.VehicleRepository,
) *AlertUseCase {
	return &AlertUseCase{
		alertRepo: alertRepo,
		geoRepo:   geoRepo,
		vehRepo:   vehRepo,
	}
}

func (u *AlertUseCase) ConfigureAlert(ctx context.Context, req domain.ConfigureAlertRequest) (*domain.AlertRule, error) {
	if strings.TrimSpace(req.GeofenceID) == "" {
		return nil, errors.NewValidationError("geofence_id is required")
	}

	if !domain.IsValidEventType(req.EventType) {
		return nil, errors.NewValidationError(fmt.Sprintf("invalid event_type '%s', must be one of: entry, exit, both", req.EventType))
	}

	// Verify geofence exists
	geofence, err := u.geoRepo.GetByID(ctx, req.GeofenceID)
	if err != nil {
		return nil, err
	}

	var vehicleNumber string
	if req.VehicleID != nil && *req.VehicleID != "" {
		veh, err := u.vehRepo.GetByID(ctx, *req.VehicleID)
		if err != nil {
			return nil, err
		}
		vehicleNumber = veh.VehicleNumber
	}

	alertRule := &domain.AlertRule{
		AlertID:       "alert_" + uuid.New().String()[:8],
		GeofenceID:    geofence.ID,
		GeofenceName:  geofence.Name,
		VehicleID:     req.VehicleID,
		VehicleNumber: vehicleNumber,
		EventType:     req.EventType,
		Status:        "active",
		CreatedAt:     time.Now().UTC(),
	}

	if err := u.alertRepo.Create(ctx, alertRule); err != nil {
		return nil, fmt.Errorf("failed to save alert rule: %w", err)
	}

	return alertRule, nil
}

func (u *AlertUseCase) ListAlerts(ctx context.Context, geofenceID, vehicleID string) ([]domain.AlertRule, error) {
	return u.alertRepo.GetAll(ctx, geofenceID, vehicleID)
}

