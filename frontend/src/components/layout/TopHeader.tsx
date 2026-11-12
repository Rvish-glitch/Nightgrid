import React, { useState, useEffect } from 'react';
import { MapPin, PenTool } from 'lucide-react';

interface TopHeaderProps {
  wsConnected: boolean;
  onStartPlacingVehicle: () => void;
  isPlacingVehicle: boolean;
  isDrawing: boolean;
  onToggleDrawing: () => void;
  drawingPointCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  wsConnected,
  onStartPlacingVehicle,
  isPlacingVehicle,
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

      {/* Right: Explicitly Named Action Buttons & UTC Clock (No duplicate Search or Bell) */}
      <div className="flex items-center gap-3 font-mono text-xs">
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

        {/* Place New Vehicle Button (Prompts to click on map to set starting position) */}
        <button
          onClick={onStartPlacingVehicle}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition border font-semibold ${
            isPlacingVehicle
              ? 'bg-cyan-600 border-cyan-400 text-white animate-pulse shadow-lg ring-1 ring-cyan-400'
              : 'bg-[#091624] hover:bg-[#0e2238] border border-cyan-900/60 text-cyan-300 hover:text-white'
          }`}
          title="Click on map to choose starting location for new vehicle"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{isPlacingVehicle ? 'Click Map to Place...' : 'Place New Vehicle'}</span>
        </button>

        {/* Real-time UTC Clock */}
        <div className="text-slate-400 text-xs px-2 py-1 bg-[#090f1c] border border-slate-800/80 rounded">
          {utcTime || '00:00:00 UTC'}
        </div>
      </div>
    </header>
  );
};
