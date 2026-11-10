package repository

import (
	"context"
	"time"

	"geofencing-backend/internal/domain"
)

type GeofenceRepository interface {
	Create(ctx context.Context, g *domain.Geofence) error
	GetAll(ctx context.Context, category string) ([]domain.Geofence, error)
	GetByID(ctx context.Context, id string) (*domain.Geofence, error)
	FindContainingGeofences(ctx context.Context, lat, lng float64) ([]domain.Geofence, error)
}

type VehicleRepository interface {
	Create(ctx context.Context, v *domain.Vehicle) error
	GetAll(ctx context.Context) ([]domain.Vehicle, error)
	GetByID(ctx context.Context, id string) (*domain.Vehicle, error)
	UpdateLocation(ctx context.Context, id string, lat, lng float64, t time.Time) error
}

type StateRepository interface {
	GetActiveGeofences(ctx context.Context, vehicleID string) ([]string, error)
	SetActiveGeofences(ctx context.Context, vehicleID string, geofenceIDs []string) error
}

type AlertRepository interface {
	Create(ctx context.Context, a *domain.AlertRule) error
	GetAll(ctx context.Context, geofenceID, vehicleID string) ([]domain.AlertRule, error)
	FindMatchingRules(ctx context.Context, geofenceID, vehicleID string, event domain.EventType) ([]domain.AlertRule, error)
}

type ViolationRepository interface {
	Create(ctx context.Context, v *domain.Violation) error
	GetHistory(ctx context.Context, vehicleID, geofenceID string, startDate, endDate *time.Time, limit int) ([]domain.Violation, int, error)
}
