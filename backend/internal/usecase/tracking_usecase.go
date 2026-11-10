package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"geofencing-backend/internal/delivery/ws"
	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/repository"
	"geofencing-backend/pkg/errors"
)

type TrackingUseCase struct {
	geoRepo   repository.GeofenceRepository
	vehRepo   repository.VehicleRepository
	stateRepo repository.StateRepository
	alertRepo repository.AlertRepository
	violRepo  repository.ViolationRepository
	wsHub     *ws.Hub
}

func NewTrackingUseCase(
	geoRepo repository.GeofenceRepository,
	vehRepo repository.VehicleRepository,
	stateRepo repository.StateRepository,
	alertRepo repository.AlertRepository,
	violRepo repository.ViolationRepository,
	wsHub *ws.Hub,
) *TrackingUseCase {
	return &TrackingUseCase{
		geoRepo:   geoRepo,
		vehRepo:   vehRepo,
		stateRepo: stateRepo,
		alertRepo: alertRepo,
		violRepo:  violRepo,
		wsHub:     wsHub,
	}
}

func (u *TrackingUseCase) UpdateLocation(ctx context.Context, req domain.UpdateLocationRequest) ([]domain.CurrentGeofenceInfo, error) {
	if req.Latitude < -90 || req.Latitude > 90 {
		return nil, errors.NewValidationError("latitude must be between -90 and 90")
	}
	if req.Longitude < -180 || req.Longitude > 180 {
		return nil, errors.NewValidationError("longitude must be between -180 and 180")
	}

	// 1. Verify vehicle exists
	vehicle, err := u.vehRepo.GetByID(ctx, req.VehicleID)
	if err != nil {
		return nil, err
	}

	timestamp, err := time.Parse(time.RFC3339, req.Timestamp)
	if err != nil {
		timestamp = time.Now().UTC()
	}

	// 2. Evaluate Point-in-Polygon for all geofences
	currentGeofences, err := u.geoRepo.FindContainingGeofences(ctx, req.Latitude, req.Longitude)
	if err != nil {
		return nil, fmt.Errorf("failed to evaluate spatial geofences: %w", err)
	}

	currentMap := make(map[string]domain.Geofence, len(currentGeofences))
	currentIDs := make([]string, 0, len(currentGeofences))
	currentInfo := make([]domain.CurrentGeofenceInfo, 0, len(currentGeofences))

	for _, g := range currentGeofences {
		currentMap[g.ID] = g
		currentIDs = append(currentIDs, g.ID)
		currentInfo = append(currentInfo, domain.CurrentGeofenceInfo{
			GeofenceID:   g.ID,
			GeofenceName: g.Name,
			Status:       "inside",
			Category:     g.Category,
		})
	}

	// 3. Get previous active geofences
	previousIDs, err := u.stateRepo.GetActiveGeofences(ctx, req.VehicleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get previous geofence state: %w", err)
	}

	previousMap := make(map[string]bool, len(previousIDs))
	for _, id := range previousIDs {
		previousMap[id] = true
	}

	// 4. Detect State Transitions
	// A) ENTRY events: In current, but not in previous
	for gid, g := range currentMap {
		if !previousMap[gid] {
			u.handleEvent(ctx, vehicle, g, domain.EventEntry, req.Latitude, req.Longitude, timestamp)
		}
	}

	// B) EXIT events: In previous, but not in current
	for _, gid := range previousIDs {
		if _, stillInside := currentMap[gid]; !stillInside {
			// Retrieve geofence details for exit notification
			if g, err := u.geoRepo.GetByID(ctx, gid); err == nil && g != nil {
				u.handleEvent(ctx, vehicle, *g, domain.EventExit, req.Latitude, req.Longitude, timestamp)
			}
		}
	}

	// 5. Update vehicle location and state
	if err := u.vehRepo.UpdateLocation(ctx, req.VehicleID, req.Latitude, req.Longitude, timestamp); err != nil {
		return nil, err
	}

	if err := u.stateRepo.SetActiveGeofences(ctx, req.VehicleID, currentIDs); err != nil {
		return nil, err
	}

	return currentInfo, nil
}

// handleEvent checks matching alert rules, creates violation history, and broadcasts WebSocket alerts
func (u *TrackingUseCase) handleEvent(
	ctx context.Context,
	vehicle *domain.Vehicle,
	geofence domain.Geofence,
	eventType domain.EventType,
	lat, lng float64,
	timestamp time.Time,
) {
	// Query matching alert rules for this geofence, vehicle, and event type
	rules, err := u.alertRepo.FindMatchingRules(ctx, geofence.ID, vehicle.ID, eventType)
	if err != nil || len(rules) == 0 {
		// Even if no specific user rule is configured, restricted zones always record violation & alert
		if geofence.Category != domain.CategoryRestrictedZone {
			return
		}
	}

	eventID := "evt_" + uuid.New().String()[:8]
	violID := "viol_" + uuid.New().String()[:8]

	// 1. Save violation record
	violation := &domain.Violation{
		ID:            violID,
		EventID:       eventID,
		VehicleID:     vehicle.ID,
		VehicleNumber: vehicle.VehicleNumber,
		GeofenceID:    geofence.ID,
		GeofenceName:  geofence.Name,
		EventType:     eventType,
		Latitude:      lat,
		Longitude:     lng,
		Timestamp:     timestamp,
	}
	_ = u.violRepo.Create(ctx, violation)

	// 2. Prepare WebSocket alert payload
	wsMsg := domain.WebSocketAlertMessage{
		EventID:   eventID,
		EventType: eventType,
		Timestamp: timestamp.Format(time.RFC3339),
	}
	wsMsg.Vehicle.VehicleID = vehicle.ID
	wsMsg.Vehicle.VehicleNumber = vehicle.VehicleNumber
	wsMsg.Vehicle.DriverName = vehicle.DriverName

	wsMsg.Geofence.GeofenceID = geofence.ID
	wsMsg.Geofence.GeofenceName = geofence.Name
	wsMsg.Geofence.Category = geofence.Category

	wsMsg.Location.Latitude = lat
	wsMsg.Location.Longitude = lng

	// 3. Asynchronously broadcast without blocking the HTTP response
	go u.wsHub.Broadcast(wsMsg)
}

func (u *TrackingUseCase) GetVehicleLocationStatus(ctx context.Context, vehicleID string) (*domain.VehicleLocationStatusResponse, error) {
	vehicle, err := u.vehRepo.GetByID(ctx, vehicleID)
	if err != nil {
		return nil, err
	}

	resp := &domain.VehicleLocationStatusResponse{
		VehicleID:        vehicle.ID,
		VehicleNumber:    vehicle.VehicleNumber,
		CurrentGeofences: make([]domain.CurrentGeofenceInfo, 0),
	}

	if vehicle.LastLatitude != nil && vehicle.LastLongitude != nil {
		resp.CurrentLocation.Latitude = *vehicle.LastLatitude
		resp.CurrentLocation.Longitude = *vehicle.LastLongitude
		if vehicle.LastUpdatedAt != nil {
			resp.CurrentLocation.Timestamp = vehicle.LastUpdatedAt.Format(time.RFC3339)
		}

		geofences, err := u.geoRepo.FindContainingGeofences(ctx, *vehicle.LastLatitude, *vehicle.LastLongitude)
		if err == nil {
			for _, g := range geofences {
				resp.CurrentGeofences = append(resp.CurrentGeofences, domain.CurrentGeofenceInfo{
					GeofenceID:   g.ID,
					GeofenceName: g.Name,
					Category:     g.Category,
				})
			}
		}
	}

	return resp, nil
}

