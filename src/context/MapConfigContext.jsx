import React, { createContext, useContext, useState, useEffect } from 'react';
import initialData from '../data/dmrcData.json';

const MapConfigContext = createContext();

const STORAGE_KEY = 'dmrc_custom_map_config_v1';
const BROADCAST_CHANNEL = 'dmrc_map_sync_channel';

export function MapConfigProvider({ children }) {
  const [mapConfig, setMapConfig] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved map config', e);
      }
    }
    return createInitialMapConfig(initialData);
  });

  const [hasMapUpdatePending, setHasMapUpdatePending] = useState(false);
  const [pendingConfig, setPendingConfig] = useState(null);

  // Broadcast Channel for Admin -> Client sync
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);

    channel.onmessage = (event) => {
      if (event.data?.type === 'MAP_CONFIG_UPDATED') {
        const incomingConfig = event.data.payload;
        if (incomingConfig.lastUpdated > (mapConfig.lastUpdated || 0)) {
          setPendingConfig(incomingConfig);
          setHasMapUpdatePending(true);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [mapConfig.lastUpdated]);

  function createInitialMapConfig(data) {
    const stationMap = {};
    data.allStations.forEach(st => {
      stationMap[st.id] = {
        ...st,
        coveringRadius: 300, // default station covering radius in meters
      };
    });

    return {
      lastUpdated: Date.now(),
      stations: stationMap,
      lines: data.lines,
      curveControlPoints: {}, // key: "station1Id-station2Id", val: [{lat, lng}]
      lineColors: data.lineColors
    };
  }

  const updateStationPosition = (stationId, lat, lng) => {
    setMapConfig(prev => ({
      ...prev,
      stations: {
        ...prev.stations,
        [stationId]: {
          ...prev.stations[stationId],
          lat,
          lng
        }
      }
    }));
  };

  const updateStationCovering = (stationId, radiusMeters) => {
    setMapConfig(prev => ({
      ...prev,
      stations: {
        ...prev.stations,
        [stationId]: {
          ...prev.stations[stationId],
          coveringRadius: Math.max(50, Math.min(2000, radiusMeters))
        }
      }
    }));
  };

  const addCurveControlPoint = (stationId1, stationId2, lat, lng) => {
    const key = `${stationId1}_${stationId2}`;
    setMapConfig(prev => {
      const existing = prev.curveControlPoints[key] || [];
      return {
        ...prev,
        curveControlPoints: {
          ...prev.curveControlPoints,
          [key]: [...existing, { lat, lng }]
        }
      };
    });
  };

  const updateCurveControlPoint = (stationId1, stationId2, index, lat, lng) => {
    const key = `${stationId1}_${stationId2}`;
    setMapConfig(prev => {
      const existing = [...(prev.curveControlPoints[key] || [])];
      if (existing[index]) {
        existing[index] = { lat, lng };
      }
      return {
        ...prev,
        curveControlPoints: {
          ...prev.curveControlPoints,
          [key]: existing
        }
      };
    });
  };

  const removeCurveControlPoint = (stationId1, stationId2, index) => {
    const key = `${stationId1}_${stationId2}`;
    setMapConfig(prev => {
      const existing = [...(prev.curveControlPoints[key] || [])];
      existing.splice(index, 1);
      return {
        ...prev,
        curveControlPoints: {
          ...prev.curveControlPoints,
          [key]: existing
        }
      };
    });
  };

  const saveMapConfig = () => {
    const updated = {
      ...mapConfig,
      lastUpdated: Date.now()
    };
    setMapConfig(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Broadcast to other tabs/clients
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL);
      channel.postMessage({
        type: 'MAP_CONFIG_UPDATED',
        payload: updated
      });
      channel.close();
    }

    return updated;
  };

  const acceptMapUpdate = () => {
    if (pendingConfig) {
      setMapConfig(pendingConfig);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingConfig));
      setPendingConfig(null);
      setHasMapUpdatePending(false);
    }
  };

  const resetMapConfig = () => {
    const initial = createInitialMapConfig(initialData);
    setMapConfig(initial);
    localStorage.removeItem(STORAGE_KEY);
    setHasMapUpdatePending(false);
    setPendingConfig(null);
  };

  return (
    <MapConfigContext.Provider value={{
      mapConfig,
      updateStationPosition,
      updateStationCovering,
      addCurveControlPoint,
      updateCurveControlPoint,
      removeCurveControlPoint,
      saveMapConfig,
      resetMapConfig,
      hasMapUpdatePending,
      acceptMapUpdate
    }}>
      {children}
    </MapConfigContext.Provider>
  );
}

export function useMapConfig() {
  return useContext(MapConfigContext);
}
