import { useState, useEffect, useRef } from 'react';

export default function useGPS() {
  const [location, setLocation]           = useState({ lat: null, lng: null, accuracy: null });
  const [status, setStatus]               = useState('pending'); // pending | good | bad
  const [statusMessage, setStatusMessage] = useState('Requesting GPS permission...');
  const watchRef = useRef(null);

  function onSuccess({ coords: { latitude, longitude, accuracy } }) {
    setLocation({ lat: latitude, lng: longitude, accuracy });
    setStatus('good');
    setStatusMessage(
      `GPS active — ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`
    );
  }

  function onError(err) {
    setStatus('bad');
    const MSG = {
      1: 'Location permission denied. Allow location in your browser then click Refresh GPS.',
      2: 'Location unavailable. Check that GPS/location services are enabled.',
      3: 'Location request timed out. Click Refresh GPS to retry.',
    };
    setStatusMessage(MSG[err.code] || `GPS error: ${err.message}`);
  }

  function start(force = false) {
    if (!('geolocation' in navigator)) {
      setStatus('bad');
      setStatusMessage('Geolocation is not supported by this browser.');
      return;
    }
    if (force && watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setStatus('pending');
    setStatusMessage('Requesting GPS permission...');

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true, timeout: 15_000, maximumAge: 0,
    });

    if (watchRef.current === null) {
      watchRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: true, timeout: 30_000, maximumAge: 5_000,
      });
    }
  }

  useEffect(() => {
    start();
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  return { location, status, statusMessage, refresh: () => start(true) };
}
