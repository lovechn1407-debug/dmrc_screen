import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapConfig } from '../context/MapConfigContext';
import { haversineDistanceKm, generateBezierPath, calculatePathLengthKm } from '../utils/geoUtils';
import { Save, RotateCcw, MapPin, Shield, Route, Check, Layers, Sliders } from 'lucide-react';

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
    saveMapConfig,
    resetMapConfig
  } = useMapConfig();

  const [selectedStationId, setSelectedStationId] = useState(null);
  const [selectedLine, setSelectedLine] = useState('ALL');
  const [showCoveringCircles, setShowCoveringCircles] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [activeTab, setActiveTab] = useState('MAP'); // MAP, COVERING, CURVES

  const selectedStation = selectedStationId ? mapConfig.stations[selectedStationId] : null;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090], // Delhi Center
      zoom: 12,
      zoomControl: true
    });

    // Dark styled or OpenStreetMap tiles
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

  // Render Stations & Lines on Map
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

        // Bezier or Polyline points
        const pathPoints = generateBezierPath(startPt, ctrlPoints, endPt);
        const latLngs = pathPoints.map(p => [p.lat, p.lng]);

        // Draw Line Polyline
        const polyline = L.polyline(latLngs, {
          color: color,
          weight: 5,
          opacity: 0.85,
          lineCap: 'round'
        }).addTo(layerGroup);

        const pathLengthKm = calculatePathLengthKm(pathPoints);
        polyline.bindTooltip(
          `<b>${lineObj.name}</b><br/>${st1.name} ➔ ${st2.name}<br/>Length: ${pathLengthKm.toFixed(2)} km`,
          { sticky: true }
        );

        // Click line to add curve bend point
        polyline.on('click', (e) => {
          if (activeTab === 'CURVES') {
            addCurveControlPoint(st1.id, st2.id, e.latlng.lat, e.latlng.lng);
          }
        });

        // Render Curve Control Handles if activeTab === CURVES
        ctrlPoints.forEach((ctrl, ctrlIdx) => {
          const ctrlMarker = L.marker([ctrl.lat, ctrl.lng], {
            draggable: true,
            icon: L.divIcon({
              className: 'custom-curve-handle',
              html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); cursor: move;"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            })
          }).addTo(layerGroup);

          ctrlMarker.on('dragend', (ev) => {
            const newPos = ev.target.getLatLng();
            updateCurveControlPoint(st1.id, st2.id, ctrlIdx, newPos.lat, newPos.lng);
          });

          ctrlMarker.bindPopup(`
            <div class="text-xs">
              <p><b>Curve Handle #${ctrlIdx + 1}</b></p>
              <button id="del-handle-${st1.id}-${st2.id}-${ctrlIdx}" style="background: red; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-top: 4px;">Delete Handle</button>
            </div>
          `);

          ctrlMarker.on('popupopen', () => {
            const btn = document.getElementById(`del-handle-${st1.id}-${st2.id}-${ctrlIdx}`);
            if (btn) {
              btn.onclick = () => {
                removeCurveControlPoint(st1.id, st2.id, ctrlIdx);
                map.closePopup();
              };
            }
          });
        });
      }
    });

    // Render Station Markers & Covering Geofences
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
            width: ${isSelected ? '20px' : '14px'};
            height: ${isSelected ? '20px' : '14px'};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 ${isSelected ? '10px #00FF66' : '4px rgba(0,0,0,0.4)'};
            transition: all 0.2s ease;
          "></div>
        `,
        iconSize: [isSelected ? 20 : 14, isSelected ? 20 : 14],
        iconAnchor: [isSelected ? 10 : 7, isSelected ? 10 : 7]
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 bg-opacity-95 flex flex-col font-dmrc overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-dmrc-sidebar text-white px-4 py-3 flex items-center justify-between shadow-lg border-b border-purple-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">DMRC Admin Route & Geometry Editor</h1>
            <p className="text-xs text-pink-300">Drag stations, adjust covering radii & bend curve lines</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-full animate-bounce shadow-md">
              <Check className="w-4 h-4" /> Map Saved & Broadcasted!
            </div>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-lg"
          >
            <Save className="w-4 h-4" /> Save Map
          </button>

          <button
            onClick={resetMapConfig}
            title="Reset to Original CSV Data"
            className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-2 rounded-xl transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset Defaults
          </button>

          <button
            onClick={onClose}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition shadow"
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
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition ${activeTab === 'MAP' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <MapPin className="w-3.5 h-3.5" /> Move
            </button>
            <button
              onClick={() => setActiveTab('COVERING')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition ${activeTab === 'COVERING' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Shield className="w-3.5 h-3.5" /> Covering
            </button>
            <button
              onClick={() => setActiveTab('CURVES')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition ${activeTab === 'CURVES' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Sliders className="w-3.5 h-3.5" /> Bend Curves
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

          {/* Tab Specific Instructions */}
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700 text-xs text-slate-300">
            {activeTab === 'MAP' && (
              <p>💡 <b>Drag Station Markers</b> directly on the map to adjust exact GPS latitude and longitude coordinates.</p>
            )}
            {activeTab === 'COVERING' && (
              <p>🛡️ <b>Station Covering Range</b>: Select a station on map to adjust its geofence detection radius in meters.</p>
            )}
            {activeTab === 'CURVES' && (
              <p>〰️ <b>Bend Curve Path</b>: Click directly on any line segment on the map to spawn a control handle point, then drag it to curve the line path!</p>
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
                <p className="text-[10px] text-slate-400 mt-1">Defines starting and ending bounds of arrival zone.</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700 text-center text-xs text-slate-400">
              Click any station marker on the map to view & edit details.
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
    </div>
  );
}
