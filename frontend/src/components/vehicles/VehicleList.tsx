import React from 'react';
import { Vehicle } from '../../types';
import { Truck, Navigation, CheckCircle2 } from 'lucide-react';

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (v: Vehicle) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
}) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-4 border border-slate-700 flex flex-col h-full shadow-xl">
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

      <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 max-h-[380px]">
        {vehicles.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs">
            <p>No vehicles registered yet</p>
          </div>
        ) : (
          vehicles.map((v) => {
            const isSelected = selectedVehicle?.id === v.id;

            return (
              <div
                key={v.id}
                onClick={() => onSelectVehicle(v)}
                className={`p-3 rounded-lg border cursor-pointer transition text-xs ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-lg'
                    : 'bg-slate-750/70 border-slate-700 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <img
                      src={`/vehicle-icons/${(v.vehicle_type || 'truck').toLowerCase()}${isSelected ? '_selected' : ''}.png`}
                      alt={v.vehicle_type}
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/vehicle-icons/truck.png';
                      }}
                    />
                    <span className="font-mono text-sm tracking-wide">{v.vehicle_number}</span>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] text-cyan-400 font-normal">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] mt-2 text-slate-400">
                  <div>Driver: <span className="text-slate-200">{v.driver_name}</span></div>
                  <div>Type: <span className="text-slate-200 capitalize">{v.vehicle_type}</span></div>
                </div>

                {v.last_latitude != null && v.last_longitude != null ? (
                  <div className="flex items-center justify-between text-[10px] text-cyan-300 mt-2 pt-2 border-t border-slate-700/60 font-mono">
                    <span>Pos: [{v.last_latitude}, {v.last_longitude}]</span>
                    <span>Status: Active</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700/60">
                    No location recorded yet
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
