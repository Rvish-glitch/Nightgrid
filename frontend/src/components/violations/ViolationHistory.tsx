import React, { useState, useEffect } from 'react';
import { Violation, Geofence, Vehicle } from '../../types';
import { getViolationHistory } from '../../api/client';
import { History, Filter, ArrowRightCircle, ArrowLeftCircle, Calendar, RefreshCw } from 'lucide-react';

interface ViolationHistoryProps {
  geofences: Geofence[];
  vehicles: Vehicle[];
}

export const ViolationHistory: React.FC<ViolationHistoryProps> = ({ geofences, vehicles }) => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedGeofence, setSelectedGeofence] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(50);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getViolationHistory({
        vehicle_id: selectedVehicle || undefined,
        geofence_id: selectedGeofence || undefined,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        limit,
      });
      setViolations(res.violations || []);
      setTotalCount(res.total_count || 0);
    } catch (err) {
      console.error('Failed to load violation history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedVehicle, selectedGeofence, limit]);

  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-5 border border-slate-700 shadow-xl text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-sm tracking-wide">Historical Geofence Violations</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
            {totalCount} Total Events
          </span>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Filter by Vehicle</label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicle_number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Filter by Geofence</label>
          <select
            value={selectedGeofence}
            onChange={(e) => setSelectedGeofence(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
          >
            <option value="">All Geofences</option>
            {geofences.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Violations Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
            <tr>
              <th className="py-2.5 px-3">Event</th>
              <th className="py-2.5 px-3">Vehicle</th>
              <th className="py-2.5 px-3">Geofence Zone</th>
              <th className="py-2.5 px-3">Coordinates</th>
              <th className="py-2.5 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 font-mono text-[11px]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Loading violation history...
                </td>
              </tr>
            ) : violations.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                  No violation records match the active criteria.
                </td>
              </tr>
            ) : (
              violations.map((viol) => {
                const isEntry = viol.event_type === 'entry';
                return (
                  <tr key={viol.id} className="hover:bg-slate-750/50 transition">
                    <td className="py-2.5 px-3 font-semibold">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase ${
                          isEntry ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {isEntry ? <ArrowRightCircle className="w-3 h-3" /> : <ArrowLeftCircle className="w-3 h-3" />}
                        {viol.event_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white font-sans font-semibold">
                      {viol.vehicle_number}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">
                      {viol.geofence_name}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300">
                      [{viol.latitude.toFixed(4)}, {viol.longitude.toFixed(4)}]
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans">
                      {new Date(viol.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
