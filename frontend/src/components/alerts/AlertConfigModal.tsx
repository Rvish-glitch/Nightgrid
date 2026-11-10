import React, { useState } from 'react';
import { Geofence, Vehicle, EventType } from '../../types';
import { configureAlert } from '../../api/client';
import { X, BellRing, Plus, AlertCircle } from 'lucide-react';

interface AlertConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  geofences: Geofence[];
  vehicles: Vehicle[];
}

export const AlertConfigModal: React.FC<AlertConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  geofences,
  vehicles,
}) => {
  const [geofenceId, setGeofenceId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [eventType, setEventType] = useState<EventType>('entry');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!geofenceId) {
      setError('Please select a geofence zone');
      return;
    }

    try {
      setLoading(true);
      await configureAlert({
        geofence_id: geofenceId,
        vehicle_id: vehicleId || undefined,
        event_type: eventType,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to configure alert rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">Configure Alert Rule</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Geofence *</label>
            <select
              required
              value={geofenceId}
              onChange={(e) => setGeofenceId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Select Geofence Zone...</option>
              {geofences.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.category.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Specific Vehicle (Optional)</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Vehicles (Global Alert)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} — {v.driver_name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Leave blank to trigger alerts for any vehicle entering/exiting this zone.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Event Type *</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 capitalize"
            >
              <option value="entry">Entry (When vehicle enters zone)</option>
              <option value="exit">Exit (When vehicle leaves zone)</option>
              <option value="both">Both (Entry & Exit)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !geofenceId}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Saving...' : 'Set Alert Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
