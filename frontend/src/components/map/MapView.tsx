import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Polyline,
  Tooltip,
  Marker,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { Geofence, Vehicle, categoryColors } from '../../types';
import {
  ShieldAlert,
  Globe,
  Layers,
  Search,
  PenTool,
  Check,
  RotateCcw,
  Undo2,
  X,
  MapPin,
} from 'lucide-react';

export type MapMode = 'streets' | 'satellite';

interface MapViewProps {
  geofences: Geofence[];
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isDrawing: boolean;
  drawingPoints: [number, number][];
  onAddPoint: (point: [number, number]) => void;
  onUndoPoint?: () => void;
  onClearDrawing?: () => void;
  onFinishDrawing?: () => void;
  onCancelDrawing?: () => void;
  isPlacingVehicle?: boolean;
  onCancelPlacingVehicle?: () => void;
  pendingVehiclePosition?: [number, number] | null;
}

// Compute centroid of polygon for label placement
function getPolygonCentroid(coords: [number, number][]): [number, number] {
  if (!coords || coords.length === 0) return [37.7850, -122.4100];

  let sumLat = 0;
  let sumLng = 0;
  const n = coords.length > 1 && coords[0][0] === coords[coords.length - 1][0] ? coords.length - 1 : coords.length;

  for (let i = 0; i < n; i++) {
    sumLat += coords[i][0];
    sumLng += coords[i][1];
  }

  return [sumLat / n, sumLng / n];
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

// Tile Providers (Roads/Streets view and High-res Satellite view)
const mapTiles: Record<MapMode, { url: string; attribution: string; maxZoom: number }> = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18,
  },
};

// Helper to construct Leaflet custom vehicle icon
const vehicleIconCache = new Map<string, L.Icon>();

function getVehicleIcon(vehicleType: string, isSelected: boolean): L.Icon {
  const normType = (vehicleType || 'truck').toLowerCase();
  const validTypes = ['truck', 'van', 'bus', 'car', 'motorcycle'];
  const typeKey = validTypes.includes(normType) ? normType : 'truck';
  const cacheKey = `${typeKey}_${isSelected ? 'sel' : 'norm'}`;

  if (vehicleIconCache.has(cacheKey)) {
    return vehicleIconCache.get(cacheKey)!;
  }

  const iconUrl = isSelected ? `/vehicles/${typeKey}_selected.png` : `/vehicles/${typeKey}.png`;
  const iconSize: [number, number] = isSelected ? [36, 36] : [30, 30];
  const iconAnchor: [number, number] = isSelected ? [18, 18] : [15, 15];

  const icon = L.icon({
    iconUrl,
    iconSize,
    iconAnchor,
    popupAnchor: [0, -16],
    className: isSelected ? 'vehicle-icon-selected' : 'vehicle-icon-normal',
  });

  vehicleIconCache.set(cacheKey, icon);
  return icon;
}

