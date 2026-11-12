import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Tooltip,
  useMapEvents,
} from 'react-leaflet';
import { Geofence, Vehicle, categoryColors } from '../../types';
import { ShieldAlert, Globe, Layers, Moon, Search, Navigation } from 'lucide-react';

export type MapMode = 'dark' | 'satellite' | 'streets';

interface MapViewProps {
  geofences: Geofence[];
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isDrawing: boolean;
  drawingPoints: [number, number][];
  onAddPoint: (point: [number, number]) => void;
}

// Haversine distance helper
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Compute centroid & circular radar radius
function getPolygonCenterAndRadius(coords: [number, number][]): { center: [number, number]; radius: number } {
  if (!coords || coords.length === 0) return { center: [37.7850, -122.4100], radius: 450 };

  let sumLat = 0;
  let sumLng = 0;
  const n = coords.length > 1 && coords[0][0] === coords[coords.length - 1][0] ? coords.length - 1 : coords.length;

  for (let i = 0; i < n; i++) {
    sumLat += coords[i][0];
    sumLng += coords[i][1];
  }

  const center: [number, number] = [sumLat / n, sumLng / n];

  let maxDist = 0;
  for (let i = 0; i < n; i++) {
    const d = getDistanceInMeters(center[0], center[1], coords[i][0], coords[i][1]);
    if (d > maxDist) maxDist = d;
  }

  return { center, radius: Math.max(Math.round(maxDist), 380) };
}

function MapEvents({
  isDrawing,
  onAddPoint,
  onMapClick,
}: {
  isDrawing: boolean;
  onAddPoint: (pt: [number, number]) => void;
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      if (isDrawing) {
        onAddPoint([lat, lng]);
      } else if (onMapClick) {
        onMapClick(lat, lng);
      }
    },
  });
  return null;
}

// Tile Providers
const mapTiles: Record<MapMode, { url: string; attribution: string; maxZoom: number }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18,
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};

