package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/usecase"
	"geofencing-backend/pkg/errors"
)

type VehicleHandler struct {
	useCase *usecase.VehicleUseCase
}

func NewVehicleHandler(useCase *usecase.VehicleUseCase) *VehicleHandler {
	return &VehicleHandler{useCase: useCase}
}

// POST /vehicles - Register a new vehicle
func (h *VehicleHandler) CreateVehicle(c *gin.Context) {
	var req domain.CreateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.NewValidationError(err.Error()))
		return
	}

	vehicle, err := h.useCase.CreateVehicle(c.Request.Context(), req)
	if err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, domain.CreateVehicleResponse{
		ID:            vehicle.ID,
		VehicleNumber: vehicle.VehicleNumber,
		Status:        vehicle.Status,
		TimeNS:        CalculateElapsedNS(c),
	})
}

// GET /vehicles - Retrieve all registered vehicles
func (h *VehicleHandler) ListVehicles(c *gin.Context) {
	vehicles, err := h.useCase.ListVehicles(c.Request.Context())
	if err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, domain.VehiclesListResponse{
		Vehicles: vehicles,
		TimeNS:   CalculateElapsedNS(c),
	})
}

// PATCH /vehicles/:id/status - Update vehicle status (active or inactive)
func (h *VehicleHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		HandleError(c, errors.NewValidationError("vehicle id is required"))
		return
	}

	var req domain.UpdateVehicleStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.NewValidationError(err.Error()))
		return
	}

	if err := h.useCase.UpdateStatus(c.Request.Context(), id, req.Status); err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":      id,
		"status":  req.Status,
		"message": "vehicle status updated successfully",
		"time_ns": CalculateElapsedNS(c),
	})
}

// DELETE /vehicles/:id - Remove a vehicle from fleet
func (h *VehicleHandler) DeleteVehicle(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		HandleError(c, errors.NewValidationError("vehicle id is required"))
		return
	}

	if err := h.useCase.DeleteVehicle(c.Request.Context(), id); err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":      id,
		"message": "vehicle deleted successfully",
		"time_ns": CalculateElapsedNS(c),
	})
}
