package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/usecase"
	"geofencing-backend/pkg/errors"
)

type LocationHandler struct {
	useCase *usecase.TrackingUseCase
}

func NewLocationHandler(useCase *usecase.TrackingUseCase) *LocationHandler {
	return &LocationHandler{useCase: useCase}
}

// POST /vehicles/location - Update vehicle location and trigger alerts
func (h *LocationHandler) UpdateLocation(c *gin.Context) {
	var req domain.UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.NewValidationError(err.Error()))
		return
	}

	geofences, err := h.useCase.UpdateLocation(c.Request.Context(), req)
	if err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, domain.UpdateLocationResponse{
		VehicleID:        req.VehicleID,
		LocationUpdated:  true,
		CurrentGeofences: geofences,
		TimeNS:           CalculateElapsedNS(c),
	})
}

// GET /vehicles/location/:vehicle_id - Get current location and geofence status
func (h *LocationHandler) GetVehicleLocation(c *gin.Context) {
	vehicleID := c.Param("vehicle_id")

	status, err := h.useCase.GetVehicleLocationStatus(c.Request.Context(), vehicleID)
	if err != nil {
		HandleError(c, err)
		return
	}

	status.TimeNS = CalculateElapsedNS(c)
	c.JSON(http.StatusOK, status)
}
