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
      {/* Left Links matching Screenshot */}
      <div className="flex items-center gap-4">
        <span className="text-cyan-400 font-semibold cursor-pointer">Live Map</span>
        <span onClick={onOpenVehicles} className="hover:text-slate-300 cursor-pointer transition">
          Vehicles
        </span>
        <span onClick={onOpenGeofences} className="hover:text-slate-300 cursor-pointer transition">
          Drivers
        </span>
        <span onClick={onOpenAlerts} className="hover:text-slate-300 cursor-pointer transition">
          Alerts
        </span>
      </div>

      {/* Right Meta matching Screenshot */}
      <div className="flex items-center gap-4 text-slate-500">
        <span className="text-slate-400 font-bold">GRID v2.4.1</span>
        <span className="hover:text-slate-300 cursor-pointer transition">Sign in</span>
        <span className="hover:text-slate-300 cursor-pointer transition">Create account</span>
        <span className="hover:text-slate-300 cursor-pointer transition">Recovery</span>
      </div>
    </footer>
  );
};
