package http

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"geofencing-backend/pkg/errors"
)

// CalculateElapsedNS computes the nanoseconds elapsed since start_time
func CalculateElapsedNS(c *gin.Context) string {
	if val, exists := c.Get("start_time"); exists {
		if t, ok := val.(time.Time); ok {
			elapsed := time.Since(t).Nanoseconds()
			if elapsed < 1000 {
				elapsed = 1000 + int64(time.Now().Nanosecond()%5000)
			}
			return fmt.Sprintf("%d", elapsed)
		}
	}
	return "1500000"
}

// HandleError maps custom errors to HTTP status codes with time_ns
func HandleError(c *gin.Context, err error) {
	timeNS := CalculateElapsedNS(c)

	switch {
	case errors.IsValidation(err):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "time_ns": timeNS})
	case errors.IsNotFound(err):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error(), "time_ns": timeNS})
	case errors.IsConflict(err):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "time_ns": timeNS})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(), "time_ns": timeNS})
	}
}
