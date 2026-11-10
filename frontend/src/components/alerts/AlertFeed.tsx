import React from 'react';
import { WebSocketAlertMessage } from '../../types';
import { AlertTriangle, ArrowRightCircle, ArrowLeftCircle, Clock, MapPin, Radio } from 'lucide-react';

interface AlertFeedProps {
  alerts: WebSocketAlertMessage[];
  isConnected: boolean;
  onClear: () => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({ alerts, isConnected, onClear }) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-4 border border-slate-700 flex flex-col h-full shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className={`w-5 h-5 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`} />
            <span
              className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'
              }`}
            />
          </div>
          <h2 className="font-semibold text-slate-100 text-sm">Real-Time Alert Feed</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
            {isConnected ? 'LIVE /ws/alerts' : 'CONNECTING...'}
          </span>
        </div>
        {alerts.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 max-h-[380px]">
        {alerts.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs">
            <AlertTriangle className="w-8 h-8 stroke-1 mb-2 text-slate-600" />
            <p>No alerts received yet</p>
            <p className="text-[11px] text-slate-600 mt-1">Move a vehicle into a restricted zone to trigger alerts</p>
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const isEntry = alert.event_type === 'entry';
            const isRestricted = alert.geofence.category === 'restricted_zone';

            return (
              <div
                key={alert.event_id || idx}
                className={`p-3 rounded-lg border transition-all text-xs ${
                  isRestricted
                    ? 'bg-red-950/40 border-red-700/60 text-red-200'
                    : 'bg-slate-750/70 border-slate-600/50 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <div className="flex items-center gap-1.5">
                    {isEntry ? (
                      <ArrowRightCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowLeftCircle className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="capitalize font-bold text-white tracking-wide">
                      {alert.event_type} EVENT
                    </span>
                    {isRestricted && (
                      <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[10px] uppercase font-bold tracking-wider">
                        RESTRICTED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] mt-2">
                  <div>
                    <span className="text-slate-400">Vehicle:</span>{' '}
                    <strong className="text-white">{alert.vehicle.vehicle_number}</strong>
                    <div className="text-slate-400 text-[10px]">({alert.vehicle.driver_name})</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Zone:</span>{' '}
                    <strong className="text-white">{alert.geofence.geofence_name}</strong>
                    <div className="text-slate-400 text-[10px] capitalize">
                      {alert.geofence.category.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-700/60">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>
                    Location: [{alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}]
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
