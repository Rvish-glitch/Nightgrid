import React from 'react';
import { Vehicle } from '../../types';
import { ShieldAlert, ShieldCheck, History, Send, MapPin, Phone, User, Truck, Car, Bus } from 'lucide-react';

interface UnitDetailPanelProps {
  vehicle: Vehicle | null;
  currentGeofences: string[];
  onOpenHistory: () => void;
  onSimulateMove: () => void;
}

export const UnitDetailPanel: React.FC<UnitDetailPanelProps> = ({
  vehicle,
  currentGeofences,
  onOpenHistory,
  onSimulateMove,
}) => {
  if (!vehicle) {
    return (
      <div className="w-[275px] bg-[#070c18]/95 backdrop-blur-2xl border border-slate-800/90 rounded-xl p-3.5 text-slate-400 font-mono text-xs shadow-2xl pointer-events-auto">
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">SELECTED VEHICLE</div>
        <p className="text-slate-400 text-[11px] leading-relaxed">Click a vehicle icon on the map to monitor real-time telemetry and geofences.</p>
      </div>
    );
  }

  const isRestricted = currentGeofences.some((g) => g.toLowerCase().includes('restricted'));
  const isInsideAny = currentGeofences.length > 0;

  // Icon path based on vehicle type
  const vType = (vehicle.vehicle_type || 'truck').toLowerCase();
  const iconSrc = `/vehicles/${vType}_selected.png`;

  return (
    <div className="w-[275px] bg-[#070c18]/95 backdrop-blur-2xl border border-slate-800/90 rounded-xl p-3.5 font-mono shadow-2xl text-slate-200 pointer-events-auto select-none">
      {/* Vehicle Header with Integrated Status Badge */}
      <div className="pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">SELECTED UNIT</span>
          {/* Integrated Status Badge */}
          {isRestricted ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-600 text-rose-300 text-[9px] font-bold tracking-wider uppercase animate-pulse">
              <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
              <span>RESTRICTED</span>
            </div>
          ) : isInsideAny ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-600/60 text-cyan-300 text-[9px] font-bold tracking-wider uppercase">
              <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" />
              <span>IN GEOFENCE</span>
            </div>
          ) : (
            <div className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[9px] font-bold tracking-wider uppercase">
              <span>OUTSIDE</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 mt-1.5">
          <img
            src={iconSrc}
            alt={vType}
            className="w-8 h-8 rounded-full border border-cyan-500/60 p-0.5 bg-cyan-950/40 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/vehicles/truck_selected.png';
            }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-white tracking-tight truncate">
              {vehicle.vehicle_number}
            </h2>
            <div className="text-[10px] text-cyan-400/90 font-sans capitalize -mt-0.5">
              {vType} Fleet Unit
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 Telemetry Metric Box */}
      <div className="border border-slate-800/90 rounded-lg overflow-hidden bg-[#0a1020]/60 my-2.5 text-xs">
        <div className="grid grid-cols-2 divide-x divide-slate-800/90 border-b border-slate-800/90">
          {/* LATITUDE */}
          <div className="p-2">
            <div className="text-[8.5px] text-slate-500 uppercase tracking-wider font-semibold">LATITUDE</div>
            <div className="text-xs font-bold text-white mt-0.5">
              {vehicle.last_latitude != null ? `${vehicle.last_latitude.toFixed(5)}°` : 'Pending'}
            </div>
          </div>
          {/* LONGITUDE */}
          <div className="p-2">
            <div className="text-[8.5px] text-slate-500 uppercase tracking-wider font-semibold">LONGITUDE</div>
            <div className="text-xs font-bold text-white mt-0.5">
              {vehicle.last_longitude != null ? `${vehicle.last_longitude.toFixed(5)}°` : 'Pending'}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-800/90">
          {/* DRIVER */}
          <div className="p-2">
            <div className="text-[8.5px] text-slate-500 uppercase tracking-wider font-semibold">DRIVER</div>
            <div className="text-[11px] font-semibold text-slate-200 mt-0.5 truncate" title={vehicle.driver_name}>
              {vehicle.driver_name}
            </div>
          </div>
          {/* CONTACT */}
          <div className="p-2">
            <div className="text-[8.5px] text-slate-500 uppercase tracking-wider font-semibold">PHONE</div>
            <div className="text-[11px] font-semibold text-slate-300 mt-0.5 truncate" title={vehicle.phone}>
              {vehicle.phone}
            </div>
          </div>
        </div>
      </div>

      {/* Essential Geofence Details */}
      <div className="space-y-1.5 text-xs py-1">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[10px]">Active Zone</span>
          {currentGeofences.length > 0 ? (
            <span
              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-tight flex items-center gap-1 ${
                isRestricted
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-600 animate-pulse'
                  : 'bg-cyan-950/80 text-cyan-300 border border-cyan-700'
              }`}
            >
              {isRestricted && <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />}
              <span className="truncate max-w-[130px]">{currentGeofences[0]}</span>
            </span>
          ) : (
            <span className="text-slate-500 italic text-[10px]">Outside of geofences</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[10px]">Last Updated</span>
          <span className="text-slate-300 text-[10px]">
            {vehicle.last_updated_at ? new Date(vehicle.last_updated_at).toLocaleTimeString() : 'Just now'}
          </span>
        </div>
      </div>

      {/* Action Buttons: Test Restricted Entry & History */}
      <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
        <button
          onClick={onSimulateMove}
          title="Simulate entering Waterfront Restricted Port"
          className="py-1.5 px-2 rounded-md bg-[#0a2730] hover:bg-[#0e3644] text-cyan-300 border border-cyan-600/60 text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 shadow active:scale-95"
        >
          <Send className="w-2.5 h-2.5" />
          <span>Test Entry</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="py-1.5 px-2 rounded-md bg-[#0d1424] hover:bg-[#121c32] text-slate-300 border border-slate-700/80 text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 shadow active:scale-95"
        >
          <History className="w-2.5 h-2.5" />
          <span>Violations</span>
        </button>
      </div>
    </div>
  );
};
