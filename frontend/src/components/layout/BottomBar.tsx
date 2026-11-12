import React from 'react';
import { Activity, ShieldCheck, Radio } from 'lucide-react';

interface BottomBarProps {
  wsConnected: boolean;
}

export const BottomBar: React.FC<BottomBarProps> = ({ wsConnected }) => {
  return (
    <footer className="h-7 bg-[#060a12] border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] font-mono text-slate-500 z-30 select-none">
      {/* Left: System Status (No duplicate navigation buttons) */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Engine Status: Nominal</span>
        </span>
        <span className="text-slate-700">•</span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Spatial Point-in-Polygon Active</span>
        </span>
        <span className="text-slate-700">•</span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span>{wsConnected ? 'Live Feed Connected' : 'Connecting...'}</span>
        </span>
      </div>

      {/* Right: API Specs Link & Version */}
      <div className="flex items-center gap-3 text-slate-500">
        <a
          href="http://localhost:8080/swagger"
          target="_blank"
          rel="noreferrer"
          className="text-cyan-400/90 hover:text-cyan-300 cursor-pointer transition font-bold"
        >
          Interactive API Specs (/swagger)
        </a>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400 font-bold">NIGHTGRID v2.4.1</span>
      </div>
    </footer>
  );
};
