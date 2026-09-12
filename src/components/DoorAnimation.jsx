import React from 'react';

export default function DoorAnimation({ isOpen, statusText }) {
  return (
    <div className="relative w-full aspect-[4/3] bg-slate-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-400/50">
      {/* Background Portal Glow when doors are open */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 flex items-center justify-center transition-opacity duration-700 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-300 via-emerald-500 to-emerald-700 animate-pulseGlow" />
        <span className="absolute text-slate-900 font-extrabold text-[10px] md:text-xs uppercase tracking-widest bg-emerald-300/80 px-2 py-0.5 rounded shadow">
          {statusText || 'DOORS OPEN'}
        </span>
      </div>

      {/* Left Door Panel */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 border-r-2 border-slate-600 transition-transform duration-1000 ease-in-out z-10 shadow-lg flex flex-col items-end justify-center pr-1"
        style={{
          transform: isOpen ? 'translateX(-85%)' : 'translateX(0%)',
        }}
      >
        {/* Door Window */}
        <div className="w-3/4 h-2/5 bg-slate-100 border-2 border-slate-500 rounded-lg shadow-inner mb-4 mt-2" />
        {/* Door Handle */}
        <div className="w-1.5 h-10 bg-slate-800 rounded-full mr-1 shadow-md" />
      </div>

      {/* Right Door Panel */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-slate-300 via-slate-200 to-slate-300 border-l-2 border-slate-600 transition-transform duration-1000 ease-in-out z-10 shadow-lg flex flex-col items-start justify-center pl-1"
        style={{
          transform: isOpen ? 'translateX(85%)' : 'translateX(0%)',
        }}
      >
        {/* Door Window */}
        <div className="w-3/4 h-2/5 bg-slate-100 border-2 border-slate-500 rounded-lg shadow-inner mb-4 mt-2" />
        {/* Door Handle */}
        <div className="w-1.5 h-10 bg-slate-800 rounded-full ml-1 shadow-md" />
      </div>
    </div>
  );
}
