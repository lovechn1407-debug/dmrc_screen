import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapConfig } from '../context/MapConfigContext';
import { haversineDistanceKm, generateBezierPath, calculatePathLengthKm } from '../utils/geoUtils';
import { Save, RotateCcw, MapPin, Shield, Route, Check, Layers, Sliders, Wand2, Undo2, X } from 'lucide-react';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function AdminPanel({ onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  const {
    mapConfig,
    updateStationPosition,
    updateStationCovering,
    addCurveControlPoint,
    updateCurveControlPoint,
    removeCurveControlPoint,
    analyzeLineTrack,
    undoTrackAnalysis,
    canUndoTrack,
    saveMapConfig,
    resetMapConfig
  } = useMapConfig();

  const [selectedStationId, setSelectedStationId] = useState(null);
  const [selectedLine, setSelectedLine] = useState('ALL');
  const [showCoveringCircles, setShowCoveringCircles] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [activeTab, setActiveTab] = useState('MAP'); // MAP, COVERING, CURVES
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [analyzeLineTarget, setAnalyzeLineTarget] = useState('ALL');
  const [toastMsg, setToastMsg] = useState('');

  const selectedStation = selectedStationId ? mapConfig.stations[selectedStationId] : null;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090], // Delhi Center
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | DMRC Route Editor',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Stations, Lines & Bezier Curves on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const stations = mapConfig.stations;
    const lines = mapConfig.lines;

    // Filter lines
    const activeLines = selectedLine === 'ALL'
      ? lines
      : lines.filter(l => l.name === selectedLine);

    // Render Lines and Curves
    activeLines.forEach(lineObj => {
      const color = lineObj.color || '#3388ff';
      const lineStations = lineObj.stations;

      for (let i = 0; i < lineStations.length - 1; i++) {
        const st1 = stations[lineStations[i].id] || lineStations[i];
        const st2 = stations[lineStations[i + 1].id] || lineStations[i + 1];

        if (!st1 || !st2) continue;

        const startPt = { lat: st1.lat, lng: st1.lng };
        const endPt = { lat: st2.lat, lng: st2.lng };

        const curveKey = `${st1.id}_${st2.id}`;
        const ctrlPoints = mapConfig.curveControlPoints[curveKey] || [];

        // Bezier Path calculation
        const pathPoints = generateBezierPath(startPt, ctrlPoints, endPt);
        const latLngs = pathPoints.map(p => [p.lat, p.lng]);

        // Draw Curved Polyline
        const polyline = L.polyline(latLngs, {
          color: color,
          weight: 5,
          opacity: 0.85,
          lineCap: 'round'
        }).addTo(layerGroup);

        const pathLengthKm = calculatePathLengthKm(pathPoints);
        polyline.bindTooltip(
          `<b>${lineObj.name}</b><br/>${st1.name} ➔ ${st2.name}<br/>Distance: ${pathLengthKm.toFixed(2)} km`,
          { sticky: true }
        );

        // Click line to add curve control point
        polyline.on('click', (e) => {
          if (activeTab === 'CURVES') {
            addCurveControlPoint(st1.id, st2.id, e.latlng.lat, e.latlng.lng);
            showToast('Bezier control point added!');
          }
        });

        // Render Dashed Bezier Guide Lines & Control Point Handles
        ctrlPoints.forEach((ctrl, ctrlIdx) => {
          // Dashed guide lines: Station A ➔ Control ➔ Station B
          L.polyline([[st1.lat, st1.lng], [ctrl.lat, ctrl.lng], [st2.lat, st2.lng]], {
            color: '#FF59B3',
            weight: 2,
            dashArray: '6, 6',
            opacity: 0.75
          }).addTo(layerGroup);

          // Bezier Control Handle Marker
          const ctrlMarker = L.marker([ctrl.lat, ctrl.lng], {
            draggable: true,
            icon: L.divIcon({
              className: 'custom-curve-handle',
              html: `
                <div style="
                  background-color: #FF59B3;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 0 8px rgba(255, 89, 179, 0.9);
                  cursor: move;
                "></div>
              `,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          }).addTo(layerGroup);

          ctrlMarker.on('drag', (ev) => {
            const newPos = ev.target.getLatLng();
            updateCurveControlPoint(st1.id, st2.id, ctrlIdx, newPos.lat, newPos.lng);
          });

          ctrlMarker.bindPopup(`
            <div class="p-1 text-xs">
              <p class="font-bold text-slate-800 mb-1">Bezier Control Point #${ctrlIdx + 1}</p>
              <p class="text-[10px] text-slate-500 mb-2">${st1.name} ➔ ${st2.name}</p>
              <button id="del-handle-${st1.id}-${st2.id}-${ctrlIdx}" style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; width: 100%;">Remove Control Point</button>
            </div>
          `);

          ctrlMarker.on('popupopen', () => {
            const btn = document.getElementById(`del-handle-${st1.id}-${st2.id}-${ctrlIdx}`);
            if (btn) {
              btn.onclick = () => {
                removeCurveControlPoint(st1.id, st2.id, ctrlIdx);
                map.closePopup();
                showToast('Control point removed');
              };
            }
          });
        });
      }
    });

    // Render Station Markers & Geofences
    Object.values(stations).forEach(st => {
      if (selectedLine !== 'ALL' && st.line !== selectedLine) return;

      const isSelected = selectedStationId === st.id;
      const lineColor = mapConfig.lineColors[st.line] || '#FF55B0';

      // Station covering circle
      if (showCoveringCircles || isSelected) {
        L.circle([st.lat, st.lng], {
          radius: st.coveringRadius || 300,
          color: isSelected ? '#00FF66' : lineColor,
          fillColor: isSelected ? '#00FF66' : lineColor,
          fillOpacity: isSelected ? 0.25 : 0.1,
          weight: isSelected ? 2 : 1,
          dashArray: isSelected ? null : '4, 4'
        }).addTo(layerGroup);
      }

      // Station Marker
      const stationIcon = L.divIcon({
        className: 'custom-station-marker',
        html: `
          <div style="
            background: ${lineColor};
            width: ${isSelected ? '22px' : '14px'};
            height: ${isSelected ? '22px' : '14px'};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 ${isSelected ? '12px #00FF66' : '4px rgba(0,0,0,0.4)'};
            transition: all 0.2s ease;
          "></div>
        `,
        iconSize: [isSelected ? 22 : 14, isSelected ? 22 : 14],
        iconAnchor: [isSelected ? 11 : 7, isSelected ? 11 : 7]
      });

      const marker = L.marker([st.lat, st.lng], {
        draggable: true,
        icon: stationIcon
      }).addTo(layerGroup);

      marker.on('click', () => {
        setSelectedStationId(st.id);
      });

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        updateStationPosition(st.id, lat, lng);
      });

      marker.bindTooltip(`<b>${st.name}</b><br/>${st.line}`, {
        permanent: false,
        direction: 'top'
      });
    });

  }, [mapConfig, selectedLine, selectedStationId, showCoveringCircles, activeTab]);

  const handleSave = () => {
    saveMapConfig();
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleRunTrackAnalysis = () => {
    analyzeLineTrack(analyzeLineTarget);
    setShowAnalyzeModal(false);
    showToast(`Track Analyzed & Curved for ${analyzeLineTarget}!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 bg-opacity-95 flex flex-col font-dmrc overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-dmrc-sidebar text-white px-4 py-3 flex items-center justify-between shadow-lg border-b border-purple-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">DMRC Admin Route & Track Editor</h1>
            <p className="text-xs text-pink-300">Drag stations, adjust radii & analyze track curves</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {toastMsg && (
            <div className="bg-purple-900 text-pink-200 text-xs px-3 py-1.5 rounded-full border border-pink-500/40 animate-pulse">
              {toastMsg}
            </div>
          )}

          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-full shadow-md">
              <Check className="w-4 h-4" /> Map Saved & Synced!
            </div>
          )}

          {/* Analyze Track Button */}
          <button
            onClick={() => setShowAnalyzeModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-lg border border-pink-400/40"
          >
            <Wand2 className="w-4 h-4" /> Analyze Track from Map
          </button>

          {/* Undo Button */}
          <button
            onClick={undoTrackAnalysis}
            disabled={!canUndoTrack}
            title="Revert / Undo Last Track Curve Action"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-40"
          >
            <Undo2 className="w-4 h-4" /> Undo
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg"
          >
            <Save className="w-4 h-4" /> Save Map
          </button>

          <button
            onClick={resetMapConfig}
            title="Reset to Original CSV Data"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-2 rounded-xl transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>

          <button
            onClick={onClose}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow"
          >
            Exit Admin
          </button>
        </div>
      </header>

      {/* Main Body Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Control Sidebar */}
        <aside className="w-full md:w-80 bg-slate-800 text-slate-100 p-4 flex flex-col gap-4 shadow-xl border-r border-slate-700 overflow-y-auto">
          {/* Editor Mode Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('MAP')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition ${activeTab === 'MAP' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <MapPin className="w-3.5 h-3.5" /> Move
            </button>
            <button
              onClick={() => setActiveTab('COVERING')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition ${activeTab === 'COVERING' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Shield className="w-3.5 h-3.5" /> Covering
            </button>
            <button
              onClick={() => setActiveTab('CURVES')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition ${activeTab === 'CURVES' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Sliders className="w-3.5 h-3.5" /> Bezier Curves
            </button>
          </div>

          {/* Line Filter */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700">
            <label className="text-xs font-bold text-pink-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Filter Metro Line
            </label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-slate-100 text-xs rounded-lg p-2 focus:ring-2 focus:ring-pink-500 outline-none"
            >
              <option value="ALL">All Metro Lines (285 Stations)</option>
              {mapConfig.lines.map(line => (
                <option key={line.name} value={line.name}>
                  {line.name} ({line.stations.length} stations)
                </option>
              ))}
            </select>
          </div>

          {/* Mode Guidance */}
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700 text-xs text-slate-300">
            {activeTab === 'MAP' && (
              <p>📍 <b>Drag Station Markers</b> directly on the map to adjust exact GPS coordinates.</p>
            )}
            {activeTab === 'COVERING' && (
              <p>🛡️ <b>Station Covering Range</b>: Select a station to adjust its geofence radius slider.</p>
            )}
            {activeTab === 'CURVES' && (
              <p>〰️ <b>Bezier Curve Mode</b>: Click on any track line to add a pink Bezier control point, then drag the control handle to curve the line path!</p>
            )}
          </div>

          {/* Selected Station Details & Adjustments */}
          {selectedStation ? (
            <div className="bg-slate-900 p-4 rounded-xl border border-pink-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">Selected Station</span>
                <span className="text-[10px] bg-pink-900/60 text-pink-200 px-2 py-0.5 rounded-full font-mono">ID: {selectedStation.id}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{selectedStation.name}</h3>
                <p className="text-xs text-slate-400">{selectedStation.hindiName} ({selectedStation.line})</p>
              </div>

              {/* Position Inputs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block text-[10px]">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={selectedStation.lat}
                    onChange={(e) => updateStationPosition(selectedStation.id, parseFloat(e.target.value) || selectedStation.lat, selectedStation.lng)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-[10px]">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={selectedStation.lng}
                    onChange={(e) => updateStationPosition(selectedStation.id, selectedStation.lat, parseFloat(e.target.value) || selectedStation.lng)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Station Covering Radius Slider */}
              <div className="pt-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Station Covering Radius:</span>
                  <span className="text-emerald-400 font-bold font-mono">{selectedStation.coveringRadius || 300} meters</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={selectedStation.coveringRadius || 300}
                  onChange={(e) => updateStationCovering(selectedStation.id, parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">Defines starting & ending bounds of station arrival zone.</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700 text-center text-xs text-slate-400">
              Click any station marker on the map to view details.
            </div>
          )}

          {/* Visibility Toggles */}
          <div className="mt-auto pt-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-300">
            <span>Show Station Covering Circles</span>
            <input
              type="checkbox"
              checked={showCoveringCircles}
              onChange={(e) => setShowCoveringCircles(e.target.checked)}
              className="accent-pink-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </aside>

        {/* Map View Canvas */}
        <main className="flex-1 h-full w-full relative bg-slate-950">
          <div ref={mapContainerRef} className="h-full w-full z-10" />
        </main>
      </div>

      {/* Analyze Track Modal */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-pink-400" />
                <h3 className="text-lg font-bold text-white">Analyze Track from Map</h3>
              </div>
              <button
                onClick={() => setShowAnalyzeModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select a metro line below. The system will analyze the track lining across all stations and automatically generate smooth Bezier curves and bends along the real geographic route.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-pink-400 uppercase tracking-wider">Select Line to Analyze</label>
              <select
                value={analyzeLineTarget}
                onChange={(e) => setAnalyzeLineTarget(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="ALL">All Metro Lines</option>
                {mapConfig.lines.map(line => (
                  <option key={line.name} value={line.name}>
                    {line.name} ({line.stations.length} Stations)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleRunTrackAnalysis}
                className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Wand2 className="w-4 h-4" /> Analyze & Align Track
              </button>
              <button
                onClick={() => setShowAnalyzeModal(false)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
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
