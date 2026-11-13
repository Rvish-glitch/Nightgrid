package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"

	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/repository"
	"geofencing-backend/pkg/errors"
)

type VehicleUseCase struct {
	repo repository.VehicleRepository
}

func NewVehicleUseCase(repo repository.VehicleRepository) *VehicleUseCase {
	return &VehicleUseCase{repo: repo}
}

func (u *VehicleUseCase) CreateVehicle(ctx context.Context, req domain.CreateVehicleRequest) (*domain.Vehicle, error) {
	if strings.TrimSpace(req.VehicleNumber) == "" {
		return nil, errors.NewValidationError("vehicle_number is required")
	}
	if strings.TrimSpace(req.DriverName) == "" {
		return nil, errors.NewValidationError("driver_name is required")
	}
	if strings.TrimSpace(req.VehicleType) == "" {
		return nil, errors.NewValidationError("vehicle_type is required")
	}
	if strings.TrimSpace(req.Phone) == "" {
		return nil, errors.NewValidationError("phone is required")
	}

	vehicle := &domain.Vehicle{
		ID:            "veh_" + uuid.New().String()[:8],
		VehicleNumber: strings.ToUpper(strings.TrimSpace(req.VehicleNumber)),
		DriverName:    strings.TrimSpace(req.DriverName),
		VehicleType:   strings.ToLower(strings.TrimSpace(req.VehicleType)),
		Phone:         strings.TrimSpace(req.Phone),
		Status:        "active",
		CreatedAt:     time.Now().UTC(),
	}

	if err := u.repo.Create(ctx, vehicle); err != nil {
		return nil, err
	}

	return vehicle, nil
}

func (u *VehicleUseCase) ListVehicles(ctx context.Context) ([]domain.Vehicle, error) {
	return u.repo.GetAll(ctx)
}

func (u *VehicleUseCase) GetVehicle(ctx context.Context, id string) (*domain.Vehicle, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *VehicleUseCase) UpdateStatus(ctx context.Context, id string, status string) error {
	status = strings.ToLower(strings.TrimSpace(status))
	if status != "active" && status != "inactive" {
		return errors.NewValidationError("status must be active or inactive")
	}
	return u.repo.UpdateStatus(ctx, id, status)
}

func (u *VehicleUseCase) DeleteVehicle(ctx context.Context, id string) error {
	return u.repo.Delete(ctx, id)
}
