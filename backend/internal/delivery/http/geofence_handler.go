package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"geofencing-backend/internal/domain"
	"geofencing-backend/internal/usecase"
	"geofencing-backend/pkg/errors"
)

type GeofenceHandler struct {
	useCase *usecase.GeofenceUseCase
}

func NewGeofenceHandler(useCase *usecase.GeofenceUseCase) *GeofenceHandler {
	return &GeofenceHandler{useCase: useCase}
}

// POST /geofences - Create a new geofence with polygonal boundaries
func (h *GeofenceHandler) CreateGeofence(c *gin.Context) {
	var req domain.CreateGeofenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		HandleError(c, errors.NewValidationError(err.Error()))
		return
	}

	geofence, err := h.useCase.CreateGeofence(c.Request.Context(), req)
	if err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, domain.CreateGeofenceResponse{
		ID:     geofence.ID,
		Name:   geofence.Name,
		Status: "active",
		TimeNS: CalculateElapsedNS(c),
	})
}

// GET /geofences - Retrieve all geofences with optional category filtering
func (h *GeofenceHandler) ListGeofences(c *gin.Context) {
	category := c.Query("category")

	geofences, err := h.useCase.ListGeofences(c.Request.Context(), category)
	if err != nil {
		HandleError(c, err)
		return
	}

	c.JSON(http.StatusOK, domain.GeofencesListResponse{
		Geofences: geofences,
		TimeNS:    CalculateElapsedNS(c),
	})
}
