import React, { useState } from 'react';
import { createVehicle, updateVehicleLocation } from '../../api/client';
import { X, Truck, MapPin, AlertCircle, Compass } from 'lucide-react';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVehicleId?: string) => void;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleType, setVehicleType] = useState('truck');
  const [phone, setPhone] = useState('');

  // Starting GPS Position (Defaulted to Downtown area)
  const [latitude, setLatitude] = useState('37.7810');
  const [longitude, setLongitude] = useState('-122.4140');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(4));
    setLongitude(lng.toFixed(4));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError('Starting latitude must be between -90 and 90');
      return;
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setError('Starting longitude must be between -180 and 180');
      return;
    }

    try {
      setLoading(true);

      // 1. Create the vehicle record
      const res = await createVehicle({
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        driver_name: driverName.trim(),
        vehicle_type: vehicleType,
        phone: phone.trim(),
      });

      // 2. Immediately place the vehicle at its starting GPS position
      if (res && res.id) {
        await updateVehicleLocation({
          vehicle_id: res.id,
          latitude: latNum,
          longitude: lngNum,
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
      <div className="bg-[#090f1e] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Place New Vehicle</h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Register a new fleet unit and place it at its initial GPS position
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Row 1: Vehicle Number & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vehicle Number *</label>
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

          {/* Row 2: Driver Name & Phone */}
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

          {/* Starting GPS Position (As requested by user) */}
          <div className="p-3.5 bg-[#060a14] border border-cyan-950/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Starting GPS Position
              </span>
              <span className="text-[10px] text-slate-500">Coordinates on map</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Latitude (°N/S) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="37.7810"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Longitude (°E/W) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-122.4140"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Quick Placement Presets */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Quick Location Presets:</div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(37.7810, -122.4140)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
                >
                  Downtown Delivery Zone
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(37.7950, -122.4000)}
                  className="px-2 py-0.5 rounded text-[10px] bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 transition"
                >
                  Restricted Port
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(37.7840, -122.3875)}
                  className="px-2 py-0.5 rounded text-[10px] bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80 text-amber-300 transition"
                >
                  Toll Zone
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(37.7720, -122.4250)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
                >
                  Outside (Clear)
                </button>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
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
