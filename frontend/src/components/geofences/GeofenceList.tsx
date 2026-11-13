import React from 'react';
import { Geofence, GeofenceCategory, categoryColors } from '../../types';
import { ShieldAlert, MapPin, Filter, Play, Pause, Trash2 } from 'lucide-react';

interface GeofenceListProps {
  geofences: Geofence[];
  selectedCategory?: GeofenceCategory | '';
  onFilterChange: (cat: GeofenceCategory | '') => void;
  onToggleStatus?: (geofenceId: string, currentStatus?: string) => void;
  onDeleteGeofence?: (geofenceId: string) => void;
}

export const GeofenceList: React.FC<GeofenceListProps> = ({
  geofences,
  selectedCategory,
  onFilterChange,
  onToggleStatus,
  onDeleteGeofence,
}) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-4 border border-slate-700 flex flex-col h-full shadow-xl font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-slate-100 text-sm">Geofences</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
            {geofences.length}
          </span>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => onFilterChange(e.target.value as any)}
            className="bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none"
          >
            <option value="">All Zones</option>
            <option value="delivery_zone">Delivery</option>
            <option value="restricted_zone">Restricted</option>
            <option value="toll_zone">Toll</option>
            <option value="customer_area">Customer</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1 max-h-[420px]">
        {geofences.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs">
            <p>No geofences found</p>
          </div>
        ) : (
          geofences.map((geo) => {
            const color = categoryColors[geo.category] || categoryColors.delivery_zone;
            const isRestricted = geo.category === 'restricted_zone';
            const isInactive = geo.status === 'inactive';

            return (
              <div
                key={geo.id}
                className={`p-3 rounded-lg border transition text-xs select-none ${
                  isInactive
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-75'
                    : 'bg-slate-750/70 border-slate-700 hover:border-slate-600 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                    {isRestricted && <ShieldAlert className={`w-4 h-4 ${isInactive ? 'text-slate-500' : 'text-rose-400'}`} />}
                    <span className={isInactive ? 'line-through text-slate-400' : ''}>{geo.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isInactive ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-950/80 border border-amber-600/80 text-amber-300">
                        Inactive
                      </span>
                    ) : (
                      <span
                        className="text-[9.5px] px-2 py-0.5 rounded font-medium capitalize"
                        style={{ backgroundColor: `${color.fill}33`, color: color.fill, border: `1px solid ${color.stroke}66` }}
                      >
                        {geo.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {geo.description && (
                  <p className="text-slate-400 text-[11px] mt-1.5 line-clamp-2 font-sans">
                    {geo.description}
                  </p>
                )}

                {/* Bottom Row: Vertices & Actions (Toggle Inactive, Delete) */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-700/60 font-mono">
                  <span>{geo.coordinates.length > 1 ? geo.coordinates.length - 1 : geo.coordinates.length} vertices</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleStatus && onToggleStatus(geo.id, geo.status)}
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 transition ${
                        isInactive
                          ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-900/60 hover:bg-amber-800 text-amber-300 border border-amber-700'
                      }`}
                      title={isInactive ? 'Activate geofence' : 'Deactivate geofence (ignore tracking)'}
                    >
                      {isInactive ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                      <span>{isInactive ? 'Activate' : 'Deactivate'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete geofence "${geo.name}"?`)) {
                          onDeleteGeofence && onDeleteGeofence(geo.id);
                        }
                      }}
                      className="p-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 transition"
                      title="Delete geofence"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
