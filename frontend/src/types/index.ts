export type GeofenceCategory =
  | 'delivery_zone'
  | 'restricted_zone'
  | 'toll_zone'
  | 'customer_area';

export const categoryColors: Record<string, { fill: string; stroke: string; label: string }> = {
  restricted_zone: { fill: '#ef4444', stroke: '#dc2626', label: 'Restricted Radar' },
  delivery_zone: { fill: '#3b82f6', stroke: '#2563eb', label: 'Delivery Zone' },
  toll_zone: { fill: '#f59e0b', stroke: '#d97706', label: 'Toll Zone' },
  customer_area: { fill: '#10b981', stroke: '#059669', label: 'Customer Area' },
};

export type EventType = 'entry' | 'exit' | 'both';

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  coordinates: [number, number][]; // [lat, lng]
  category: GeofenceCategory;
  created_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  driver_name: string;
  vehicle_type: string;
  phone: string;
  status: string;
  created_at: string;
  last_latitude?: number;
  last_longitude?: number;
  last_updated_at?: string;
}

export interface CurrentGeofenceStatus {
  geofence_id: string;
  geofence_name: string;
  status?: string;
  category?: GeofenceCategory;
}

export interface VehicleLocationStatus {
  vehicle_id: string;
  vehicle_number?: string;
  current_location: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  current_geofences: CurrentGeofenceStatus[];
  time_ns: string;
}

export interface AlertRule {
  alert_id: string;
  geofence_id: string;
  geofence_name?: string;
  vehicle_id?: string;
  vehicle_number?: string;
  event_type: EventType;
  status: string;
  created_at: string;
}

export interface WebSocketAlertMessage {
  event_id: string;
  event_type: 'entry' | 'exit';
  timestamp: string;
  vehicle: {
    vehicle_id: string;
    vehicle_number: string;
    driver_name: string;
  };
  geofence: {
    geofence_id: string;
    geofence_name: string;
    category: GeofenceCategory;
  };
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface Violation {
  id: string;
  vehicle_id: string;
  vehicle_number: string;
  geofence_id: string;
  geofence_name: string;
  event_type: 'entry' | 'exit';
  latitude: number;
  longitude: number;
  timestamp: string;
}
