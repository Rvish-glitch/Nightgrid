import React, { useState, useEffect } from 'react';
import { Search, Bell, MapPin, PenTool } from 'lucide-react';

interface TopHeaderProps {
  wsConnected: boolean;
  alertCount: number;
  onOpenAlerts: () => void;
  onOpenNewVehicle: () => void;
  isDrawing: boolean;
  onToggleDrawing: () => void;
  drawingPointCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  wsConnected,
  alertCount,
  onOpenAlerts,
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
      {/* Left: Branding & Connection Status */}
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
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span>{wsConnected ? 'Telemetry Nominal · Real-Time Geofencing' : 'Connecting WebSocket...'}</span>
        </div>
      </div>

      {/* Right: Actions, UTC Clock, Search, Notification Bell */}
      <div className="flex items-center gap-2.5 font-mono text-xs">
        {/* Draw Geofence Polygon */}
        <button
          onClick={onToggleDrawing}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition border font-semibold ${
            isDrawing
              ? 'bg-amber-600 border-amber-400 text-white animate-pulse'
              : 'bg-[#0b1120] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
          title="Click points on map to draw custom geofence boundary"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{isDrawing ? `Finish (${drawingPointCount} pts)` : 'Draw Geofence'}</span>
        </button>

        {/* Place New Vehicle Button (asks for starting position) */}
        <button
          onClick={onOpenNewVehicle}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#091624] hover:bg-[#0e2238] border border-cyan-900/60 text-cyan-300 hover:text-white transition font-semibold"
          title="Register and place new vehicle on map with starting coordinates"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Place New Vehicle</span>
        </button>

        {/* Real-time UTC Clock */}
        <div className="text-slate-300 text-xs px-2 py-1">
          {utcTime || '00:00:00 UTC'}
        </div>

        {/* Search quick button */}
        <button
          onClick={() => {
            const input = document.getElementById('geofence-search-input');
            if (input) input.focus();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b1120] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="font-bold text-[11px] tracking-wider">SEARCH</span>
        </button>

        {/* Real-time Alert Notification Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-1.5 rounded bg-[#0b1120] border border-slate-800 text-slate-300 hover:text-white transition"
          title="View Alerts"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
