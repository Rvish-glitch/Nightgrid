import React, { useState } from 'react';
import { GeofenceCategory } from '../../types';
import { createGeofence } from '../../api/client';
import { X, Layers, Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface GeofenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  drawnPoints: [number, number][];
  onClearDrawing: () => void;
}

export const GeofenceModal: React.FC<GeofenceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  drawnPoints,
  onClearDrawing,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GeofenceCategory>('delivery_zone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Ensure closed polygon ring: first and last identical
  const getCoordinates = (): [number, number][] => {
    if (drawnPoints.length === 0) return [];
    const pts = [...drawnPoints];
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      pts.push([first[0], first[1]]);
    }
    return pts;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const coords = getCoordinates();
    if (coords.length < 4) {
      setError('A polygon requires at least 3 unique points plus a closing point (minimum 4 coordinates). Please click more points on the map.');
      return;
    }

    try {
      setLoading(true);
      await createGeofence({
        name,
        description,
        coordinates: coords,
        category,
      });
      setName('');
      setDescription('');
      onClearDrawing();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create geofence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">Create New Geofence</h2>
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
            <label className="block text-slate-300 font-semibold mb-1">Geofence Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Delivery Zone"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Operational instructions for this zone..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GeofenceCategory)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="delivery_zone">Delivery Zone</option>
              <option value="restricted_zone">Restricted Zone (High Alert)</option>
              <option value="toll_zone">Toll Zone</option>
              <option value="customer_area">Customer Area</option>
            </select>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="font-semibold">Boundary Coordinates:</span>
              <span className="text-[11px] text-indigo-400 font-mono">
                {drawnPoints.length} vertices selected
              </span>
            </div>
            {drawnPoints.length >= 3 ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Ready to auto-close into polygon ({drawnPoints.length + 1} points)</span>
              </div>
            ) : (
              <p className="text-slate-400 text-[11px]">
                Click on the map behind this dialog to draw polygon points (need at least 3 points).
              </p>
            )}
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
              disabled={loading || drawnPoints.length < 3}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Creating...' : 'Save Geofence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
