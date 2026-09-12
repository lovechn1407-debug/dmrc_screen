import React, { useState } from 'react';
import { MapConfigProvider, useMapConfig } from './context/MapConfigContext';
import { useMetroGPS } from './hooks/useMetroGPS';
import ClientJourneySelector from './components/ClientJourneySelector';
import DMRCScreen from './components/DMRCScreen';
import GPSSimulatorControls from './components/GPSSimulatorControls';
import AdminPanel from './components/AdminPanel';
import MapUpdatePopup from './components/MapUpdatePopup';
import { ArrowLeft, Settings, Navigation } from 'lucide-react';

function AppContent() {
  const { mapConfig } = useMapConfig();
  const [appMode, setAppMode] = useState('ROUTE_SELECT'); // ROUTE_SELECT, IN_JOURNEY, ADMIN
  const [activeJourney, setActiveJourney] = useState(null);

  const gps = useMetroGPS({
    routeStations: activeJourney?.routeStations || [],
    mapStations: mapConfig.stations,
    isJourneyActive: appMode === 'IN_JOURNEY'
  });

  const handleStartJourney = (journeyData) => {
    setActiveJourney(journeyData);
    gps.resetJourney();
    setAppMode('IN_JOURNEY');
  };

  const handleEndJourney = () => {
    setActiveJourney(null);
    setAppMode('ROUTE_SELECT');
  };

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col font-dmrc overflow-hidden relative">
      
      {/* Broadcast Map Update Notification Popup */}
      <MapUpdatePopup />

      {/* Admin Overlay Panel */}
      {appMode === 'ADMIN' && (
        <AdminPanel onClose={() => setAppMode(activeJourney ? 'IN_JOURNEY' : 'ROUTE_SELECT')} />
      )}

      {/* Route Selector Screen */}
      {appMode === 'ROUTE_SELECT' && (
        <ClientJourneySelector
          lines={mapConfig.lines}
          onStartJourney={handleStartJourney}
          onOpenAdmin={() => setAppMode('ADMIN')}
        />
      )}

      {/* Live DMRC Passenger Display Screen */}
      {appMode === 'IN_JOURNEY' && (
        <div className="w-full h-full flex flex-col relative bg-slate-950 p-2 md:p-6 overflow-y-auto">
          
          {/* Passenger Navigation Top Header Bar */}
          <div className="max-w-6xl mx-auto w-full mb-3 flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl shadow-xl backdrop-blur">
            <button
              onClick={handleEndJourney}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" /> Change Route
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Journey: <b>{activeJourney?.fromStation?.name}</b> ➔ <b>{activeJourney?.toStation?.name}</b></span>
            </div>

            <button
              onClick={() => setAppMode('ADMIN')}
              className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow"
            >
              <Settings className="w-4 h-4" /> Admin
            </button>
          </div>

          {/* DMRC In-Train Screen Component */}
          <div className="flex-1 flex items-center justify-center w-full">
            <DMRCScreen
              nextStation={gps.nextStation}
              thisStation={gps.thisStation}
              destinationStation={gps.destinationStation}
              nextInterchange={gps.thisStation?.connInfo?.length ? { name: gps.thisStation.connInfo.join(', ') } : null}
              isStationArrived={gps.isStationArrived}
              isDoorsOpen={gps.isDoorsOpen}
              doorStatusText={gps.doorStatusText}
              currentSpeedKmH={gps.currentSpeedKmH}
              lineColor={activeJourney?.line?.color}
              lineName={activeJourney?.line?.name}
              distanceToNextMeters={gps.distanceToNextMeters}
            />
          </div>

          {/* Floating GPS & Simulator Controls Drawer */}
          <GPSSimulatorControls
            isSimulationMode={gps.isSimulationMode}
            setIsSimulationMode={gps.setIsSimulationMode}
            currentSpeedKmH={gps.currentSpeedKmH}
            setCurrentSpeedKmH={gps.setCurrentSpeedKmH}
            forceArriveAtStation={gps.forceArriveAtStation}
            forceDepartStation={gps.forceDepartStation}
            currentStationIndex={gps.currentStationIndex}
            setCurrentStationIndex={gps.setCurrentStationIndex}
            totalStations={activeJourney?.routeStations?.length || 1}
            thisStation={gps.thisStation}
            distanceToNextMeters={gps.distanceToNextMeters}
            isDoorsOpen={gps.isDoorsOpen}
            isStationArrived={gps.isStationArrived}
            resetJourney={gps.resetJourney}
          />
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <MapConfigProvider>
      <AppContent />
    </MapConfigProvider>
  );
}
