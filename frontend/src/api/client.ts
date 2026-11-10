import {
  Geofence,
  Vehicle,
  AlertRule,
  Violation,
  VehicleLocationStatus,
  GeofenceCategory,
  EventType,
} from '../types';

const API_BASE = ''; // Relies on Vite proxy to http://localhost:8080

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// 1. POST /geofences
export async function createGeofence(payload: {
  name: string;
  description?: string;
  coordinates: [number, number][];
  category: GeofenceCategory;
}): Promise<{ id: string; name: string; status: string; time_ns: string }> {
  return request('/geofences', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 2. GET /geofences
export async function getGeofences(category?: GeofenceCategory): Promise<{
  geofences: Geofence[];
  time_ns: string;
}> {
  const query = category ? `?category=${category}` : '';
  return request(`/geofences${query}`);
}

// 3. POST /vehicles
export async function createVehicle(payload: {
  vehicle_number: string;
  driver_name: string;
  vehicle_type: string;
  phone: string;
}): Promise<{ id: string; vehicle_number: string; status: string; time_ns: string }> {
  return request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 4. GET /vehicles
export async function getVehicles(): Promise<{
  vehicles: Vehicle[];
  time_ns: string;
}> {
  return request('/vehicles');
}

// 5. POST /vehicles/location
export async function updateVehicleLocation(payload: {
  vehicle_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}): Promise<{
  vehicle_id: string;
  location_updated: boolean;
  current_geofences: { geofence_id: string; geofence_name: string; status: string }[];
  time_ns: string;
}> {
  return request('/vehicles/location', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 6. GET /vehicles/location/{vehicle_id}
export async function getVehicleLocation(vehicleId: string): Promise<VehicleLocationStatus> {
  return request(`/vehicles/location/${vehicleId}`);
}

// 7. POST /alerts/configure
export async function configureAlert(payload: {
  geofence_id: string;
  vehicle_id?: string;
  event_type: EventType;
}): Promise<{
  alert_id: string;
  geofence_id: string;
  vehicle_id?: string;
  event_type: EventType;
  status: string;
  time_ns: string;
}> {
  return request('/alerts/configure', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 8. GET /alerts
export async function getAlerts(filters?: {
  geofence_id?: string;
  vehicle_id?: string;
}): Promise<{
  alerts: AlertRule[];
  time_ns: string;
}> {
  const params = new URLSearchParams();
  if (filters?.geofence_id) params.append('geofence_id', filters.geofence_id);
  if (filters?.vehicle_id) params.append('vehicle_id', filters.vehicle_id);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/alerts${qs}`);
}

// 9. GET /violations/history
export async function getViolationHistory(filters?: {
  vehicle_id?: string;
  geofence_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<{
  violations: Violation[];
  total_count: number;
  time_ns: string;
}> {
  const params = new URLSearchParams();
  if (filters?.vehicle_id) params.append('vehicle_id', filters.vehicle_id);
  if (filters?.geofence_id) params.append('geofence_id', filters.geofence_id);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.limit) params.append('limit', String(filters.limit));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/violations/history${qs}`);
}
