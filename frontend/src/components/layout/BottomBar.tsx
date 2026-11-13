import React from 'react';

export const BottomBar: React.FC = () => {
  return (
    <footer className="h-6 bg-[#060a12] border-t border-slate-800/80 px-4 flex items-center justify-end text-[11px] font-mono z-30 select-none">
      <a
        href="http://localhost:8080/swagger"
        target="_blank"
        rel="noreferrer"
        className="text-cyan-400/90 hover:text-cyan-300 cursor-pointer transition font-bold"
      >
        Interactive API Specs (/swagger)
      </a>
    </footer>
  );
};
