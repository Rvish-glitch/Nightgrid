package http

import (
	"os"

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

	// Check if frontend dist folder exists (e.g. all-in-one Docker container)
	distPath := ""
	if _, err := os.Stat("dist/index.html"); err == nil {
		distPath = "dist"
	} else if _, err := os.Stat("frontend/dist/index.html"); err == nil {
		distPath = "frontend/dist"
	}

	if distPath != "" {
		r.Static("/assets", distPath+"/assets")
		r.Static("/vehicle-icons", distPath+"/vehicle-icons")
	}

	// Health and Root Status Endpoints
	r.GET("/", func(c *gin.Context) {
		if distPath != "" {
			c.File(distPath + "/index.html")
			return
		}
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "Geofencing & Real-Time Alert Backend",
			"docs":    "/swagger",
			"endpoints": gin.H{
				"swagger":   "/swagger",
				"vehicles":  "/vehicles",
				"geofences": "/geofences",
				"alerts":    "/alerts",
				"history":   "/violations/history",
				"websocket": "/ws/alerts",
			},
		})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "UP"})
	})

	// Swagger UI Endpoints
	r.GET("/swagger", ServeSwaggerUI)
	r.GET("/swagger/openapi.json", ServeOpenAPISpec)

	// 1 & 2. Geofence Endpoints
	r.POST("/geofences", cfg.GeofenceHandler.CreateGeofence)
	r.GET("/geofences", cfg.GeofenceHandler.ListGeofences)
	r.PATCH("/geofences/:id/status", cfg.GeofenceHandler.UpdateStatus)
	r.DELETE("/geofences/:id", cfg.GeofenceHandler.DeleteGeofence)

	// 3 & 4. Vehicle Endpoints
	r.POST("/vehicles", cfg.VehicleHandler.CreateVehicle)
	r.GET("/vehicles", cfg.VehicleHandler.ListVehicles)
	r.PATCH("/vehicles/:id/status", cfg.VehicleHandler.UpdateStatus)
	r.DELETE("/vehicles/:id", cfg.VehicleHandler.DeleteVehicle)

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
