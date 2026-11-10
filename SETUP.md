# Setup & Execution Guide: Geofencing & Real-Time Alert System

This guide provides instructions to run, test, and deploy the Geofencing & Real-Time Alert System.

---

## 🚀 Quick Access

- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend Swagger UI**: [http://localhost:8080/swagger](http://localhost:8080/swagger)
- **OpenAPI 3.0 Spec**: [http://localhost:8080/swagger/openapi.json](http://localhost:8080/swagger/openapi.json)
- **WebSocket Endpoint**: `ws://localhost:8080/ws/alerts`

---

## 🛠️ Architecture Overview

The system is built using **Clean Architecture** principles:
- **Backend (Go 1.22+)**: Gin HTTP engine, Ray-Casting spatial point-in-polygon algorithm, concurrent WebSocket hub, and execution timing middleware (`time_ns`).
- **Frontend (React 18 + Vite + TypeScript)**: Interactive Leaflet map, geofence polygon drawing tools, vehicle fleet simulator, toast notifications, and live WebSocket alert feed.
- **Database / Docker**: PostgreSQL 16 with PostGIS extension for spatial index queries.

---

## 🐳 Running with Docker Compose

To launch the full production stack (PostGIS Database + Go Backend + React Frontend):

```bash
docker-compose up --build
```

To run in the background (detached mode):
```bash
docker-compose up -d
```

To stop all services:
```bash
docker-compose down
```

---

## 💻 Local Development Setup (Without Docker)

### 1. Backend Setup (Go)

```bash
cd backend

# Download dependencies
go mod download

# Build and run server
go run cmd/server/main.go
```
The server will start on port `8080`.

### 2. Frontend Setup (React + Vite)

```bash
cd frontend

# Install dependencies
bun install   # or pnpm install / npm install

# Start Vite dev server
bun run dev   # or pnpm dev / npm run dev
```
The dashboard will open on [http://localhost:3000](http://localhost:3000).

---

## 🧪 API Testing Guide (cURL Examples)

Every API response strictly contains the execution time in nanoseconds (`"time_ns"`).

### 1. Create a Geofence (`POST /geofences`)
```bash
curl -X POST http://localhost:8080/geofences \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Delivery Zone",
    "description": "Main delivery area for downtown customers",
    "coordinates": [
      [37.7749, -122.4194],
      [37.7849, -122.4194],
      [37.7849, -122.4094],
      [37.7749, -122.4094],
      [37.7749, -122.4194]
    ],
    "category": "delivery_zone"
  }'
```

### 2. Retrieve All Geofences (`GET /geofences`)
```bash
curl -X GET "http://localhost:8080/geofences?category=delivery_zone"
```

### 3. Register a Vehicle (`POST /vehicles`)
```bash
curl -X POST http://localhost:8080/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_number": "KA-01-AB-1234",
    "driver_name": "John Doe",
    "vehicle_type": "truck",
    "phone": "+1234567890"
  }'
```

### 4. Retrieve All Vehicles (`GET /vehicles`)
```bash
curl -X GET http://localhost:8080/vehicles
```

### 5. Update Location & Trigger Alerts (`POST /vehicles/location`)
*Triggers real-time alerts when vehicle enters restricted or configured zones:*
```bash
curl -X POST http://localhost:8080/vehicles/location \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "veh_16720bb7",
    "latitude": 37.7950,
    "longitude": -122.4000,
    "timestamp": "2026-11-10T19:30:00Z"
  }'
```

### 6. Get Current Vehicle Location (`GET /vehicles/location/{vehicle_id}`)
```bash
curl -X GET http://localhost:8080/vehicles/location/veh_16720bb7
```

### 7. Configure Alert Rule (`POST /alerts/configure`)
```bash
curl -X POST http://localhost:8080/alerts/configure \
  -H "Content-Type: application/json" \
  -d '{
    "geofence_id": "geo_66b6ab97",
    "vehicle_id": "veh_16720bb7",
    "event_type": "entry"
  }'
```

### 8. List Configured Alert Rules (`GET /alerts`)
```bash
curl -X GET http://localhost:8080/alerts
```

### 9. View Violation History (`GET /violations/history`)
```bash
curl -X GET "http://localhost:8080/violations/history?limit=50"
```

---

## 🖥️ Frontend Dashboard Features

1. **Interactive Map**: Displays categorized polygons with color-coded boundaries (Red for Restricted, Blue for Delivery, Amber for Toll).
2. **Polygon Drawer**: Click **"Draw Geofence"**, place vertices on the map, and save with category.
3. **Location Simulator**: Select any vehicle and click on the map to instantly simulate GPS movement and trigger live alerts.
4. **Real-Time WebSocket Feed**: Live incoming alerts with sound/toast notification without refreshing the page.
5. **Violation History Table**: Filter events by vehicle, geofence, and date ranges.

