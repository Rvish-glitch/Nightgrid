package http

import (
	"github.com/gin-gonic/gin"

	"geofencing-backend/internal/delivery/middleware"
	"geofencing-backend/internal/delivery/ws"
)

type RouterConfig struct {
	GeofenceHandler  *GeofenceHandler
	VehicleHandler   *VehicleHandler
	LocationHandler  *LocationHandler
	AlertHandler     *AlertHandler
	ViolationHandler *ViolationHandler
	WSHandler        *ws.WebSocketHandler
}

// SetupRouter initializes the Gin engine and registers all required API endpoints
func SetupRouter(cfg RouterConfig) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.TimingMiddleware())

	// Swagger UI Endpoints
	r.GET("/swagger", ServeSwaggerUI)
	r.GET("/swagger/openapi.json", ServeOpenAPISpec)

	// 1 & 2. Geofence Endpoints
	r.POST("/geofences", cfg.GeofenceHandler.CreateGeofence)
	r.GET("/geofences", cfg.GeofenceHandler.ListGeofences)

	// 3 & 4. Vehicle Endpoints
	r.POST("/vehicles", cfg.VehicleHandler.CreateVehicle)
	r.GET("/vehicles", cfg.VehicleHandler.ListVehicles)

	// 5 & 6. Location Tracking Endpoints
	r.POST("/vehicles/location", cfg.LocationHandler.UpdateLocation)
	r.GET("/vehicles/location/:vehicle_id", cfg.LocationHandler.GetVehicleLocation)

	// 7 & 8. Alert Rules Endpoints
	r.POST("/alerts/configure", cfg.AlertHandler.ConfigureAlert)
	r.GET("/alerts", cfg.AlertHandler.ListAlerts)

	// 9. Violation History Endpoint
	r.GET("/violations/history", cfg.ViolationHandler.GetViolationHistory)

	// Real-time Alert System (WebSocket Endpoint)
	r.GET("/ws/alerts", cfg.WSHandler.HandleAlerts)

	return r
}
