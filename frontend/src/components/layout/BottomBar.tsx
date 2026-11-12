import React from 'react';

interface BottomBarProps {
  onOpenVehicles: () => void;
  onOpenGeofences: () => void;
  onOpenAlerts: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  onOpenVehicles,
  onOpenGeofences,
  onOpenAlerts,
}) => {
  return (
    <footer className="h-7 bg-[#060a12] border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] font-mono text-slate-500 z-30 select-none">
      {/* Left Links */}
      <div className="flex items-center gap-4">
        <span className="text-cyan-400 font-semibold cursor-pointer">Map</span>
        <span onClick={onOpenVehicles} className="hover:text-cyan-300 cursor-pointer transition font-medium">
          Vehicles
        </span>
        <span onClick={onOpenGeofences} className="hover:text-cyan-300 cursor-pointer transition font-medium">
          Geofences
        </span>
        <span onClick={onOpenAlerts} className="hover:text-cyan-300 cursor-pointer transition font-medium">
          Alerts
        </span>
      </div>

      {/* Right Meta */}
      <div className="flex items-center gap-4 text-slate-500">
        <a
          href="http://localhost:8080/swagger"
          target="_blank"
          rel="noreferrer"
          className="text-cyan-500/80 hover:text-cyan-400 cursor-pointer transition font-bold"
        >
          API Docs (/swagger)
        </a>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 font-bold">NIGHTGRID v2.4.1</span>
      </div>
    </footer>
  );
};
