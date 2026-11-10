package usecase

import (
	"context"
	"time"

	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/repository"
)

type ViolationUseCase struct {
	violRepo repository.ViolationRepository
}

func NewViolationUseCase(violRepo repository.ViolationRepository) *ViolationUseCase {
	return &ViolationUseCase{violRepo: violRepo}
}

func (u *ViolationUseCase) GetViolationHistory(
	ctx context.Context,
	vehicleID, geofenceID string,
	startDateStr, endDateStr string,
	limit int,
) ([]domain.Violation, int, error) {
	var start, end *time.Time

	if startDateStr != "" {
		if t, err := time.Parse(time.RFC3339, startDateStr); err == nil {
			start = &t
		}
	}

	if endDateStr != "" {
		if t, err := time.Parse(time.RFC3339, endDateStr); err == nil {
			end = &t
		}
	}

	if limit <= 0 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}

	return u.violRepo.GetHistory(ctx, vehicleID, geofenceID, start, end, limit)
}

