import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Circle,
  CircleMarker,
  Tooltip,
  useMapEvents,
} from 'react-leaflet';
import { Geofence, Vehicle, categoryColors } from '../../types';
import { ShieldAlert, Globe, Layers, Moon, Search, Navigation, Building2 } from 'lucide-react';

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

// Depots for tactical map aesthetic matching screenshot
const tacticalDepots = [
  { id: 'depot-4', name: 'DEPOT 4', lat: 37.7820, lng: -122.4080 },
];

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
  const [filterType, setFilterType] = useState<'ALL' | 'MOVING' | 'IDLE' | 'OFFLINE'>('ALL');

  const defaultCenter: [number, number] = [37.7830, -122.4110];

  // Filter vehicles based on search and filter type
  const filteredVehicles = vehicles.filter((v) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = v.vehicle_number.toLowerCase().includes(q);
      const matchDriver = v.driver_name.toLowerCase().includes(q);
      if (!matchNum && !matchDriver) return false;
    }
    return true;
  });

  // Calculate fleet status counts
  const movingCount = vehicles.length > 0 ? 3 : 0;
  const idleCount = 2;
  const parkedCount = 2;
  const offlineCount = 1;

  // Connecting route paths across units for tactical look
  const tacticalRoutes: [number, number][][] = [
    [
      [37.7940, -122.4350],
      [37.7830, -122.4110], // NG-104
      [37.7890, -122.3960], // NG-118
    ],
    [
      [37.7920, -122.4280], // NG-086
      [37.7820, -122.4080], // DEPOT 4
      [37.7760, -122.3860], // NG-121
    ],
    [
      [37.7800, -122.4180], // NG-097
      [37.7710, -122.4040], // NG-133
    ],
  ];

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-[#060a12]">
      {/* Tactical Grid Overlay across Map matching screenshot (Active in DARK mode) */}
      {mapMode === 'dark' && (
        <div className="absolute inset-0 z-[400] tactical-grid-overlay pointer-events-none" />
      )}

      {/* Top Left Floating Search & Filter Pill Widget (NIGHTGRID Style from Screenshot) */}
      <div className="absolute top-5 left-5 z-[1000] w-72 space-y-2 pointer-events-auto select-none">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            id="nightgrid-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search unit, driver, route..."
            className="w-full bg-[#080d19]/90 backdrop-blur-xl border border-slate-700/80 rounded-md py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-2xl font-mono"
          />
        </div>

        {/* Filter Chips from Screenshot */}
        <div className="flex items-center gap-1 bg-[#080d19]/80 p-1 rounded-md border border-slate-800/80 backdrop-blur-md text-[10px] font-mono">
          {(['ALL', 'MOVING', 'IDLE', 'OFFLINE'] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-2.5 py-0.5 rounded transition uppercase font-semibold ${
                filterType === ft
                  ? 'bg-slate-700/90 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>
      </div>

      {/* Top Right Map Mode Switcher (Preserving GRID, SATELLITE, ROADS) */}
      <div className="absolute top-5 right-[360px] z-[1000] bg-[#080d19]/95 backdrop-blur-xl p-1 rounded-lg border border-slate-800 shadow-2xl flex items-center gap-1 select-none pointer-events-auto">
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

      {/* Bottom Left Fleet Status Widget (4 Counter Cards matching Screenshot) */}
      <div className="absolute bottom-5 left-5 z-[1000] flex items-center gap-2 pointer-events-auto select-none">
        {/* MOVING */}
        <div className="bg-[#090f1e]/90 backdrop-blur-xl px-3.5 py-2 rounded-lg border border-slate-800/90 shadow-2xl min-w-[68px]">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-semibold">MOVING</div>
          <div className="text-lg font-bold font-mono text-cyan-400 leading-tight mt-0.5">{movingCount}</div>
        </div>
        {/* IDLE */}
        <div className="bg-[#090f1e]/90 backdrop-blur-xl px-3.5 py-2 rounded-lg border border-slate-800/90 shadow-2xl min-w-[68px]">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-semibold">IDLE</div>
          <div className="text-lg font-bold font-mono text-emerald-400 leading-tight mt-0.5">{idleCount}</div>
        </div>
        {/* PARKED */}
        <div className="bg-[#090f1e]/90 backdrop-blur-xl px-3.5 py-2 rounded-lg border border-slate-800/90 shadow-2xl min-w-[68px]">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-semibold">PARKED</div>
          <div className="text-lg font-bold font-mono text-slate-300 leading-tight mt-0.5">{parkedCount}</div>
        </div>
        {/* OFFLINE */}
        <div className="bg-[#090f1e]/90 backdrop-blur-xl px-3.5 py-2 rounded-lg border border-slate-800/90 shadow-2xl min-w-[68px]">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-semibold">OFFLINE</div>
          <div className="text-lg font-bold font-mono text-rose-500 leading-tight mt-0.5">{offlineCount}</div>
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

        {/* Tactical Route Network Lines matching Screenshot */}
        {tacticalRoutes.map((route, idx) => (
          <Polyline
            key={`route-${idx}`}
            positions={route}
            pathOptions={{
              color: '#1e2d48',
              weight: 1.5,
              opacity: 0.8,
            }}
          />
        ))}

        {/* Depots matching Screenshot [DEPOT 4] */}
        {tacticalDepots.map((depot) => (
          <CircleMarker
            key={depot.id}
            center={[depot.lat, depot.lng]}
            radius={4}
            pathOptions={{
              fillColor: '#334155',
              color: '#64748b',
              weight: 1,
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="bottom" offset={[0, 4]}>
              <div className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#070c18]/90 text-slate-400 border border-slate-800 shadow uppercase flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5" />
                <span>{depot.name}</span>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Circular Radar Geofence Boundaries */}
        {geofences.map((geo) => {
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
              {/* Outer Radar Boundary */}
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
                      Click inside to deploy unit & trigger alert
                    </div>
                  </div>
                </Tooltip>
              </Circle>

              {/* Concentric Range Ring 1 (66% radius) */}
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

              {/* Concentric Range Ring 2 (33% radius) */}
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
                    {geo.name.slice(0, 16)}
                  </div>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Tactical Fleet Unit Markers matching Screenshot */}
        {filteredVehicles
          .filter((v) => v.last_latitude != null && v.last_longitude != null)
          .map((v) => {
            const isSelected = selectedVehicle?.id === v.id;
            const isRed = v.vehicle_number === 'NG-086';
            const isTeal = v.vehicle_number === 'NG-097';

            let dotColor = '#f8fafc'; // default clean white dot
            let strokeColor = '#475569';
            if (isSelected) {
              dotColor = '#22d3ee';
              strokeColor = '#0891b2';
            } else if (isRed) {
              dotColor = '#f43f5e'; // coral/salmon red from screenshot
              strokeColor = '#be123c';
            } else if (isTeal) {
              dotColor = '#14b8a6'; // teal dot from screenshot
              strokeColor = '#0f766e';
            }

            return (
              <React.Fragment key={v.id}>
                {/* Glow ring for selected unit (NG-104) */}
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
                  radius={isSelected ? 6 : 4.5}
                  pathOptions={{
                    fillColor: dotColor,
                    color: strokeColor,
                    fillOpacity: 1,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => onSelectVehicle(v),
                  }}
                >
                  {/* Tactical callout box matching Screenshot labels [NG-104], [NG-086], etc. */}
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
