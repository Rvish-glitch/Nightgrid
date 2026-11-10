package domain

import "time"

type EventType string

const (
	EventEntry EventType = "entry"
	EventExit  EventType = "exit"
	EventBoth  EventType = "both"
)

func IsValidEventType(e EventType) bool {
	return e == EventEntry || e == EventExit || e == EventBoth
}

type AlertRule struct {
	AlertID       string    `json:"alert_id"`
	GeofenceID    string    `json:"geofence_id"`
	GeofenceName  string    `json:"geofence_name,omitempty"`
	VehicleID     *string   `json:"vehicle_id,omitempty"`
	VehicleNumber string    `json:"vehicle_number,omitempty"`
	EventType     EventType `json:"event_type"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type ConfigureAlertRequest struct {
	GeofenceID string    `json:"geofence_id" binding:"required"`
	VehicleID  *string   `json:"vehicle_id"`
	EventType  EventType `json:"event_type" binding:"required"`
}

type ConfigureAlertResponse struct {
	AlertID    string    `json:"alert_id"`
	GeofenceID string    `json:"geofence_id"`
	VehicleID  *string   `json:"vehicle_id,omitempty"`
	EventType  EventType `json:"event_type"`
	Status     string    `json:"status"`
	TimeNS     string    `json:"time_ns"`
}

type AlertsListResponse struct {
	Alerts []AlertRule `json:"alerts"`
	TimeNS string      `json:"time_ns"`
}

// WebSocketAlertMessage payload broadcast via /ws/alerts
type WebSocketAlertMessage struct {
	EventID   string    `json:"event_id"`
	EventType EventType `json:"event_type"`
	Timestamp string    `json:"timestamp"`
	Vehicle   struct {
		VehicleID     string `json:"vehicle_id"`
		VehicleNumber string `json:"vehicle_number"`
		DriverName    string `json:"driver_name"`
	} `json:"vehicle"`
	Geofence struct {
		GeofenceID   string           `json:"geofence_id"`
		GeofenceName string           `json:"geofence_name"`
		Category     GeofenceCategory `json:"category"`
	} `json:"geofence"`
	Location struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"location"`
}

