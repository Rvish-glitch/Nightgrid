package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	deliveryhttp "geofencing-backend/internal/delivery/http"
	deliveryws "geofencing-backend/internal/delivery/ws"
	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/repository"
	"geofencing-backend/internal/usecase"
)

func main() {
	// Set Gin mode
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 1. Initialize Repositories (In-Memory thread-safe data store)
	geoRepo := repository.NewMemoryGeofenceRepository()
	vehRepo := repository.NewMemoryVehicleRepository()
	stateRepo := repository.NewMemoryStateRepository()
	alertRepo := repository.NewMemoryAlertRepository()
	violationRepo := repository.NewMemoryViolationRepository()

	// 2. Initialize WebSocket Hub
	wsHub := deliveryws.NewHub()
	go wsHub.Run()

	// 3. Initialize UseCases
	geoUC := usecase.NewGeofenceUseCase(geoRepo)
	vehUC := usecase.NewVehicleUseCase(vehRepo)
	alertUC := usecase.NewAlertUseCase(alertRepo, geoRepo, vehRepo)
	violationUC := usecase.NewViolationUseCase(violationRepo)

	// Tracking UseCase injects wsHub for real-time alert broadcasts
	trackingUC := usecase.NewTrackingUseCase(geoRepo, vehRepo, stateRepo, alertRepo, violationRepo, wsHub)

	// 4. Pre-seed initial geofences, vehicles, and alert rules
	seedInitialData(geoUC, vehUC, trackingUC, alertUC)

	// 5. Initialize Delivery Handlers
	geoHandler := deliveryhttp.NewGeofenceHandler(geoUC)
	vehHandler := deliveryhttp.NewVehicleHandler(vehUC)
	locHandler := deliveryhttp.NewLocationHandler(trackingUC)
	alertHandler := deliveryhttp.NewAlertHandler(alertUC)
	violationHandler := deliveryhttp.NewViolationHandler(violationUC)
	wsHandler := deliveryws.NewWebSocketHandler(wsHub)

	// 6. Setup Router
	router := deliveryhttp.SetupRouter(deliveryhttp.RouterConfig{
		GeofenceHandler:  geoHandler,
		VehicleHandler:   vehHandler,
		LocationHandler:  locHandler,
		AlertHandler:     alertHandler,
		ViolationHandler: violationHandler,
		WSHandler:        wsHandler,
	})

	// 7. Start HTTP Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("==================================================")
	log.Printf(" Geofencing & Real-Time Alert Backend (Engine LIVE)")
	log.Printf(" Server running on: http://localhost:%s", port)
	log.Printf(" Swagger UI:       http://localhost:%s/swagger", port)
	log.Printf(" WebSocket Feed:   ws://localhost:%s/ws/alerts", port)
	log.Printf("==================================================")

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}

