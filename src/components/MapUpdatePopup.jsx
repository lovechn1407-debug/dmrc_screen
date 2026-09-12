import React from 'react';
import { useMapConfig } from '../context/MapConfigContext';
import { AlertCircle, Download, Check } from 'lucide-react';

export default function MapUpdatePopup() {
  const { hasMapUpdatePending, acceptMapUpdate } = useMapConfig();

  if (!hasMapUpdatePending) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] font-dmrc animate-bounce">
      <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-purple-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-pink-400 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-pink-500 rounded-xl shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white leading-tight">
              Map Data Updated by Admin!
            </h3>
            <p className="text-xs text-pink-200 mt-1">
              The admin modified station coordinates, curves, or covering boundaries. Save the new map offline now?
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={acceptMapUpdate}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg"
          >
            <Download className="w-4 h-4" /> Update & Save Offline
          </button>
        </div>
      </div>
    </div>
  );
}
