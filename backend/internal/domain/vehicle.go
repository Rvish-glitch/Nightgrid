package domain

import "time"

type Vehicle struct {
	ID            string     `json:"id"`
	VehicleNumber string     `json:"vehicle_number"`
	DriverName    string     `json:"driver_name"`
	VehicleType   string     `json:"vehicle_type"`
	Phone         string     `json:"phone"`
	Status        string     `json:"status"`
	CreatedAt     time.Time  `json:"created_at"`
	LastLatitude  *float64   `json:"last_latitude,omitempty"`
	LastLongitude *float64   `json:"last_longitude,omitempty"`
	LastUpdatedAt *time.Time `json:"last_updated_at,omitempty"`
}

type CreateVehicleRequest struct {
	VehicleNumber string `json:"vehicle_number" binding:"required"`
	DriverName    string `json:"driver_name" binding:"required"`
	VehicleType   string `json:"vehicle_type" binding:"required"`
	Phone         string `json:"phone" binding:"required"`
}

type UpdateVehicleStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=active inactive"`
}

type CreateVehicleResponse struct {
	ID            string `json:"id"`
	VehicleNumber string `json:"vehicle_number"`
	Status        string `json:"status"`
	TimeNS        string `json:"time_ns"`
}

type VehiclesListResponse struct {
	Vehicles []Vehicle `json:"vehicles"`
	TimeNS   string    `json:"time_ns"`
}

type UpdateLocationRequest struct {
	VehicleID string  `json:"vehicle_id" binding:"required"`
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
	Timestamp string  `json:"timestamp" binding:"required"`
}

type CurrentGeofenceInfo struct {
	GeofenceID   string           `json:"geofence_id"`
	GeofenceName string           `json:"geofence_name"`
	Status       string           `json:"status,omitempty"`
	Category     GeofenceCategory `json:"category,omitempty"`
}

type UpdateLocationResponse struct {
	VehicleID        string                `json:"vehicle_id"`
	LocationUpdated  bool                  `json:"location_updated"`
	CurrentGeofences []CurrentGeofenceInfo `json:"current_geofences"`
	TimeNS           string                `json:"time_ns"`
}

type VehicleLocationStatusResponse struct {
	VehicleID       string `json:"vehicle_id"`
	VehicleNumber   string `json:"vehicle_number"`
	CurrentLocation struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Timestamp string  `json:"timestamp"`
	} `json:"current_location"`
	CurrentGeofences []CurrentGeofenceInfo `json:"current_geofences"`
	TimeNS           string                `json:"time_ns"`
}