// seedInitialData populates demo geofences, vehicles with GPS coordinates, and alerts
func seedInitialData(
	geoUC *usecase.GeofenceUseCase,
	vehUC *usecase.VehicleUseCase,
	trackingUC *usecase.TrackingUseCase,
	alertUC *usecase.AlertUseCase,
) {
	ctx := context.Background()

	// 1. Downtown Delivery Zone (Blue)
	downtown, _ := geoUC.CreateGeofence(ctx, domain.CreateGeofenceRequest{
		Name:        "Downtown Delivery Zone",
		Description: "Central commercial delivery zone for fleet operations",
		Category:    domain.CategoryDeliveryZone,
		Coordinates: [][2]float64{
			{37.7749, -122.4194},
			{37.7849, -122.4194},
			{37.7849, -122.4094},
			{37.7749, -122.4094},
			{37.7749, -122.4194},
		},
	})

	// 2. Waterfront Restricted Port (Red)
	restricted, _ := geoUC.CreateGeofence(ctx, domain.CreateGeofenceRequest{
		Name:        "Waterfront Restricted Port",
		Description: "Critical security waterfront dock - unauthorized entry strictly prohibited",
		Category:    domain.CategoryRestrictedZone,
		Coordinates: [][2]float64{
			{37.7900, -122.4050},
			{37.8000, -122.4050},
			{37.8000, -122.3950},
			{37.7900, -122.3950},
			{37.7900, -122.4050},
		},
	})

	// 3. Bay Bridge Toll Zone (Amber)
	toll, _ := geoUC.CreateGeofence(ctx, domain.CreateGeofenceRequest{
		Name:        "Bay Bridge Toll Zone",
		Description: "Automated toll charging entry zone",
		Category:    domain.CategoryTollZone,
		Coordinates: [][2]float64{
			{37.7800, -122.3950},
			{37.7880, -122.3950},
			{37.7880, -122.3800},
			{37.7800, -122.3800},
			{37.7800, -122.3950},
		},
	})

	// 4. Vehicles (Standard assessment fleet)
	v1, _ := vehUC.CreateVehicle(ctx, domain.CreateVehicleRequest{
		VehicleNumber: "KA-01-AB-1234",
		DriverName:    "John Doe",
		VehicleType:   "truck",
		Phone:         "+1234567890",
	})
	if v1 != nil {
		_, _ = trackingUC.UpdateLocation(ctx, domain.UpdateLocationRequest{
			VehicleID: v1.ID,
			Latitude:  37.7810,
			Longitude: -122.4140,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	}

	v2, _ := vehUC.CreateVehicle(ctx, domain.CreateVehicleRequest{
		VehicleNumber: "MH-02-XY-9876",
		DriverName:    "Sarah Jenkins",
		VehicleType:   "van",
		Phone:         "+1987654321",
	})
	if v2 != nil {
		_, _ = trackingUC.UpdateLocation(ctx, domain.UpdateLocationRequest{
			VehicleID: v2.ID,
			Latitude:  37.7720,
			Longitude: -122.4250,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	}

	v3, _ := vehUC.CreateVehicle(ctx, domain.CreateVehicleRequest{
		VehicleNumber: "DL-03-CD-4567",
		DriverName:    "Alex Smith",
		VehicleType:   "car",
		Phone:         "+1122334455",
	})
	if v3 != nil {
		_, _ = trackingUC.UpdateLocation(ctx, domain.UpdateLocationRequest{
			VehicleID: v3.ID,
			Latitude:  37.7890,
			Longitude: -122.3960,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	}

	v4, _ := vehUC.CreateVehicle(ctx, domain.CreateVehicleRequest{
		VehicleNumber: "KA-04-EF-7890",
		DriverName:    "Mara Okafor",
		VehicleType:   "truck",
		Phone:         "+15035550194",
	})
	if v4 != nil {
		_, _ = trackingUC.UpdateLocation(ctx, domain.UpdateLocationRequest{
			VehicleID: v4.ID,
			Latitude:  37.7760,
			Longitude: -122.3860,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	}

	// 5. Default Alert Rules
	if downtown != nil && v1 != nil {
		_, _ = alertUC.ConfigureAlert(ctx, domain.ConfigureAlertRequest{
			GeofenceID: downtown.ID,
			VehicleID:  &v1.ID,
			EventType:  domain.EventBoth,
		})
	}

	if restricted != nil {
		_, _ = alertUC.ConfigureAlert(ctx, domain.ConfigureAlertRequest{
			GeofenceID: restricted.ID,
			EventType:  domain.EventEntry,
		})
	}

	if toll != nil && v2 != nil {
		_, _ = alertUC.ConfigureAlert(ctx, domain.ConfigureAlertRequest{
			GeofenceID: toll.ID,
			VehicleID:  &v2.ID,
			EventType:  domain.EventEntry,
		})
	}

	fmt.Printf("[Bootstrap] Seeded 3 Geofences, 4 Vehicles, and Alert Rules successfully.\n")
}
