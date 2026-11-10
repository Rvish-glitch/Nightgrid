package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/usecase"
)

type ViolationHandler struct {
	useCase *usecase.ViolationUseCase
}

func NewViolationHandler(useCase *usecase.ViolationUseCase) *ViolationHandler {
	return &ViolationHandler{useCase: useCase}
}

// GET /violations/history - Retrieve historical geofence entry/exit events
func (h *ViolationHandler) GetViolationHistory(c *gin.Context) {
	vehicleID := c.Query("vehicle_id")
	geofenceID := c.Query("geofence_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil {
			limit = parsed
		}
	}

	violations, total, err := h.useCase.GetViolationHistory(c.Request.Context(), vehicleID, geofenceID, startDate, endDate, limit)
	if err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, domain.ViolationHistoryResponse{
		Violations: violations,
		TotalCount: total,
		TimeNS:     CalculateElapsedNS(c),
	})
}
