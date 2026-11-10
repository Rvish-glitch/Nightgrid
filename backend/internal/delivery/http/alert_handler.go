package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/usecase"
	"geofencing-backend/pkg/errors"
)

type AlertHandler struct {
	useCase *usecase.AlertUseCase
}

func NewAlertHandler(useCase *usecase.AlertUseCase) *AlertHandler {
	return &AlertHandler{useCase: useCase}
}

// POST /alerts/configure - Configure alert rules for geofence events
func (h *AlertHandler) ConfigureAlert(c *gin.Context) {
	var req domain.ConfigureAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.NewValidationError(err.Error()))
		return
	}

	rule, err := h.useCase.ConfigureAlert(c.Request.Context(), req)
	if err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, domain.ConfigureAlertResponse{
		AlertID:    rule.AlertID,
		GeofenceID: rule.GeofenceID,
		VehicleID:  rule.VehicleID,
		EventType:  rule.EventType,
		Status:     rule.Status,
		TimeNS:     CalculateElapsedNS(c),
	})
}

// GET /alerts - Retrieve all configured alert rules
func (h *AlertHandler) ListAlerts(c *gin.Context) {
	geofenceID := c.Query("geofence_id")
	vehicleID := c.Query("vehicle_id")

	alerts, err := h.useCase.ListAlerts(c.Request.Context(), geofenceID, vehicleID)
	if err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, domain.AlertsListResponse{
		Alerts: alerts,
		TimeNS: CalculateElapsedNS(c),
	})
}
