import { useState, useEffect, useRef } from 'react';
import { haversineDistanceMeters } from '../utils/geoUtils';

export function useMetroGPS({ routeStations, mapStations, isJourneyActive }) {
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(null); // { lat, lng }
  const [currentSpeedKmH, setCurrentSpeedKmH] = useState(0);
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  
  // State Machine Flags
  const [isStationArrived, setIsStationArrived] = useState(false);
  const [isDoorsOpen, setIsDoorsOpen] = useState(false);
  const [doorStatusText, setDoorStatusText] = useState('DOORS CLOSED');

  // Internal Timers & Refs
  const lowSpeedTimerRef = useRef(null);
  const departureTimerRef = useRef(null);
  const simIntervalRef = useRef(null);

  const activeTargetStation = routeStations?.[currentStationIndex];
  const thisStationObj = mapStations?.[activeTargetStation?.id] || activeTargetStation;

  const nextStationObj = routeStations?.[currentStationIndex + 1]
    ? (mapStations?.[routeStations[currentStationIndex + 1].id] || routeStations[currentStationIndex + 1])
    : null;

  const destinationStationObj = routeStations?.[routeStations.length - 1]
    ? (mapStations?.[routeStations[routeStations.length - 1].id] || routeStations[routeStations.length - 1])
    : null;

  // Calculate distance to current target station
  let distanceToTargetMeters = 999999;
  if (currentLocation && thisStationObj) {
    distanceToTargetMeters = haversineDistanceMeters(
      currentLocation.lat,
      currentLocation.lng,
      thisStationObj.lat,
      thisStationObj.lng
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
    if (!isJourneyActive || !thisStationObj) return;

    const coveringRadius = thisStationObj.coveringRadius || 300;
    const isInsideCovering = distanceToTargetMeters <= coveringRadius;

    // Check low speed stop condition (0 - 1 km/h for 2 seconds) inside station covering
    if (isInsideCovering && currentSpeedKmH <= 1.0) {
      if (!lowSpeedTimerRef.current && !isDoorsOpen) {
        lowSpeedTimerRef.current = setTimeout(() => {
          // Trigger Arrived & Door Opening
          setIsStationArrived(true);
          setIsDoorsOpen(true);
          setDoorStatusText('DOORS OPENING');

          // Schedule 15s departure check capability
          departureTimerRef.current = setTimeout(() => {
            setDoorStatusText('READY FOR DEPARTURE');
          }, 15000);

        }, 2000); // 2 second delay as specified in prompt
      }
    } else {
      // Speed exceeds 1 km/h or outside covering zone
      if (lowSpeedTimerRef.current && !isDoorsOpen) {
        clearTimeout(lowSpeedTimerRef.current);
        lowSpeedTimerRef.current = null;
      }
    }

    // Departure Check: Speed >= 3 km/h after 15 seconds at station stop
    if (isDoorsOpen && currentSpeedKmH >= 3.0) {
      // Close doors & move to next station
      setDoorStatusText('DOORS CLOSING');
      setTimeout(() => {
        setIsDoorsOpen(false);
        setIsStationArrived(false);
        setDoorStatusText('DOORS CLOSED');

        // Clear timers
        if (lowSpeedTimerRef.current) clearTimeout(lowSpeedTimerRef.current);
        if (departureTimerRef.current) clearTimeout(departureTimerRef.current);
        lowSpeedTimerRef.current = null;
        departureTimerRef.current = null;

        // Advance to next station on route if available
        if (currentStationIndex < (routeStations?.length || 1) - 1) {
          setCurrentStationIndex(prev => prev + 1);
        }
      }, 1500); // 1.5s door close animation transition
    }

  }, [currentSpeedKmH, distanceToTargetMeters, isDoorsOpen, isJourneyActive, thisStationObj]);

  // Simulation Controls Manual Helper Functions
  const setSimulatedLocationAndSpeed = (lat, lng, speedKmH) => {
    setCurrentLocation({ lat, lng });
    setCurrentSpeedKmH(speedKmH);
  };

  const forceArriveAtStation = () => {
    if (thisStationObj) {
      setCurrentLocation({ lat: thisStationObj.lat, lng: thisStationObj.lng });
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
    thisStation: thisStationObj,
    nextStation: nextStationObj,
    destinationStation: destinationStationObj,
    distanceToNextMeters: distanceToTargetMeters,
    setSimulatedLocationAndSpeed,
    forceArriveAtStation,
    forceDepartStation,
    resetJourney
  };
}
