import React from 'react';
import { Vehicle } from '../../types';
import { Truck, CheckCircle2, Play, Pause, Trash2 } from 'lucide-react';

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle) => void;
  onToggleStatus?: (vehicleId: string, currentStatus: string) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onToggleStatus,
  onDeleteVehicle,
}) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-4 border border-slate-700 flex flex-col h-full shadow-xl font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-400" />
          <h2 className="font-semibold text-slate-100 text-sm">Vehicles Fleet</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
            {vehicles.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Click to track</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1 max-h-[420px]">
        {vehicles.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs">
            <p>No vehicles registered yet</p>
          </div>
        ) : (
          vehicles.map((v) => {
            const isSelected = selectedVehicle?.id === v.id;
            const isInactive = v.status === 'inactive';

            return (
              <div
                key={v.id}
                onClick={() => onSelectVehicle(v)}
                className={`p-3 rounded-lg border cursor-pointer transition text-xs select-none ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-lg ring-1 ring-cyan-500/50'
                    : isInactive
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-75'
                    : 'bg-slate-750/70 border-slate-700 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <img
                      src={`/vehicle-icons/${(v.vehicle_type || 'truck').toLowerCase()}${isSelected ? '_selected' : ''}.png`}
                      alt={v.vehicle_type}
                      className={`w-5 h-5 object-contain ${isInactive ? 'grayscale opacity-60' : ''}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/vehicle-icons/truck.png';
                      }}
                    />
                    <span className="font-mono text-sm tracking-wide">{v.vehicle_number}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isInactive ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-950/80 border border-amber-600/80 text-amber-300">
                        Paused
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-950/60 border border-emerald-600/60 text-emerald-300">
                        Active
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] mt-2 text-slate-400 font-sans">
                  <div>Driver: <span className="text-slate-200">{v.driver_name}</span></div>
                  <div>Type: <span className="text-slate-200 capitalize">{v.vehicle_type}</span></div>
                </div>

                {/* Bottom Row: Location & Actions (Pause/Resume, Delete) */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-700/60 font-mono">
                  <span>
                    {v.last_latitude != null && v.last_longitude != null
                      ? `[${v.last_latitude.toFixed(4)}, ${v.last_longitude.toFixed(4)}]`
                      : 'Pending location'}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleStatus && onToggleStatus(v.id, v.status)}
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 transition ${
                        isInactive
                          ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-900/60 hover:bg-amber-800 text-amber-300 border border-amber-700'
                      }`}
                      title={isInactive ? 'Resume tracking' : 'Pause tracking'}
                    >
                      {isInactive ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                      <span>{isInactive ? 'Resume' : 'Pause'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete vehicle ${v.vehicle_number}?`)) {
                          onDeleteVehicle && onDeleteVehicle(v.id);
                        }
                      }}
                      className="p-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 transition"
                      title="Delete vehicle"
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
