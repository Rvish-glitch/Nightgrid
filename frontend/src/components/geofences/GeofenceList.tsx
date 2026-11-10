import React from 'react';
import { Geofence, GeofenceCategory, categoryColors } from '../../types';
import { ShieldAlert, MapPin, Filter } from 'lucide-react';

interface GeofenceListProps {
  geofences: Geofence[];
  selectedCategory?: GeofenceCategory | '';
  onFilterChange: (cat: GeofenceCategory | '') => void;
}

export const GeofenceList: React.FC<GeofenceListProps> = ({
  geofences,
  selectedCategory,
  onFilterChange,
}) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-4 border border-slate-700 flex flex-col h-full shadow-xl">
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

      <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 max-h-[380px]">
        {geofences.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs">
            <p>No geofences found</p>
          </div>
        ) : (
          geofences.map((geo) => {
            const color = categoryColors[geo.category] || categoryColors.delivery_zone;
            const isRestricted = geo.category === 'restricted_zone';

            return (
              <div
                key={geo.id}
                className="p-3 rounded-lg bg-slate-750/70 border border-slate-700 hover:border-slate-600 transition text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                    {isRestricted && <ShieldAlert className="w-4 h-4 text-red-400" />}
                    <span>{geo.name}</span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded font-medium capitalize"
                    style={{ backgroundColor: `${color.fill}33`, color: color.fill, border: `1px solid ${color.stroke}66` }}
                  >
                    {geo.category.replace('_', ' ')}
                  </span>
                </div>

                {geo.description && (
                  <p className="text-slate-400 text-[11px] mt-1.5 line-clamp-2">
                    {geo.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700/60 font-mono">
                  <span>ID: {geo.id}</span>
                  <span>{geo.coordinates.length} vertices</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
