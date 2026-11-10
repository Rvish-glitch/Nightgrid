package domain

import "time"

type Violation struct {
	ID            string    `json:"id"`
	EventID       string    `json:"event_id,omitempty"`
	VehicleID     string    `json:"vehicle_id"`
	VehicleNumber string    `json:"vehicle_number"`
	GeofenceID    string    `json:"geofence_id"`
	GeofenceName  string    `json:"geofence_name"`
	EventType     EventType `json:"event_type"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	Timestamp     time.Time `json:"timestamp"`
}

type ViolationHistoryResponse struct {
	Violations []Violation `json:"violations"`
	TotalCount int         `json:"total_count"`
	TimeNS     string      `json:"time_ns"`
}

