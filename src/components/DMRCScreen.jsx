import React, { useState, useEffect } from 'react';
import DoorAnimation from './DoorAnimation';
import { Volume2, VolumeX, Globe } from 'lucide-react';

export default function DMRCScreen({
  targetStation,
  destinationStation,
  nextInterchange,
  isStationArrived,
  isDoorsOpen,
  doorStatusText,
  currentSpeedKmH,
  lineColor,
  lineName,
  distanceToNextMeters
}) {
  const [lang, setLang] = useState('EN'); // 'EN' or 'HI'
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Auto toggle language every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLang(prev => (prev === 'EN' ? 'HI' : 'EN'));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Update clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDateStr(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayTargetStation = lang === 'HI' ? (targetStation?.hindiName || targetStation?.name) : targetStation?.name;
  const displayDestination = lang === 'HI' ? (destinationStation?.hindiName || destinationStation?.name) : destinationStation?.name;
  
  let displayInterchange = 'NONE';
  if (nextInterchange) {
    displayInterchange = lang === 'HI' ? (nextInterchange?.hindiName || nextInterchange?.name) : nextInterchange?.name;
  }

  // Titles based on language and state
  const headerTitle = isStationArrived
    ? (lang === 'HI' ? 'सूचना' : 'INFORMATION')
    : (lang === 'HI' ? 'अगला स्टेशन' : 'NEXT STATION');

  const interchangeLabel = lang === 'HI' ? 'अगली लाइन के लिए' : 'NEXT INTERCHANGE';
  const destinationLabel = lang === 'HI' ? 'आखिरी स्टेशन' : 'DESTINATION STATION';

  const doorStatusDisplay = lang === 'HI'
    ? (isDoorsOpen ? 'दरवाजे खुल रहे हैं / बंद हो रहे हैं' : 'दरवाजे बंद हैं')
    : (doorStatusText || (isDoorsOpen ? 'DOORS OPENING / CLOSING' : 'DOORS CLOSED'));

  return (
    <div className="w-full h-full min-h-[520px] max-w-6xl mx-auto bg-dmrc-pinkBg flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden font-dmrc border-4 border-purple-950 select-none">
      
      {/* LEFT SIDEBAR PANEL (Purple Theme) */}
      <aside className="w-full md:w-[320px] bg-dmrc-sidebar text-white p-4 flex flex-col justify-between gap-3 border-b-4 md:border-b-0 md:border-r-4 border-purple-950 shrink-0">
        
        {/* Door Animation & Clean Clock Card */}
        <div className="flex flex-col gap-2">
          <DoorAnimation isOpen={isDoorsOpen} statusText={doorStatusDisplay} />
          
          <div className="flex justify-between items-center px-2 py-1 text-xs font-mono tracking-wider text-purple-200 bg-purple-950/60 rounded-lg border border-purple-800/40">
            <span className="whitespace-nowrap font-bold">{currentTimeStr || '06:00:00 PM'}</span>
            <span className="whitespace-nowrap font-bold">{currentDateStr || '12 SEP 2026'}</span>
          </div>
        </div>

        {/* Next Interchange Card */}
        <div className="flex flex-col bg-purple-950 rounded-xl overflow-hidden shadow-lg border border-purple-800">
          <div className="bg-black/85 px-3 py-1.5 text-center text-xs font-extrabold tracking-wider uppercase text-purple-200">
            {interchangeLabel}
          </div>
          <div className="bg-white text-slate-950 px-3 py-2.5 text-center font-black text-sm md:text-base min-h-[50px] flex items-center justify-center">
            {displayInterchange || 'NONE'}
          </div>
        </div>

        {/* Destination Station Card */}
        <div className="flex flex-col bg-purple-950 rounded-xl overflow-hidden shadow-lg border border-purple-800">
          <div className="bg-black/85 px-3 py-1.5 text-center text-xs font-extrabold tracking-wider uppercase text-purple-200">
            {destinationLabel}
          </div>
          <div className="bg-white text-slate-950 px-3 py-2.5 text-center font-black text-sm md:text-base min-h-[50px] flex items-center justify-center">
            {displayDestination || 'DESTINATION'}
          </div>
        </div>

        {/* Language & Sound Toggle Control Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-purple-800/60 text-xs">
          <button
            onClick={() => setLang(l => (l === 'EN' ? 'HI' : 'EN'))}
            className="flex items-center gap-1.5 bg-purple-900 hover:bg-purple-800 text-purple-100 px-3 py-1.5 rounded-lg transition font-semibold shadow"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'EN' ? 'Hindi Mode' : 'English Mode'}</span>
          </button>

          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-1.5 bg-purple-900 hover:bg-purple-800 text-purple-200 rounded-lg transition"
            title="Toggle Announcement Audio"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN DISPLAY BODY (Hot Pink Theme) */}
      <main className="flex-1 bg-dmrc-pink flex flex-col justify-between p-3 md:p-5 relative overflow-hidden">
        
        {/* Main Content White Card Container (Centered Ratios) */}
        <div className="flex-1 flex flex-col rounded-[24px] overflow-hidden shadow-2xl border-2 border-pink-400/50 bg-white m-1">
          
          {/* Header Banner */}
          <div className="bg-dmrc-headerCard text-white py-3.5 px-6 text-center shadow-md shrink-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-widest uppercase">
              {headerTitle}
            </h2>
          </div>

          {/* Main Station Name Display Area - Dead Centered */}
          <div className="flex-1 bg-white flex items-center justify-center p-6 text-center min-h-[220px]">
            <span className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-950 tracking-tight leading-tight text-center max-w-full break-words">
              {displayTargetStation || 'STATION NAME'}
            </span>
          </div>
        </div>

        {/* Bottom Announcement / Marquee / Door Status Area */}
        <div className="mt-3 bg-slate-100 rounded-2xl p-3.5 shadow-lg border border-pink-300 min-h-[64px] flex items-center justify-center overflow-hidden relative">
          
          {/* If doors are opening/arrived: Hide Marquee text and show doors opening message as specified! */}
          {isStationArrived || isDoorsOpen ? (
            <div className="text-center font-black text-lg sm:text-xl md:text-2xl text-emerald-600 animate-pulse tracking-wider">
              {doorStatusDisplay}
            </div>
          ) : (
            /* In Transit Marquee Info Area */
            <div className="w-full overflow-hidden relative flex items-center">
              <div className="whitespace-nowrap animate-marquee font-bold text-slate-800 text-sm md:text-base flex items-center gap-8">
                <span>🚆 Line: {lineName || 'Delhi Metro Network'}</span>
                <span>•</span>
                <span>📍 Distance to next station: {distanceToNextMeters ? `${(distanceToNextMeters / 1000).toFixed(2)} km` : 'Approaching'}</span>
                <span>•</span>
                <span>⚡ Speed: {currentSpeedKmH?.toFixed(1) || '38.5'} km/h</span>
                <span>•</span>
                <span>⚠️ Mind the Gap between platform and train doors</span>
                <span>•</span>
                <span>{lang === 'HI' ? 'अगला स्टेशन पर बाईं तरफ के दरवाजे खुलेंगे' : 'Doors will open on the left side'}</span>
              </div>
            </div>
          )}
        </div>

      </main>

    </div>
  );
}
