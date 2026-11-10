package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
)

// TimingMiddleware attaches the start timestamp to context to measure request execution time in nanoseconds
func TimingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("start_time", time.Now())
		c.Next()
	}
}

