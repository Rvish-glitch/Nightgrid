package domain

import "time"

type GeofenceCategory string

const (
	CategoryDeliveryZone   GeofenceCategory = "delivery_zone"
	CategoryRestrictedZone GeofenceCategory = "restricted_zone"
	CategoryTollZone       GeofenceCategory = "toll_zone"
	CategoryCustomerArea   GeofenceCategory = "customer_area"
)

func IsValidCategory(c GeofenceCategory) bool {
	switch c {
	case CategoryDeliveryZone, CategoryRestrictedZone, CategoryTollZone, CategoryCustomerArea:
		return true
	default:
		return false
	}
}

type Geofence struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	Description string           `json:"description,omitempty"`
	Coordinates [][2]float64     `json:"coordinates"` // [lat, lng]
	Category    GeofenceCategory `json:"category"`
	CreatedAt   time.Time        `json:"created_at"`
}

type CreateGeofenceRequest struct {
	Name        string           `json:"name" binding:"required"`
	Description string           `json:"description"`
	Coordinates [][2]float64     `json:"coordinates" binding:"required"`
	Category    GeofenceCategory `json:"category" binding:"required"`
}

type CreateGeofenceResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
	TimeNS string `json:"time_ns"`
}

type GeofencesListResponse struct {
	Geofences []Geofence `json:"geofences"`
	TimeNS    string     `json:"time_ns"`
}