export const MapView: React.FC<MapViewProps> = ({
  geofences,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onMapClick,
  isDrawing,
  drawingPoints,
  onAddPoint,
  onUndoPoint,
  onClearDrawing,
  onFinishDrawing,
  onCancelDrawing,
  isPlacingVehicle = false,
  onCancelPlacingVehicle,
  pendingVehiclePosition = null,
}) => {
  const [mapMode, setMapMode] = useState<MapMode>('streets');
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
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-[#0a0f1d]">
      {/* Compact Docked Drawing Mode Toolbar (Sleek Glassmorphic, No Heavy Yellow Box) */}
      {isDrawing && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[1500] bg-[#070d19]/95 backdrop-blur-xl border border-amber-500/40 rounded-lg px-3.5 py-1.5 shadow-2xl flex items-center gap-3 text-white font-mono select-none animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <PenTool className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-300 tracking-wide">
              DRAWING ({drawingPoints.length} PTS)
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-800"></div>

          <div className="flex items-center gap-1.5">
            {/* Undo Last Point Button */}
            <button
              onClick={onUndoPoint}
              disabled={drawingPoints.length === 0}
              className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[10.5px] rounded flex items-center gap-1 transition"
              title="Remove last placed point"
            >
              <Undo2 className="w-3 h-3 text-amber-400" />
              <span>Undo</span>
            </button>

            {/* Clear All Points */}
            {drawingPoints.length > 0 && (
              <button
                onClick={onClearDrawing}
                className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10.5px] rounded flex items-center gap-1 transition"
                title="Reset points"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Clear</span>
              </button>
            )}

            {/* Finish & Save (Requires >= 3 points) */}
            {drawingPoints.length >= 3 ? (
              <button
                onClick={onFinishDrawing}
                className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold rounded flex items-center gap-1 shadow transition"
              >
                <Check className="w-3 h-3" />
                <span>Finish</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-500 italic">
                (Need {3 - drawingPoints.length} more)
              </span>
            )}

            {/* Cancel Drawing */}
            <button
              onClick={onCancelDrawing}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition ml-1"
              title="Cancel drawing"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Compact Vehicle Placement Dock (When Placing New Vehicle) */}
      {isPlacingVehicle && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[1500] bg-[#070d19]/95 backdrop-blur-xl border border-cyan-500/50 rounded-lg px-3.5 py-1.5 shadow-2xl flex items-center gap-3 text-white font-mono select-none animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold text-cyan-300">
              CLICK ON MAP TO SELECT VEHICLE STARTING POINT
            </span>
          </div>

          {onCancelPlacingVehicle && (
            <button
              onClick={onCancelPlacingVehicle}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10.5px] rounded transition flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      )}

      {/* Top Left Floating Search & Filter Bar */}
      <div className="absolute top-3 left-3 z-[1000] w-64 space-y-1.5 pointer-events-auto select-none">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            id="geofence-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter vehicle or driver..."
            className="w-full bg-[#080d19]/90 backdrop-blur-xl border border-slate-700/80 rounded-md py-1.5 pl-8 pr-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-2xl font-mono"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1 bg-[#080d19]/80 p-1 rounded-md border border-slate-800/80 backdrop-blur-md text-[9.5px] font-mono">
          {(['ALL', 'RESTRICTED', 'DELIVERY', 'TOLL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-1.5 py-0.5 rounded transition uppercase font-semibold ${
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

      {/* Top Right Map Mode Switcher (ROADS and SATELLITE only) */}
      <div className="absolute top-3 right-[300px] z-[1000] bg-[#080d19]/95 backdrop-blur-xl p-1 rounded-lg border border-slate-800 shadow-2xl flex items-center gap-1 select-none pointer-events-auto">
        <button
          onClick={() => setMapMode('streets')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition ${
            mapMode === 'streets'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Roads & Streets View"
        >
          <Layers className="w-3 h-3" />
          <span>ROADS</span>
        </button>

        <button
          onClick={() => setMapMode('satellite')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition ${
            mapMode === 'satellite'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Satellite Imagery"
        >
          <Globe className="w-3 h-3" />
          <span>SATELLITE</span>
        </button>
      </div>

      {/* Bottom Left Unified Status HUD (Combined into single sleek card) */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#070d19]/90 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-slate-800/90 shadow-2xl flex items-center gap-3 font-mono text-xs select-none pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="text-[9.5px] text-slate-400 font-semibold uppercase">Vehicles</span>
          <span className="text-white font-bold text-xs ml-0.5">{vehicles.length}</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-[9.5px] text-slate-400 font-semibold uppercase">Geofences</span>
          <span className="text-white font-bold text-xs ml-0.5">{geofences.length}</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className={`w-full h-full ${isDrawing || isPlacingVehicle ? 'drawing-active' : ''}`}
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

        {/* Temporary Starting Location Pin when Placing Vehicle */}
        {pendingVehiclePosition && (
          <CircleMarker
            center={pendingVehiclePosition}
            radius={8}
            pathOptions={{
              fillColor: '#06b6d4',
              color: '#ffffff',
              weight: 3,
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -6]}>
              <div className="bg-cyan-900 border border-cyan-400 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                Selected Starting Point
              </div>
            </Tooltip>
          </CircleMarker>
        )}

        {/* ============================================================ */}
        {/* INTERACTIVE DRAWING OVERLAYS (Points, Polyline, & Polygon)   */}
        {/* ============================================================ */}
        {drawingPoints.length > 0 && (
          <>
            {/* Draw connecting lines between consecutive points */}
            {drawingPoints.length >= 2 && (
              <Polyline
                positions={drawingPoints}
                pathOptions={{
                  color: '#f59e0b',
                  weight: 2.5,
                  dashArray: '5, 5',
                  opacity: 0.95,
                }}
              />
            )}

            {/* When 3 or more points exist, show the filled polygon shape preview */}
            {drawingPoints.length >= 3 && (
              <Polygon
                positions={drawingPoints}
                pathOptions={{
                  color: '#f59e0b',
                  fillColor: '#f59e0b',
                  fillOpacity: 0.25,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
            )}

            {/* Subtle tactical nodes for drawing vertices (no noisy repetitive labels) */}
            {drawingPoints.map((pt, idx) => {
              const isStart = idx === 0;
              return (
                <CircleMarker
                  key={`drawing-pt-${idx}`}
                  center={pt}
                  radius={isStart ? 6 : 4.5}
                  pathOptions={{
                    fillColor: isStart ? '#10b981' : '#f59e0b',
                    color: '#ffffff',
                    weight: 2,
                    fillOpacity: 1,
                  }}
                  eventHandlers={{
                    click: () => {
                      if (isStart && drawingPoints.length >= 3 && onFinishDrawing) {
                        onFinishDrawing();
                      }
                    },
                  }}
                >
                  {/* Tooltip on hover only for points to keep map clean; start point shows closure hint */}
                  <Tooltip direction="top" offset={[0, -4]}>
                    <div className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#070c18]/95 border border-slate-700 text-slate-200">
                      {isStart ? 'Start Point (Click to Close)' : `Point #${idx + 1}`}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </>
        )}

        {/* ============================================================ */}
        {/* EXACT POLYGON GEOFENCE BOUNDARIES (True drawn shape)        */}
        {/* ============================================================ */}
        {filteredGeofences.map((geo) => {
          const color = categoryColors[geo.category] || categoryColors.delivery_zone;
          const centroid = getPolygonCentroid(geo.coordinates);
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

          const strokeColor = isRestricted ? '#f43f5e' : isToll ? '#f59e0b' : color.stroke;
          const fillColor = isRestricted ? '#f43f5e' : isToll ? '#f59e0b' : color.fill;

          return (
            <React.Fragment key={geo.id}>
              {/* True Polygon Shape as Drawn by User */}
              <Polygon
                positions={geo.coordinates}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: isRestricted ? 0.35 : 0.22,
                  weight: isRestricted ? 2.5 : 2,
                  dashArray: isRestricted ? '6, 6' : undefined,
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
                      {geo.category.replace('_', ' ')} · Polygon ({geo.coordinates.length > 1 ? geo.coordinates.length - 1 : geo.coordinates.length} vertices)
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                      Click inside to deploy selected vehicle
                    </div>
                  </div>
                </Tooltip>
              </Polygon>

              {/* Centroid Tag Marker showing Zone Name */}
              <CircleMarker
                center={centroid}
                radius={3}
                pathOptions={{
                  fillColor: strokeColor,
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

        {/* ============================================================ */}
        {/* VEHICLE FLEET WITH PNG ICONS & HOVER-ONLY CALLOUTS           */}
        {/* ============================================================ */}
        {filteredVehicles
          .filter((v) => v.last_latitude != null && v.last_longitude != null)
          .map((v) => {
            const isSelected = selectedVehicle?.id === v.id;
            const icon = getVehicleIcon(v.vehicle_type, isSelected);

            return (
              <React.Fragment key={v.id}>
                {/* Glowing radar ring around the selected vehicle only */}
                {isSelected && (
                  <CircleMarker
                    center={[v.last_latitude!, v.last_longitude!]}
                    radius={22}
                    pathOptions={{
                      color: '#06b6d4',
                      fillOpacity: 0.15,
                      fillColor: '#06b6d4',
                      weight: 1.5,
                      dashArray: '3, 4',
                    }}
                  />
                )}

                {/* Vehicle Marker with dedicated PNG Icon */}
                <Marker
                  position={[v.last_latitude!, v.last_longitude!]}
                  icon={icon}
                  eventHandlers={{
                    click: () => onSelectVehicle(v),
                  }}
                >
                  {/* Tooltip: Permanent callout ONLY for selected vehicle; hover-only for unselected vehicles */}
                  <Tooltip
                    permanent={isSelected}
                    direction="top"
                    offset={[0, isSelected ? -16 : -14]}
                  >
                    <div
                      className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xl border cursor-pointer transition select-none flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#042f2e]/95 text-cyan-300 border-cyan-500 ring-1 ring-cyan-400'
                          : 'bg-[#070c18]/90 text-slate-300 border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      <span className="uppercase">{v.vehicle_number}</span>
                      <span className="text-[8px] text-slate-400 capitalize">({v.vehicle_type || 'truck'})</span>
                    </div>
                  </Tooltip>
                </Marker>
              </React.Fragment>
            );
          })}
      </MapContainer>
    </div>
  );
};
