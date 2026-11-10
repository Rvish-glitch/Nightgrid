package geo

import (
	"fmt"
	"math"
)

// PointInPolygon determines if a point (lat, lng) is inside a closed polygon
// using the Ray-Casting (Even-Odd) algorithm.
// Note: coordinates are [latitude, longitude].
func PointInPolygon(point [2]float64, polygon [][2]float64) bool {
	if len(polygon) < 4 {
		return false
	}

	lat := point[0]
	lng := point[1]
	inside := false

	n := len(polygon)
	j := n - 1

	for i := 0; i < n; i++ {
		xi := polygon[i][1] // longitude
		yi := polygon[i][0] // latitude
		xj := polygon[j][1] // longitude
		yj := polygon[j][0] // latitude

		// Check if point is on horizontal vertex edge
		if yi == yj && yi == lat && ((xi <= lng && lng <= xj) || (xj <= lng && lng <= xi)) {
			return true
		}

		// Ray casting test: intersects ray cast horizontally towards positive longitude
		intersect := ((yi > lat) != (yj > lat)) &&
			(lng < (xj-xi)*(lat-yi)/(yj-yi)+xi)

		if intersect {
			inside = !inside
		}
		j = i
	}

	return inside
}

// ValidatePolygonCoordinates validates coordinates according to README rules:
// - Minimum 4 points (3 unique + 1 closing point)
// - First and last coordinates must be identical (closed polygon)
// - Latitude between -90 and 90
// - Longitude between -180 and 180
func ValidatePolygonCoordinates(coords [][2]float64) error {
	if len(coords) < 4 {
		return fmt.Errorf("coordinates must have at least 4 points (3 unique + 1 closing point)")
	}

	first := coords[0]
	last := coords[len(coords)-1]

	const epsilon = 1e-7
	if math.Abs(first[0]-last[0]) > epsilon || math.Abs(first[1]-last[1]) > epsilon {
		return fmt.Errorf("first and last coordinates must be identical (closed polygon)")
	}

	for i, pt := range coords {
		lat := pt[0]
		lng := pt[1]

		if lat < -90 || lat > 90 {
			return fmt.Errorf("point %d has invalid latitude %f (must be between -90 and 90)", i, lat)
		}
		if lng < -180 || lng > 180 {
			return fmt.Errorf("point %d has invalid longitude %f (must be between -180 and 180)", i, lng)
		}
	}

	return nil
}

