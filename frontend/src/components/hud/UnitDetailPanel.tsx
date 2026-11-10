import React from 'react';
import { Vehicle } from '../../types';
import { ShieldAlert, History, Send, Fuel } from 'lucide-react';

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
      <div className="w-[340px] bg-[#080d19]/95 backdrop-blur-2xl border border-slate-800/90 rounded-xl p-5 text-slate-400 font-mono text-xs shadow-2xl pointer-events-auto">
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">SELECTED UNIT</div>
        <p className="text-slate-400">Click a unit on the map or fleet list to inspect telemetry.</p>
      </div>
    );
  }

  const isRestricted = currentGeofences.some((g) => g.toLowerCase().includes('restricted'));
  const isMoving = vehicle.last_latitude != null;

  // Format coordinates cleanly like "45.5152° N · 122.6784° W"
  const formatCoord = (lat?: number, lng?: number) => {
    if (lat == null || lng == null) return 'Pending GPS';
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir} · ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
  };

  return (
    <div className="w-[340px] bg-[#070c18]/95 backdrop-blur-2xl border border-slate-800/90 rounded-xl p-5 font-mono shadow-2xl text-slate-200 pointer-events-auto select-none">
      {/* Unit Header from Screenshot */}
      <div className="flex items-start justify-between pb-3">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">SELECTED UNIT</span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
            {vehicle.vehicle_number}
          </h2>
          <div className="text-xs text-slate-400 font-sans mt-0.5">
            {vehicle.vehicle_type === 'truck' ? 'Volvo VNL 760 · Sleeper cab' : vehicle.vehicle_type}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{isMoving ? 'MOVING' : 'IDLE'}</span>
        </div>
      </div>

      {/* 2x2 Telemetry Metric Box (Exact layout from Screenshot) */}
      <div className="border border-slate-800/90 rounded-lg overflow-hidden bg-[#0a1020]/60 mb-3.5">
        <div className="grid grid-cols-2 divide-x divide-slate-800/90 border-b border-slate-800/90">
          {/* SPEED */}
          <div className="p-2.5">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">SPEED</div>
            <div className="text-xl font-bold text-white mt-0.5 flex items-baseline">
              <span>62</span>
              <span className="text-[11px] font-normal text-slate-400 ml-1 font-sans">mph</span>
            </div>
          </div>
          {/* HEADING */}
          <div className="p-2.5">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">HEADING</div>
            <div className="text-xl font-bold text-white mt-0.5 flex items-baseline">
              <span>087°</span>
              <span className="text-[11px] font-normal text-slate-400 ml-1 font-sans">E</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-800/90">
          {/* ODOMETER */}
          <div className="p-2.5">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">ODOMETER</div>
            <div className="text-xs font-bold text-white mt-0.5">148,203 mi</div>
          </div>
          {/* LAST SERVICE */}
          <div className="p-2.5">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">LAST SERVICE</div>
            <div className="text-xs font-bold text-white mt-0.5">2026-06-28</div>
          </div>
        </div>
      </div>

      {/* Details List */}
      <div className="space-y-2 text-xs py-1">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">Position</span>
          <span className="text-cyan-300 font-semibold text-[11px]">
            {formatCoord(vehicle.last_latitude, vehicle.last_longitude)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">Driver</span>
          <span className="text-slate-200 font-medium text-[11px]">{vehicle.driver_name}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">Route</span>
          <span className="text-slate-300 text-[11px]">I-84 E · Manifest 4471</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">Active Zone</span>
          {currentGeofences.length > 0 ? (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight flex items-center gap-1 ${
                isRestricted
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-600 animate-pulse'
                  : 'bg-cyan-950/80 text-cyan-300 border border-cyan-700'
              }`}
            >
              {isRestricted && <ShieldAlert className="w-3 h-3 text-rose-400" />}
              <span>{currentGeofences[0]}</span>
            </span>
          ) : (
            <span className="text-slate-500 italic text-[11px]">Clear of zones</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px]">ETA</span>
          <span className="text-slate-300 text-[11px]">
            23:58 <span className="text-amber-400/90 ml-1">· 12 min late</span>
          </span>
        </div>

        {/* Fuel Progress Bar */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500">Fuel</span>
            <span className="text-slate-300 font-bold">38%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-[38%]"></div>
          </div>
        </div>
      </div>

      {/* Tactical Action Buttons: DISPATCH & HISTORY */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-slate-800/80">
        <button
          onClick={onSimulateMove}
          title="Click to dispatch unit into Waterfront Restricted Port"
          className="py-2 px-3 rounded-md bg-[#0a2730] hover:bg-[#0e3644] text-cyan-300 border border-cyan-600/60 text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
        >
          <Send className="w-3 h-3" />
          <span>DISPATCH</span>
        </button>

        <button
          onClick={onOpenHistory}
          className="py-2 px-3 rounded-md bg-[#0d1424] hover:bg-[#121c32] text-slate-300 border border-slate-700/80 text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow active:scale-95"
        >
          <History className="w-3 h-3" />
          <span>HISTORY</span>
        </button>
      </div>
    </div>
  );
};