export const MapView: React.FC<MapViewProps> = ({
  geofences,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onMapClick,
  isDrawing,
  drawingPoints,
  onAddPoint,
}) => {
  const [mapMode, setMapMode] = useState<MapMode>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const defaultCenter: [number, number] = [37.7830, -122.4110];

  // Filter vehicles by search query
  const filteredVehicles = vehicles.filter((v) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = v.vehicle_number.toLowerCase().includes(q);
      const matchDriver = v.driver_name.toLowerCase().includes(q);
      if (!matchNum && !matchDriver) return false;
    }
    return true;
  });

  // Filter geofences by category chip
  const filteredGeofences = geofences.filter((g) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'RESTRICTED') return g.category === 'restricted_zone';
    if (categoryFilter === 'DELIVERY') return g.category === 'delivery_zone';
    if (categoryFilter === 'TOLL') return g.category === 'toll_zone';
    return true;
  });

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-[#060a12]">
      {/* Tactical Grid Overlay across Map (Active in DARK mode) */}
      {mapMode === 'dark' && (
        <div className="absolute inset-0 z-[400] tactical-grid-overlay pointer-events-none" />
      )}

      {/* Top Left Floating Search & Filter Bar */}
      <div className="absolute top-5 left-5 z-[1000] w-72 space-y-2 pointer-events-auto select-none">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            id="geofence-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicle or driver..."
            className="w-full bg-[#080d19]/90 backdrop-blur-xl border border-slate-700/80 rounded-md py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-2xl font-mono"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1 bg-[#080d19]/80 p-1 rounded-md border border-slate-800/80 backdrop-blur-md text-[10px] font-mono">
          {(['ALL', 'RESTRICTED', 'DELIVERY', 'TOLL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-0.5 rounded transition uppercase font-semibold ${
                categoryFilter === cat
                  ? 'bg-slate-700/90 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Top Right Map Mode Switcher (GRID, SATELLITE, ROADS) */}
      <div className="absolute top-5 right-[340px] z-[1000] bg-[#080d19]/95 backdrop-blur-xl p-1 rounded-lg border border-slate-800 shadow-2xl flex items-center gap-1 select-none pointer-events-auto">
        <button
          onClick={() => setMapMode('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
            mapMode === 'dark'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Tactical Dark Grid Mode"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>GRID</span>
        </button>

        <button
          onClick={() => setMapMode('satellite')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
            mapMode === 'satellite'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Satellite Imagery"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>SATELLITE</span>
        </button>

        <button
          onClick={() => setMapMode('streets')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
            mapMode === 'streets'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Roads & Streets"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ROADS</span>
        </button>
      </div>

      {/* Bottom Left Real Status Summary Cards (Accurate dynamic data) */}
      <div className="absolute bottom-5 left-5 z-[1000] flex items-center gap-2 pointer-events-auto select-none">
        <div className="bg-[#090f1e]/90 backdrop-blur-xl px-3.5 py-2 rounded-lg border border-slate-800/90 shadow-2xl min-w-[75px]">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-semibold">VEHICLES</div>
          <div className="text-lg font-bold font-mono text-cyan-400 leading-tight mt-0.5">{vehicles.length}</div>
        </div>
        <div className="bg-[#090f1e]/90 backdrop-blur-xl px-3.5 py-2 rounded-lg border border-slate-800/90 shadow-2xl min-w-[75px]">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-semibold">GEOFENCES</div>
          <div className="text-lg font-bold font-mono text-emerald-400 leading-tight mt-0.5">{geofences.length}</div>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          key={mapMode}
          attribution={mapTiles[mapMode].attribution}
          url={mapTiles[mapMode].url}
          maxZoom={mapTiles[mapMode].maxZoom}
        />

        <MapEvents
          isDrawing={isDrawing}
          onAddPoint={onAddPoint}
          onMapClick={onMapClick}
        />

        {/* Circular Radar Geofence Boundaries */}
        {filteredGeofences.map((geo) => {
          const color = categoryColors[geo.category] || categoryColors.delivery_zone;
          const { center, radius } = getPolygonCenterAndRadius(geo.coordinates);
          const isRestricted = geo.category === 'restricted_zone';
          const isToll = geo.category === 'toll_zone';

          const handleClick = (e: any) => {
            const lat = parseFloat(e.latlng.lat.toFixed(6));
            const lng = parseFloat(e.latlng.lng.toFixed(6));
            if (isDrawing) {
              onAddPoint([lat, lng]);
            } else if (onMapClick) {
              onMapClick(lat, lng);
            }
          };

          return (
            <React.Fragment key={geo.id}>
              {/* Outer Radar Boundary Circle */}
              <Circle
                center={center}
                radius={radius}
                pathOptions={{
                  color: isRestricted ? '#f43f5e' : isToll ? '#f59e0b' : color.stroke,
                  fillColor: isRestricted ? '#f43f5e' : isToll ? '#f59e0b' : color.fill,
                  fillOpacity: isRestricted ? 0.32 : 0.16,
                  dashArray: '5, 8',
                  weight: isRestricted ? 2.5 : 1.5,
                  className: isRestricted ? 'radar-circle' : isToll ? 'toll-radar' : 'delivery-radar',
                }}
                eventHandlers={{ click: handleClick }}
              >
                <Tooltip sticky direction="top">
                  <div className="p-1.5 text-slate-100 text-xs font-mono bg-[#070c18]/95 border border-slate-700 rounded shadow-xl">
                    <div className="font-bold flex items-center gap-1.5">
                      {isRestricted && <ShieldAlert className="w-3.5 h-3.5 text-rose-500 inline" />}
                      <span className={isRestricted ? 'text-rose-300' : 'text-cyan-300'}>{geo.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                      {geo.category.replace('_', ' ')} · Radius {radius}m
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                      Click inside to deploy selected vehicle
                    </div>
                  </div>
                </Tooltip>
              </Circle>

              {/* Concentric Inner Range Ring (66% radius) */}
              <Circle
                center={center}
                radius={Math.round(radius * 0.66)}
                pathOptions={{
                  color: isRestricted ? '#f43f5e' : color.stroke,
                  fillOpacity: 0.04,
                  dashArray: '3, 6',
                  weight: 1,
                }}
                eventHandlers={{ click: handleClick }}
              />

              {/* Concentric Inner Range Ring (33% radius) */}
              <Circle
                center={center}
                radius={Math.round(radius * 0.33)}
                pathOptions={{
                  color: isRestricted ? '#f43f5e' : color.stroke,
                  fillOpacity: 0.06,
                  dashArray: '2, 4',
                  weight: 1,
                }}
                eventHandlers={{ click: handleClick }}
              />

              {/* Center Radar Beacon with Zone Tag */}
              <CircleMarker
                center={center}
                radius={4}
                pathOptions={{
                  fillColor: isRestricted ? '#f43f5e' : color.stroke,
                  color: '#ffffff',
                  fillOpacity: 1,
                  weight: 1.5,
                }}
                eventHandlers={{ click: handleClick }}
              >
                <Tooltip permanent direction="bottom" offset={[0, 4]}>
                  <div className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded shadow-lg border uppercase ${
                    isRestricted
                      ? 'bg-rose-950/90 text-rose-300 border-rose-800'
                      : 'bg-[#070c18]/90 text-slate-300 border-slate-700'
                  }`}>
                    {geo.name}
                  </div>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Real Vehicle Fleet Markers on Map */}
        {filteredVehicles
          .filter((v) => v.last_latitude != null && v.last_longitude != null)
          .map((v) => {
            const isSelected = selectedVehicle?.id === v.id;

            return (
              <React.Fragment key={v.id}>
                {/* Glow ring for selected vehicle */}
                {isSelected && (
                  <CircleMarker
                    center={[v.last_latitude!, v.last_longitude!]}
                    radius={16}
                    pathOptions={{
                      color: '#06b6d4',
                      fillOpacity: 0.18,
                      fillColor: '#06b6d4',
                      weight: 1.5,
                      dashArray: '3, 4',
                    }}
                  />
                )}

                {/* Tactical Dot Marker */}
                <CircleMarker
                  center={[v.last_latitude!, v.last_longitude!]}
                  radius={isSelected ? 6 : 5}
                  pathOptions={{
                    fillColor: isSelected ? '#22d3ee' : '#e2e8f0',
                    color: isSelected ? '#0891b2' : '#475569',
                    fillOpacity: 1,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => onSelectVehicle(v),
                  }}
                >
                  {/* Tactical callout box showing Vehicle Number */}
                  <Tooltip permanent direction="bottom" offset={[0, 4]}>
                    <div
                      onClick={() => onSelectVehicle(v)}
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-2xl border cursor-pointer transition select-none flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#042f2e]/95 text-cyan-300 border-cyan-500 ring-1 ring-cyan-400'
                          : 'bg-[#070c18]/90 text-slate-300 border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      {isSelected && <Navigation className="w-2.5 h-2.5 text-cyan-400 transform rotate-45 inline" />}
                      <span>{v.vehicle_number}</span>
                    </div>
                  </Tooltip>
                </CircleMarker>
              </React.Fragment>
            );
          })}
      </MapContainer>
    </div>
  );
};
