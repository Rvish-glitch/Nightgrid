import React, { useState } from 'react';
import { createVehicle, updateVehicleLocation } from '../../api/client';
import { X, Truck, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVehicleId?: string) => void;
  startingPosition: [number, number] | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  startingPosition,
}) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleType, setVehicleType] = useState('truck');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Format coordinate display cleanly
  const formatCoord = (pos: [number, number] | null) => {
    if (!pos) return '37.7830° N, 122.4110° W';
    const latDir = pos[0] >= 0 ? 'N' : 'S';
    const lngDir = pos[1] >= 0 ? 'E' : 'W';
    return `${Math.abs(pos[0]).toFixed(5)}° ${latDir}, ${Math.abs(pos[1]).toFixed(5)}° ${lngDir}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lat = startingPosition ? startingPosition[0] : 37.7830;
    const lng = startingPosition ? startingPosition[1] : -122.4110;

    try {
      setLoading(true);

      // 1. Create the vehicle record
      const res = await createVehicle({
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        driver_name: driverName.trim(),
        vehicle_type: vehicleType,
        phone: phone.trim(),
      });

      // 2. Immediately place the vehicle at the map point selected by the user
      if (res && res.id) {
        await updateVehicleLocation({
          vehicle_id: res.id,
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString(),
        });
      }

      // Reset form
      setVehicleNumber('');
      setDriverName('');
      setPhone('');
      onSuccess(res?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register and place vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono select-none">
      <div className="bg-[#090f1e] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Vehicle Details</h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Location selected on map. Enter vehicle info to complete placement.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Starting Location Badge (Picked from map point) */}
        <div className="mt-3.5 p-3 bg-cyan-950/40 border border-cyan-700/60 rounded-xl flex items-center gap-2.5 text-xs text-cyan-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Starting Position Selected On Map
            </div>
            <div className="font-bold text-cyan-200 mt-0.5">
              {formatCoord(startingPosition)}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Vehicle Number & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Registration Number *</label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. KA-05-MN-9988"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vehicle Type *</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 capitalize"
              >
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="car">Car</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            </div>
          </div>

          {/* Driver Name & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Driver Name *</label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Driver Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1-503-555-0199"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold transition flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <MapPin className="w-4 h-4" />
              <span>{loading ? 'Placing Vehicle...' : 'Place Vehicle on Map'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
