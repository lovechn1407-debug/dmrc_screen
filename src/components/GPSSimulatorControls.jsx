import React, { useState } from 'react';
import { Play, Pause, FastForward, Navigation, Gauge, Radio, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

export default function GPSSimulatorControls({
  isSimulationMode,
  setIsSimulationMode,
  currentSpeedKmH,
  setCurrentSpeedKmH,
  forceArriveAtStation,
  forceDepartStation,
  currentStationIndex,
  setCurrentStationIndex,
  totalStations,
  thisStation,
  distanceToNextMeters,
  isDoorsOpen,
  isStationArrived,
  resetJourney
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAutoDrive, setIsAutoDrive] = useState(false);

  return (
    <div className="fixed bottom-3 right-3 z-40 font-dmrc max-w-sm w-full px-2">
      {/* Drawer Header Toggle */}
      <div className="bg-slate-900/90 text-white backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full animate-pulse ${isSimulationMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className="text-xs font-bold uppercase tracking-wider">
            {isSimulationMode ? 'GPS Simulator Mode' : 'Live Browser GPS'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-slate-800 text-pink-400 px-2 py-0.5 rounded border border-slate-700">
            {currentSpeedKmH.toFixed(0)} km/h
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls Drawer */}
      {isExpanded && (
        <div className="bg-slate-900/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-700 mt-2 flex flex-col gap-3 text-xs">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setIsSimulationMode(true)}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition ${isSimulationMode ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
            >
              <Radio className="w-3.5 h-3.5" /> Simulator
            </button>
            <button
              onClick={() => setIsSimulationMode(false)}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition ${!isSimulationMode ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
            >
              <Navigation className="w-3.5 h-3.5" /> Live Device GPS
            </button>
          </div>

          {isSimulationMode && (
            <>
              {/* Speed Controller Slider */}
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-pink-400" /> Speed Control:
                  </span>
                  <span className="font-mono font-bold text-pink-400">{currentSpeedKmH.toFixed(1)} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="1"
                  value={currentSpeedKmH}
                  onChange={(e) => setCurrentSpeedKmH(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              {/* Quick Action Simulation Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={forceArriveAtStation}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition shadow"
                >
                  🛑 Stop (0 km/h)
                </button>

                <button
                  onClick={forceDepartStation}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition shadow"
                >
                  🚀 Depart (35 km/h)
                </button>
              </div>

              {/* Station Navigation */}
              <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                <button
                  disabled={currentStationIndex <= 0}
                  onClick={() => setCurrentStationIndex(prev => Math.max(0, prev - 1))}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 disabled:opacity-40 font-bold"
                >
                  ◀ Prev
                </button>

                <span className="font-mono text-slate-300 text-[11px]">
                  Station {currentStationIndex + 1} / {totalStations}
                </span>

                <button
                  disabled={currentStationIndex >= totalStations - 1}
                  onClick={() => setCurrentStationIndex(prev => Math.min(totalStations - 1, prev + 1))}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 disabled:opacity-40 font-bold"
                >
                  Next ▶
                </button>
              </div>

              {/* Reset Journey Button */}
              <button
                onClick={resetJourney}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition text-[11px]"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Journey to Start
              </button>
            </>
          )}

        </div>
      )}
    </div>
  );
}
