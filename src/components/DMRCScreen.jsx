import React, { useState, useEffect } from 'react';
import DoorAnimation from './DoorAnimation';
import { Volume2, VolumeX, Globe } from 'lucide-react';

export default function DMRCScreen({
  nextStation,
  thisStation,
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
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayNextStation = lang === 'HI' ? (nextStation?.hindiName || nextStation?.name) : nextStation?.name;
  const displayThisStation = lang === 'HI' ? (thisStation?.hindiName || thisStation?.name) : thisStation?.name;
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
    <div className="w-full h-full min-h-[500px] max-w-6xl mx-auto bg-dmrc-pinkBg flex flex-col md:flex-row shadow-2xl rounded-2xl overflow-hidden font-dmrc border-4 border-purple-950 select-none">
      
      {/* LEFT SIDEBAR PANEL (Purple Theme) */}
      <aside className="w-full md:w-[320px] bg-dmrc-sidebar text-white p-4 flex flex-col justify-between gap-4 border-b-4 md:border-b-0 md:border-r-4 border-purple-950">
        {/* Door Animation & Clock Card */}
        <div className="flex flex-col gap-2">
          <DoorAnimation isOpen={isDoorsOpen} statusText={doorStatusDisplay} />
          
          <div className="flex justify-between items-center px-1 text-xs font-mono tracking-wider text-purple-200">
            <span>{currentTimeStr || '{CURR_TIME}'}</span>
            <span>{currentDateStr || '{CURR_DATE}'}</span>
          </div>
        </div>

        {/* Next Interchange Card */}
        <div className="flex flex-col bg-purple-950 rounded-xl overflow-hidden shadow-lg border border-purple-800">
          <div className="bg-black/80 px-3 py-1.5 text-center text-xs font-extrabold tracking-wider uppercase text-purple-200">
            {interchangeLabel}
          </div>
          <div className="bg-white text-slate-900 px-3 py-3 text-center font-bold text-sm md:text-base min-h-[55px] flex items-center justify-center">
            {displayInterchange || '{NEXT_INTERCHANGE}'}
          </div>
        </div>

        {/* Destination Station Card */}
        <div className="flex flex-col bg-purple-950 rounded-xl overflow-hidden shadow-lg border border-purple-800">
          <div className="bg-black/80 px-3 py-1.5 text-center text-xs font-extrabold tracking-wider uppercase text-purple-200">
            {destinationLabel}
          </div>
          <div className="bg-white text-slate-900 px-3 py-3 text-center font-bold text-sm md:text-base min-h-[55px] flex items-center justify-center">
            {displayDestination || '{LAST_STATION}'}
          </div>
        </div>

        {/* Language & Sound Toggle Control Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-purple-800/60 text-xs">
          <button
            onClick={() => setLang(l => (l === 'EN' ? 'HI' : 'EN'))}
            className="flex items-center gap-1.5 bg-purple-900 hover:bg-purple-800 text-purple-100 px-3 py-1.5 rounded-lg transition font-semibold"
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
      <main className="flex-1 bg-dmrc-pink flex flex-col justify-between p-4 md:p-6 relative">
        
        {/* Main Content Card Container */}
        <div className="flex-1 flex flex-col rounded-3xl overflow-hidden shadow-2xl border-2 border-pink-400/50 bg-white">
          
          {/* Header Banner */}
          <div className="bg-dmrc-headerCard text-white py-3 px-6 text-center shadow-md">
            <h2 className="text-xl md:text-3xl font-extrabold tracking-wider uppercase">
              {headerTitle}
            </h2>
          </div>

          {/* Main Station Name Display Area */}
          <div className="flex-1 bg-white flex flex-col items-center justify-center p-6 text-center min-h-[200px] md:min-h-[260px]">
            <span className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight drop-shadow-sm leading-tight">
              {isStationArrived
                ? (displayThisStation || '{THIS_STATION}')
                : (displayNextStation || '{NEXT_STATION}')
              }
            </span>

            {/* Line indicator pill */}
            {lineName && (
              <div 
                className="mt-4 px-4 py-1 rounded-full text-white font-bold text-xs md:text-sm shadow-md"
                style={{ backgroundColor: lineColor || '#333' }}
              >
                {lineName}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Announcement / Marquee / Door Status Area */}
        <div className="mt-4 bg-slate-100 rounded-2xl p-4 shadow-lg border border-pink-300 min-h-[70px] flex items-center justify-center overflow-hidden relative">
          
          {/* If doors are opening/arrived: Hide Marquee text and show doors opening message as specified! */}
          {isStationArrived || isDoorsOpen ? (
            <div className="text-center font-extrabold text-lg md:text-2xl text-emerald-600 animate-pulse tracking-wide">
              {doorStatusDisplay}
            </div>
          ) : (
            /* In Transit Marquee Info Area */
            <div className="w-full overflow-hidden relative flex items-center">
              <div className="whitespace-nowrap animate-marquee font-bold text-slate-800 text-sm md:text-lg flex items-center gap-8">
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
