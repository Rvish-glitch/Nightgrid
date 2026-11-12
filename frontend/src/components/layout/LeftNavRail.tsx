import React from 'react';
import { Map, Truck, Shield, Bell, Settings } from 'lucide-react';

export type NavTab = 'map' | 'vehicles' | 'geofences' | 'alerts';

interface LeftNavRailProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  alertCount: number;
  onOpenSettings: () => void;
}

export const LeftNavRail: React.FC<LeftNavRailProps> = ({
  activeTab,
  onTabChange,
  alertCount,
  onOpenSettings,
}) => {
  return (
    <aside className="w-16 bg-[#060a12] border-r border-slate-800/80 flex flex-col items-center py-3 justify-between z-40 select-none">
      {/* Top Nav Items matching User Requirements */}
      <nav className="flex flex-col items-center gap-5 w-full">
        {/* MAP */}
        <button
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center gap-1 group py-1.5 px-2 rounded-lg transition w-full ${
            activeTab === 'map' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Map View"
        >
          <div className={`p-1.5 rounded transition ${activeTab === 'map' ? 'bg-cyan-950/60 border border-cyan-800/60' : ''}`}>
            <Map className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[9px] font-mono font-semibold tracking-wider">MAP</span>
        </button>

        {/* VEHICLES (Previously UNITS) */}
        <button
          onClick={() => onTabChange('vehicles')}
          className={`flex flex-col items-center gap-1 group py-1.5 px-2 rounded-lg transition w-full ${
            activeTab === 'vehicles' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Vehicles Fleet"
        >
          <div className={`p-1.5 rounded transition ${activeTab === 'vehicles' ? 'bg-cyan-950/60 border border-cyan-800/60' : ''}`}>
            <Truck className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[9px] font-mono font-semibold tracking-wider">VEHICLES</span>
        </button>

        {/* GEOFENCES (Previously CREW / ZONES) */}
        <button
          onClick={() => onTabChange('geofences')}
          className={`flex flex-col items-center gap-1 group py-1.5 px-2 rounded-lg transition w-full ${
            activeTab === 'geofences' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Geofences"
        >
          <div className={`p-1.5 rounded transition ${activeTab === 'geofences' ? 'bg-cyan-950/60 border border-cyan-800/60' : ''}`}>
            <Shield className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[8.5px] font-mono font-semibold tracking-wider">GEOFENCES</span>
        </button>

        {/* ALERTS */}
        <button
          onClick={() => onTabChange('alerts')}
          className={`flex flex-col items-center gap-1 group py-1.5 px-2 rounded-lg transition w-full relative ${
            activeTab === 'alerts' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Real-Time Alerts"
        >
          <div className={`p-1.5 rounded transition relative ${activeTab === 'alerts' ? 'bg-cyan-950/60 border border-cyan-800/60' : ''}`}>
            <Bell className="w-5 h-5 stroke-[1.5]" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center animate-pulse">
                {alertCount > 9 ? '!' : alertCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono font-semibold tracking-wider">ALERTS</span>
        </button>
      </nav>

      {/* Bottom Settings Icon */}
      <button
        onClick={onOpenSettings}
        className="text-slate-500 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-900 transition"
        title="Alert Rules & Settings"
      >
        <Settings className="w-5 h-5 stroke-[1.5]" />
      </button>
    </aside>
  );
};
