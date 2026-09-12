import { useState, useEffect, useRef } from 'react';
import { haversineDistanceMeters } from '../utils/geoUtils';

export function useMetroGPS({ routeStations, mapStations, isJourneyActive }) {
  // currentStationIndex represents the station we are currently approaching or stopped at
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null); // { lat, lng }
  const [currentSpeedKmH, setCurrentSpeedKmH] = useState(0);
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  
  // State Machine Flags
  const [isStationArrived, setIsStationArrived] = useState(false);
  const [isDoorsOpen, setIsDoorsOpen] = useState(false);
  const [doorStatusText, setDoorStatusText] = useState('DOORS CLOSED');

  // Timers & Refs
  const lowSpeedTimerRef = useRef(null);
  const departureTimerRef = useRef(null);

  // Target Station being approached or stopped at
  const rawTargetStation = routeStations?.[currentStationIndex];
  const targetStationObj = rawTargetStation ? (mapStations?.[rawTargetStation.id] || rawTargetStation) : null;

  // Destination Station (Last station of route)
  const destinationStationObj = routeStations?.[routeStations.length - 1]
    ? (mapStations?.[routeStations[routeStations.length - 1].id] || routeStations[routeStations.length - 1])
    : null;

  // Next Interchange Station along remaining route
  const nextInterchangeObj = routeStations?.slice(currentStationIndex).find(st => {
    const fullSt = mapStations?.[st.id] || st;
    return fullSt?.connInfo && fullSt.connInfo.length > 0;
  });

  // Calculate distance to current target station
  let distanceToTargetMeters = 999999;
  if (currentLocation && targetStationObj) {
    distanceToTargetMeters = haversineDistanceMeters(
      currentLocation.lat,
      currentLocation.lng,
      targetStationObj.lat,
      targetStationObj.lng
    );
  }

  // 1. Live Geolocation Listener (when isSimulationMode === false)
  useEffect(() => {
    if (isSimulationMode || !isJourneyActive || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const speedKmh = pos.coords.speed !== null ? pos.coords.speed * 3.6 : 0;
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setCurrentSpeedKmH(speedKmh);
      },
      (err) => {
        console.warn('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSimulationMode, isJourneyActive]);

  // 2. Speed Threshold & State Machine Logic
  useEffect(() => {
    if (!isJourneyActive || !targetStationObj) return;

    const coveringRadius = targetStationObj.coveringRadius || 300;
    const isInsideCovering = distanceToTargetMeters <= coveringRadius;

    // Check low speed stop condition (0 - 1 km/h for 2 seconds) inside station covering
    if (isInsideCovering && currentSpeedKmH <= 1.0) {
      if (!lowSpeedTimerRef.current && !isDoorsOpen) {
        lowSpeedTimerRef.current = setTimeout(() => {
          // Trigger Arrived & Door Opening
          setIsStationArrived(true);
          setIsDoorsOpen(true);
          setDoorStatusText('DOORS OPENING');

          // Schedule 15s departure readiness
          departureTimerRef.current = setTimeout(() => {
            setDoorStatusText('READY FOR DEPARTURE');
          }, 15000);

        }, 2000); // 2 second delay as specified
      }
    } else {
      // Cancel timer if speed increases before 2 seconds
      if (lowSpeedTimerRef.current && !isDoorsOpen) {
        clearTimeout(lowSpeedTimerRef.current);
        lowSpeedTimerRef.current = null;
      }
    }

    // Departure Check: Speed >= 3.0 km/h after station stop
    if (isDoorsOpen && currentSpeedKmH >= 3.0) {
      setDoorStatusText('DOORS CLOSING');
      
      const transitionTimer = setTimeout(() => {
        setIsDoorsOpen(false);
        setIsStationArrived(false);
        setDoorStatusText('DOORS CLOSED');

        // Clear timers
        if (lowSpeedTimerRef.current) clearTimeout(lowSpeedTimerRef.current);
        if (departureTimerRef.current) clearTimeout(departureTimerRef.current);
        lowSpeedTimerRef.current = null;
        departureTimerRef.current = null;

        // Advance target to NEXT station on route
        if (currentStationIndex < (routeStations?.length || 1) - 1) {
          setCurrentStationIndex(prev => prev + 1);
        }
      }, 1500);

      return () => clearTimeout(transitionTimer);
    }

  }, [currentSpeedKmH, distanceToTargetMeters, isDoorsOpen, isJourneyActive, targetStationObj, currentStationIndex, routeStations?.length]);

  // Manual Controls & Helpers
  const forceArriveAtStation = () => {
    if (targetStationObj) {
      setCurrentLocation({ lat: targetStationObj.lat, lng: targetStationObj.lng });
      setCurrentSpeedKmH(0);
    }
  };

  const forceDepartStation = () => {
    setCurrentSpeedKmH(35);
  };

  const resetJourney = () => {
    setCurrentStationIndex(0);
    setIsStationArrived(false);
    setIsDoorsOpen(false);
    setDoorStatusText('DOORS CLOSED');
    if (routeStations?.[0]) {
      const st = mapStations?.[routeStations[0].id] || routeStations[0];
      setCurrentLocation({ lat: st.lat, lng: st.lng });
    }
  };

  return {
    currentStationIndex,
    setCurrentStationIndex,
    currentLocation,
    currentSpeedKmH,
    setCurrentSpeedKmH,
    isSimulationMode,
    setIsSimulationMode,
    isStationArrived,
    isDoorsOpen,
    doorStatusText,
    targetStation: targetStationObj, // Same station object for both NEXT STATION and THIS STATION!
    nextInterchange: nextInterchangeObj,
    destinationStation: destinationStationObj,
    distanceToNextMeters: distanceToTargetMeters,
    forceArriveAtStation,
    forceDepartStation,
    resetJourney
  };
}
