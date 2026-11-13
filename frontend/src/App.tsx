import React, { useState, useEffect } from 'react';
import { Geofence, Vehicle, GeofenceCategory } from './types';
import { getGeofences, getVehicles, updateVehicleLocation } from './api/client';
import { useWebSocket } from './hooks/useWebSocket';

import { MapView } from './components/map/MapView';
import { TopHeader } from './components/layout/TopHeader';
import { LeftNavRail, NavTab } from './components/layout/LeftNavRail';
import { BottomBar } from './components/layout/BottomBar';
import { UnitDetailPanel } from './components/hud/UnitDetailPanel';
import { AlertToast } from './components/alerts/AlertToast';
import { AlertFeed } from './components/alerts/AlertFeed';
import { GeofenceModal } from './components/geofences/GeofenceModal';
import { GeofenceList } from './components/geofences/GeofenceList';
import { VehicleModal } from './components/vehicles/VehicleModal';
import { VehicleList } from './components/vehicles/VehicleList';
import { AlertConfigModal } from './components/alerts/AlertConfigModal';
import { ViolationHistory } from './components/violations/ViolationHistory';

import { X } from 'lucide-react';

export const App: React.FC = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentEnclosingGeofences, setCurrentEnclosingGeofences] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<GeofenceCategory | ''>('');

  // Active Drawer / View (Controlled only by LeftNavRail)
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('map');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Modals state
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAlertConfigOpen, setIsAlertConfigOpen] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);

  // Vehicle Placement State (Click map to choose location)
  const [isPlacingVehicle, setIsPlacingVehicle] = useState(false);
  const [pendingVehiclePosition, setPendingVehiclePosition] = useState<[number, number] | null>(null);

  // WebSocket hook
  const { messages: wsAlerts, latestAlert, isConnected, clearAlerts } = useWebSocket('/ws/alerts');

  // Load initial data
  const loadData = async () => {
    try {
      const [geoRes, vehRes] = await Promise.all([
        getGeofences(categoryFilter || undefined),
        getVehicles(),
      ]);
      setGeofences(geoRes.geofences || []);
      setVehicles(vehRes.vehicles || []);

      if (vehRes.vehicles && vehRes.vehicles.length > 0) {
        const defaultVehicle = vehRes.vehicles.find((v) => v.vehicle_number === 'KA-01-AB-1234') || vehRes.vehicles[0];
        setSelectedVehicle((prev) => prev || defaultVehicle);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  // Click on map to move vehicle, draw, or place new vehicle
  const handleMapClick = async (lat: number, lng: number) => {
    // 1. If in "Place New Vehicle" mode, capture clicked point and open modal
    if (isPlacingVehicle) {
      setPendingVehiclePosition([lat, lng]);
      setIsPlacingVehicle(false);
      setIsVehicleModalOpen(true);
      return;
    }

    // 2. If in Drawing mode, point is added via MapEvents -> onAddPoint
    if (isDrawing) return;

    // 3. Normal mode: move currently selected vehicle
    if (!selectedVehicle) return;

    try {
      const res = await updateVehicleLocation({
        vehicle_id: selectedVehicle.id,
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
      });

      // Update current enclosing geofence names
      const zoneNames = (res.current_geofences || []).map((g) => g.geofence_name);
      setCurrentEnclosingGeofences(zoneNames);

      // Update local vehicle state
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === selectedVehicle.id
            ? { ...v, last_latitude: lat, last_longitude: lng, last_updated_at: new Date().toISOString() }
            : v
        )
      );
      setSelectedVehicle((prev) =>
        prev ? { ...prev, last_latitude: lat, last_longitude: lng, last_updated_at: new Date().toISOString() } : null
      );
    } catch (err) {
      console.error('Failed to update vehicle location:', err);
    }
  };

  const handleAddDrawingPoint = (pt: [number, number]) => {
    setDrawingPoints((prev) => [...prev, pt]);
  };

  // Simulate quick movement into Waterfront Restricted Port
  const handleSimulateMove = () => {
    // Coordinates inside Waterfront Restricted Port
    handleMapClick(37.7950, -122.4000);
  };

  return (
    <div className="h-screen w-screen bg-[#050811] text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Real-time Alert Toast Notification */}
      <AlertToast latestAlert={latestAlert} />

      {/* Top Header with Action Buttons (No duplicate nav or search) */}
      <TopHeader
        wsConnected={isConnected}
        onStartPlacingVehicle={() => {
          setIsPlacingVehicle(true);
          setIsDrawing(false);
        }}
        isPlacingVehicle={isPlacingVehicle}
        isDrawing={isDrawing}
        onToggleDrawing={() => {
          setIsDrawing(!isDrawing);
          setIsPlacingVehicle(false);
          if (isDrawing && drawingPoints.length >= 3) {
            setIsGeofenceModalOpen(true);
          }
        }}
        drawingPointCount={drawingPoints.length}
      />

      {/* Middle Workspace: Left Rail + Fullscreen Map + Right Telemetry HUD */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Navigation Rail (Primary Navigation: MAP, VEHICLES, GEOFENCES, ALERTS, SETTINGS) */}
        <LeftNavRail
          activeTab={activeNavTab}
          onTabChange={(tab) => {
            setActiveNavTab(tab);
            if (tab === 'map') setIsHistoryOpen(false);
          }}
          alertCount={wsAlerts.length}
          onOpenSettings={() => setIsAlertConfigOpen(true)}
        />

        {/* Central Map Canvas */}
        <div className="flex-1 relative h-full w-full">
          <MapView
            geofences={geofences}
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(v) => setSelectedVehicle(v)}
            onMapClick={handleMapClick}
            isDrawing={isDrawing}
            drawingPoints={drawingPoints}
            onAddPoint={handleAddDrawingPoint}
            onUndoPoint={() => setDrawingPoints((prev) => prev.slice(0, -1))}
            onClearDrawing={() => setDrawingPoints([])}
            onFinishDrawing={() => {
              if (drawingPoints.length >= 3) {
                setIsDrawing(false);
                setIsGeofenceModalOpen(true);
              }
            }}
            onCancelDrawing={() => {
              setIsDrawing(false);
              setDrawingPoints([]);
            }}
            isPlacingVehicle={isPlacingVehicle}
            onCancelPlacingVehicle={() => setIsPlacingVehicle(false)}
            pendingVehiclePosition={pendingVehiclePosition}
          />

          {/* Right Floating Telemetry HUD */}
          <div className="absolute top-5 right-5 z-[1000] pointer-events-none">
            <UnitDetailPanel
              vehicle={selectedVehicle}
              currentGeofences={currentEnclosingGeofences}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onSimulateMove={handleSimulateMove}
            />
          </div>

          {/* Slide-over Side Drawer for VEHICLES / GEOFENCES / ALERTS */}
          {activeNavTab !== 'map' && (
            <div className="absolute top-0 left-0 bottom-0 z-[1100] w-96 bg-[#080d19]/95 backdrop-blur-2xl border-r border-slate-800 p-4 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-cyan-400">
                  {activeNavTab === 'vehicles' && 'VEHICLES'}
                  {activeNavTab === 'geofences' && 'GEOFENCES'}
                  {activeNavTab === 'alerts' && 'REAL-TIME ALERTS'}
                </span>
                <button
                  onClick={() => setActiveNavTab('map')}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mt-3">
                {activeNavTab === 'vehicles' && (
                  <VehicleList
                    vehicles={vehicles}
                    selectedVehicle={selectedVehicle}
                    onSelectVehicle={(v) => {
                      setSelectedVehicle(v);
                      setActiveNavTab('map');
                    }}
                  />
                )}

                {activeNavTab === 'geofences' && (
                  <GeofenceList
                    geofences={geofences}
                    selectedCategory={categoryFilter}
                    onFilterChange={setCategoryFilter}
                  />
                )}

                {activeNavTab === 'alerts' && (
                  <AlertFeed
                    alerts={wsAlerts}
                    isConnected={isConnected}
                    onClear={clearAlerts}
                  />
                )}
              </div>
            </div>
          )}

          {/* History Modal / Drawer */}
          {isHistoryOpen && (
            <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-4xl bg-[#090e1a] border border-slate-800 rounded-xl p-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-mono font-bold text-sm text-cyan-400 uppercase tracking-wider">
                    Historical Violations Log
                  </span>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4">
                  <ViolationHistory geofences={geofences} vehicles={vehicles} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar (No duplicate nav buttons) */}
      <BottomBar wsConnected={isConnected} />

      {/* Modals */}
      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        onSuccess={loadData}
        drawnPoints={drawingPoints}
        onClearDrawing={() => {
          setDrawingPoints([]);
          setIsDrawing(false);
        }}
      />

      {/* Place New Vehicle Modal with Selected Map Starting Point */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        startingPosition={pendingVehiclePosition}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setPendingVehiclePosition(null);
        }}
        onSuccess={async (newId?: string) => {
          setPendingVehiclePosition(null);
          await loadData();
          if (newId) {
            try {
              const res = await getVehicles();
              const placed = (res.vehicles || []).find((v) => v.id === newId);
              if (placed) setSelectedVehicle(placed);
            } catch (err) {
              console.error('Failed to select newly placed vehicle:', err);
            }
          }
        }}
      />

      <AlertConfigModal
        isOpen={isAlertConfigOpen}
        onClose={() => setIsAlertConfigOpen(false)}
        onSuccess={loadData}
        geofences={geofences}
        vehicles={vehicles}
      />
    </div>
  );
};

export default App;
