import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, PenTool } from 'lucide-react';

interface TopHeaderProps {
  wsConnected: boolean;
  alertCount: number;
  onOpenAlerts: () => void;
  onOpenNewGeofence: () => void;
  onOpenNewVehicle: () => void;
  isDrawing: boolean;
  onToggleDrawing: () => void;
  drawingPointCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  wsConnected,
  alertCount,
  onOpenAlerts,
  onOpenNewGeofence,
  onOpenNewVehicle,
  isDrawing,
  onToggleDrawing,
  drawingPointCount,
}) => {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 bg-[#060a12] border-b border-slate-800/80 px-4 flex items-center justify-between z-30 select-none">
      {/* Left: NG Branding & Region Telemetry */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#091120] border border-cyan-800/60 flex items-center justify-center font-mono font-black text-[9px] text-cyan-400">
            NG
          </div>
          <span className="font-extrabold tracking-widest text-sm text-white font-mono">
            NIGHTGRID
          </span>
        </div>

        <span className="text-slate-700 font-mono text-xs">•</span>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Telemetry nominal · Region NW-2</span>
        </div>
      </div>

      {/* Right: Actions, UTC Clock, Search, Notification Bell, Sign In */}
      <div className="flex items-center gap-2.5 font-mono text-xs">
        {/* Draw Radar Polygon button */}
        <button
          onClick={onToggleDrawing}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition border ${
            isDrawing
              ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
              : 'bg-[#0b1120] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{isDrawing ? `FINISH (${drawingPointCount} PTS)` : 'DRAW RADAR'}</span>
        </button>

        {/* Quick Add Modals */}
        <button
          onClick={onOpenNewGeofence}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#091624] hover:bg-[#0e2238] border border-cyan-900/60 text-cyan-300 transition"
        >
          <Plus className="w-3 h-3" />
          <span>ZONE</span>
        </button>

        <button
          onClick={onOpenNewVehicle}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#0b1120] hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
        >
          <Plus className="w-3 h-3" />
          <span>UNIT</span>
        </button>

        {/* UTC Clock matching Screenshot */}
        <div className="text-slate-300 text-xs px-2 py-1">
          {utcTime || '23:41:07 UTC'}
        </div>

        {/* SEARCH button matching Screenshot */}
        <button
          onClick={() => {
            const input = document.getElementById('nightgrid-search-input');
            if (input) input.focus();
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0b1120] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="font-bold text-[11px] tracking-wider">SEARCH</span>
        </button>

        {/* Notification Bell with Badge matching Screenshot */}
        <button
          onClick={onOpenAlerts}
          className="relative p-1.5 rounded bg-[#0b1120] border border-slate-800 text-slate-300 hover:text-white transition"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 ? (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          ) : (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              4
            </span>
          )}
        </button>

        {/* SIGN IN Pill matching Screenshot */}
        <div className="px-3 py-1 rounded bg-[#0b1120] border border-slate-800 text-slate-300 font-bold text-[11px] uppercase tracking-wider cursor-pointer hover:border-slate-700 transition">
          SIGN IN
        </div>
      </div>
    </header>
  );
};
