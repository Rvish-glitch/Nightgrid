import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Polyline,
  Tooltip,
  useMapEvents,
} from 'react-leaflet';
import { Geofence, Vehicle, categoryColors } from '../../types';
import { ShieldAlert, Globe, Layers, Search, Navigation, PenTool, Check, RotateCcw, X } from 'lucide-react';

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
  onClearDrawing?: () => void;
  onFinishDrawing?: () => void;
  onCancelDrawing?: () => void;
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

export const MapView: React.FC<MapViewProps> = ({
  geofences,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onMapClick,
  isDrawing,
  drawingPoints,
  onAddPoint,
  onClearDrawing,
  onFinishDrawing,
  onCancelDrawing,
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
      {/* Floating Drawing Mode Banner (Appears when user clicks Draw Geofence) */}
      {isDrawing && (
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-[1500] bg-[#0c1322]/95 backdrop-blur-xl border-2 border-amber-500 rounded-xl px-5 py-2.5 shadow-2xl flex items-center gap-4 text-white font-mono select-none animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <PenTool className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">
              DRAWING GEOFENCE: Click on map to add points ({drawingPoints.length} added)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {drawingPoints.length >= 3 ? (
              <button
                onClick={onFinishDrawing}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md flex items-center gap-1 shadow transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Finish & Save</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                (Need {3 - drawingPoints.length} more {3 - drawingPoints.length === 1 ? 'pt' : 'pts'})
              </span>
            )}

            {drawingPoints.length > 0 && (
              <button
                onClick={onClearDrawing}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md flex items-center gap-1 transition"
                title="Reset points"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}

            <button
              onClick={onCancelDrawing}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Cancel drawing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
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

      {/* Top Right Map Mode Switcher (ROADS and SATELLITE only) */}
      <div className="absolute top-5 right-[340px] z-[1000] bg-[#080d19]/95 backdrop-blur-xl p-1 rounded-lg border border-slate-800 shadow-2xl flex items-center gap-1 select-none pointer-events-auto">
        <button
          onClick={() => setMapMode('streets')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold transition ${
            mapMode === 'streets'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Roads & Streets View"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ROADS</span>
        </button>

        <button
          onClick={() => setMapMode('satellite')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold transition ${
            mapMode === 'satellite'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Satellite Imagery"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>SATELLITE</span>
        </button>
      </div>

      {/* Bottom Left Real Status Summary Cards */}
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
        className={`w-full h-full ${isDrawing ? 'drawing-active' : ''}`}
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
                  weight: 3,
                  dashArray: '6, 6',
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
                  fillOpacity: 0.28,
                  weight: 2,
                  dashArray: '6, 6',
                }}
              />
            )}

            {/* Draw visible circular markers for every single selected point */}
            {drawingPoints.map((pt, idx) => (
              <CircleMarker
                key={`drawing-pt-${idx}`}
                center={pt}
                radius={7}
                pathOptions={{
                  fillColor: idx === 0 ? '#10b981' : '#f59e0b',
                  color: '#ffffff',
                  weight: 2.5,
                  fillOpacity: 1,
                }}
                eventHandlers={{
                  click: () => {
                    // Clicking on point 1 when >= 3 points completes the polygon
                    if (idx === 0 && drawingPoints.length >= 3 && onFinishDrawing) {
                      onFinishDrawing();
                    }
                  },
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -6]}>
                  <div className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-lg text-white ${
                    idx === 0 ? 'bg-emerald-600 border border-emerald-400' : 'bg-amber-600 border border-amber-400'
                  }`}>
                    {idx === 0 ? 'Start (P1)' : `P${idx + 1}`}
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
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
                radius={3.5}
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
        {/* REAL VEHICLE FLEET MARKERS ON MAP                           */}
        {/* ============================================================ */}
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
