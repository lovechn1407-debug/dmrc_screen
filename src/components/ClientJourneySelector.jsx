import React, { useState } from 'react';
import { Train, MapPin, Navigation, CheckCircle2, ShieldCheck, Settings } from 'lucide-react';

export default function ClientJourneySelector({
  lines,
  onStartJourney,
  onOpenAdmin
}) {
  const [selectedLineName, setSelectedLineName] = useState(lines[0]?.name || 'Yellow line');
  const [fromStationId, setFromStationId] = useState('');
  const [toStationId, setToStationId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentLine = lines.find(l => l.name === selectedLineName) || lines[0];
  const stations = currentLine?.stations || [];

  const handleLineChange = (lineName) => {
    setSelectedLineName(lineName);
    const lineObj = lines.find(l => l.name === lineName);
    if (lineObj && lineObj.stations.length >= 2) {
      setFromStationId(lineObj.stations[0].id.toString());
      setToStationId(lineObj.stations[lineObj.stations.length - 1].id.toString());
    }
  };

  // Default selection on mount if empty
  React.useEffect(() => {
    if (stations.length >= 2 && (!fromStationId || !toStationId)) {
      setFromStationId(stations[0].id.toString());
      setToStationId(stations[stations.length - 1].id.toString());
    }
  }, [stations, fromStationId, toStationId]);

  const fromStation = stations.find(s => s.id.toString() === fromStationId.toString());
  const toStation = stations.find(s => s.id.toString() === toStationId.toString());

  const handleCalculateRoute = () => {
    if (!fromStation || !toStation || fromStation.id === toStation.id) return;
    setShowConfirmModal(true);
  };

  const confirmAndLaunch = () => {
    const fromIndex = stations.findIndex(s => s.id.toString() === fromStationId.toString());
    const toIndex = stations.findIndex(s => s.id.toString() === toStationId.toString());

    let routeSequence = [];
    if (fromIndex <= toIndex) {
      routeSequence = stations.slice(fromIndex, toIndex + 1);
    } else {
      routeSequence = stations.slice(toIndex, fromIndex + 1).reverse();
    }

    onStartJourney({
      line: currentLine,
      fromStation,
      toStation,
      routeStations: routeSequence
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-dmrc relative overflow-hidden">
      
      {/* Background Graphic Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Admin Button Top Right */}
      <button
        onClick={onOpenAdmin}
        className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-800 text-pink-400 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg z-20"
      >
        <Settings className="w-4 h-4" /> Admin Route Editor
      </button>

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-6 relative z-10">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-purple-800 flex items-center justify-center shadow-lg shadow-pink-500/20 mb-3">
            <Train className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">DMRC Portable Screen</h1>
          <p className="text-xs text-slate-400 mt-1">Select your route & experience live in-train screen</p>
        </div>

        {/* Route Form */}
        <div className="flex flex-col gap-4">
          
          {/* Select Line */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" /> Metro Line
            </label>
            <select
              value={selectedLineName}
              onChange={(e) => handleLineChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition"
            >
              {lines.map(l => (
                <option key={l.name} value={l.name}>
                  {l.name} ({l.stations.length} Stations)
                </option>
              ))}
            </select>
          </div>

          {/* From Station */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Boarding Station (From)
            </label>
            <select
              value={fromStationId}
              onChange={(e) => setFromStationId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              {stations.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.hindiName})
                </option>
              ))}
            </select>
          </div>

          {/* To Station */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Destination Station (To)
            </label>
            <select
              value={toStationId}
              onChange={(e) => setToStationId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-500 transition"
            >
              {stations.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.hindiName})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Start Journey CTA Button */}
        <button
          onClick={handleCalculateRoute}
          disabled={!fromStation || !toStation || fromStation.id === toStation.id}
          className="w-full py-4 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-pink-600/30 transition disabled:opacity-40 disabled:pointer-events-none tracking-wide"
        >
          Confirm Route & Start
        </button>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Confirm Train Boarding</h2>
              <p className="text-xs text-slate-300 mt-1">
                Are you inside the train on the <b>{selectedLineName}</b> from <b>{fromStation?.name}</b> to <b>{toStation?.name}</b>?
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                onClick={confirmAndLaunch}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> YES, I AM IN THE TRAIN
              </button>

              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
