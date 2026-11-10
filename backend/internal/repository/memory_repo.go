package repository

import (
	"context"
	"sort"
	"strings"
	"sync"
	"time"

	"geofencing-backend/internal/domain"
	"geofencing-backend/pkg/errors"
	"geofencing-backend/pkg/geo"
)

// ================= Geofence Repository =================

type MemoryGeofenceRepository struct {
	mu        sync.RWMutex
	geofences map[string]domain.Geofence
}

func NewMemoryGeofenceRepository() *MemoryGeofenceRepository {
	return &MemoryGeofenceRepository{
		geofences: make(map[string]domain.Geofence),
	}
}

func (r *MemoryGeofenceRepository) Create(ctx context.Context, g *domain.Geofence) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.geofences[g.ID] = *g
	return nil
}

func (r *MemoryGeofenceRepository) GetAll(ctx context.Context, category string) ([]domain.Geofence, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]domain.Geofence, 0, len(r.geofences))
	for _, g := range r.geofences {
		if category == "" || string(g.Category) == category {
			list = append(list, g)
		}
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].CreatedAt.After(list[j].CreatedAt)
	})
	return list, nil
}

func (r *MemoryGeofenceRepository) GetByID(ctx context.Context, id string) (*domain.Geofence, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	g, ok := r.geofences[id]
	if !ok {
		return nil, errors.NewNotFoundError("geofence not found")
	}
	return &g, nil
}

func (r *MemoryGeofenceRepository) FindContainingGeofences(ctx context.Context, lat, lng float64) ([]domain.Geofence, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var matched []domain.Geofence
	pt := [2]float64{lat, lng}

	for _, g := range r.geofences {
		if geo.PointInPolygon(pt, g.Coordinates) {
			matched = append(matched, g)
		}
	}
	return matched, nil
}

// ================= Vehicle Repository =================

type MemoryVehicleRepository struct {
	mu         sync.RWMutex
	vehicles   map[string]domain.Vehicle
	vehNumbers map[string]string
}

func NewMemoryVehicleRepository() *MemoryVehicleRepository {
	return &MemoryVehicleRepository{
		vehicles:   make(map[string]domain.Vehicle),
		vehNumbers: make(map[string]string),
	}
}

func (r *MemoryVehicleRepository) Create(ctx context.Context, v *domain.Vehicle) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	upperNum := strings.ToUpper(v.VehicleNumber)
	if _, exists := r.vehNumbers[upperNum]; exists {
		return errors.NewConflictError("vehicle with this registration number already exists")
	}

	r.vehicles[v.ID] = *v
	r.vehNumbers[upperNum] = v.ID
	return nil
}

func (r *MemoryVehicleRepository) GetAll(ctx context.Context) ([]domain.Vehicle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]domain.Vehicle, 0, len(r.vehicles))
	for _, v := range r.vehicles {
		list = append(list, v)
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].CreatedAt.After(list[j].CreatedAt)
	})
	return list, nil
}

func (r *MemoryVehicleRepository) GetByID(ctx context.Context, id string) (*domain.Vehicle, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	v, ok := r.vehicles[id]
	if !ok {
		return nil, errors.NewNotFoundError("vehicle not found")
	}
	return &v, nil
}

func (r *MemoryVehicleRepository) UpdateLocation(ctx context.Context, id string, lat, lng float64, t time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	v, ok := r.vehicles[id]
	if !ok {
		return errors.NewNotFoundError("vehicle not found")
	}

	v.LastLatitude = &lat
	v.LastLongitude = &lng
	v.LastUpdatedAt = &t
	r.vehicles[id] = v
	return nil
}

// ================= State Repository =================

type MemoryStateRepository struct {
	mu     sync.RWMutex
	states map[string]map[string]bool // vehicle_id -> set of geofence_ids
}

func NewMemoryStateRepository() *MemoryStateRepository {
	return &MemoryStateRepository{
		states: make(map[string]map[string]bool),
	}
}

func (r *MemoryStateRepository) GetActiveGeofences(ctx context.Context, vehicleID string) ([]string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	set, ok := r.states[vehicleID]
	if !ok {
		return []string{}, nil
	}

	list := make([]string, 0, len(set))
	for gid := range set {
		list = append(list, gid)
	}
	return list, nil
}

func (r *MemoryStateRepository) SetActiveGeofences(ctx context.Context, vehicleID string, geofenceIDs []string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	newSet := make(map[string]bool, len(geofenceIDs))
	for _, gid := range geofenceIDs {
		newSet[gid] = true
	}
	r.states[vehicleID] = newSet
	return nil
}

// ================= Alert Repository =================

type MemoryAlertRepository struct {
	mu         sync.RWMutex
	alertRules map[string]domain.AlertRule
}

func NewMemoryAlertRepository() *MemoryAlertRepository {
	return &MemoryAlertRepository{
		alertRules: make(map[string]domain.AlertRule),
	}
}

func (r *MemoryAlertRepository) Create(ctx context.Context, a *domain.AlertRule) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.alertRules[a.AlertID] = *a
	return nil
}

func (r *MemoryAlertRepository) GetAll(ctx context.Context, geofenceID, vehicleID string) ([]domain.AlertRule, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	list := make([]domain.AlertRule, 0, len(r.alertRules))
	for _, a := range r.alertRules {
		if geofenceID != "" && a.GeofenceID != geofenceID {
			continue
		}
		if vehicleID != "" {
			if a.VehicleID == nil || *a.VehicleID != vehicleID {
				continue
			}
		}
		list = append(list, a)
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].CreatedAt.After(list[j].CreatedAt)
	})
	return list, nil
}

func (r *MemoryAlertRepository) FindMatchingRules(ctx context.Context, geofenceID, vehicleID string, event domain.EventType) ([]domain.AlertRule, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var matched []domain.AlertRule
	for _, rule := range r.alertRules {
		if rule.GeofenceID != geofenceID {
			continue
		}
		if rule.VehicleID != nil && *rule.VehicleID != vehicleID {
			continue
		}
		if rule.EventType == domain.EventBoth || rule.EventType == event {
			matched = append(matched, rule)
		}
	}
	return matched, nil
}

// ================= Violation Repository =================

type MemoryViolationRepository struct {
	mu         sync.RWMutex
	violations []domain.Violation
}

func NewMemoryViolationRepository() *MemoryViolationRepository {
	return &MemoryViolationRepository{
		violations: make([]domain.Violation, 0),
	}
}

func (r *MemoryViolationRepository) Create(ctx context.Context, v *domain.Violation) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.violations = append(r.violations, *v)
	return nil
}

func (r *MemoryViolationRepository) GetHistory(ctx context.Context, vehicleID, geofenceID string, startDate, endDate *time.Time, limit int) ([]domain.Violation, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []domain.Violation
	for _, v := range r.violations {
		if vehicleID != "" && v.VehicleID != vehicleID {
			continue
		}
		if geofenceID != "" && v.GeofenceID != geofenceID {
			continue
		}
		if startDate != nil && v.Timestamp.Before(*startDate) {
			continue
		}
		if endDate != nil && v.Timestamp.After(*endDate) {
			continue
		}
		filtered = append(filtered, v)
	}

	total := len(filtered)

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].Timestamp.After(filtered[j].Timestamp)
	})

	if limit > 0 && len(filtered) > limit {
		filtered = filtered[:limit]
	}

	return filtered, total, nil
}
