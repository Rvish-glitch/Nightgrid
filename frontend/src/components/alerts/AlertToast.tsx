import React, { useEffect, useState } from 'react';
import { WebSocketAlertMessage } from '../../types';
import { ShieldAlert, X } from 'lucide-react';

interface AlertToastProps {
  latestAlert: WebSocketAlertMessage | null;
}

export const AlertToast: React.FC<AlertToastProps> = ({ latestAlert }) => {
  const [visible, setVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<WebSocketAlertMessage | null>(null);

  useEffect(() => {
    if (latestAlert) {
      setCurrentAlert(latestAlert);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [latestAlert]);

  if (!visible || !currentAlert) return null;

  const isRestricted = currentAlert.geofence.category === 'restricted_zone';

  return (
    <div className="fixed top-5 right-5 z-[2000] max-w-md w-full animate-bounce-in">
      <div
        className={`p-4 rounded-xl border shadow-2xl backdrop-blur-xl ${
          isRestricted
            ? 'bg-red-950/90 border-red-500 text-red-100'
            : 'bg-amber-950/90 border-amber-500 text-amber-100'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                {isRestricted ? 'RESTRICTED ZONE VIOLATION' : 'GEOFENCE ALERT'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                Vehicle <strong className="text-white">{currentAlert.vehicle.vehicle_number}</strong> has{' '}
                <span className="uppercase font-semibold underline">{currentAlert.event_type}ed</span>{' '}
                <strong className="text-white">{currentAlert.geofence.geofence_name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="p-1 rounded-md hover:bg-white/10 transition text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-2 border-t border-white/10 flex justify-between text-[11px] text-white/80">
          <span>Driver: {currentAlert.vehicle.driver_name}</span>
          <span>{new Date(currentAlert.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
