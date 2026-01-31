import { useState, useEffect, useCallback } from "react";

export type UserLocation = {
  lat: number;
  lng: number;
};

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  const requestLocation = useCallback(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      setError("Location requires a secure connection (HTTPS)");
      return;
    }
    
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }

    // Check permissions API if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setError("Location access was denied. Please enable it in your browser settings.");
          return;
        }
        // Proceed with location request
        doLocationRequest();
      }).catch(() => {
        // Permissions API not fully supported, proceed anyway
        doLocationRequest();
      });
    } else {
      doLocationRequest();
    }

    function doLocationRequest() {
      setLoading(true);
      setError(null);
      setEnabled(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        (err) => {
          let errorMessage = "Unable to get your location";
          if (err.code === 1) {
            errorMessage = "Location access denied. Please allow location access in your browser.";
          } else if (err.code === 2) {
            errorMessage = "Location unavailable. Please try again.";
          } else if (err.code === 3) {
            errorMessage = "Location request timed out. Please try again.";
          }
          setError(errorMessage);
          setLoading(false);
          setEnabled(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    }
  }, []);

  const disableLocation = useCallback(() => {
    setLocation(null);
    setEnabled(false);
    setError(null);
  }, []);

  return { location, loading, error, enabled, requestLocation, disableLocation };
}

export function calculateWalkingTime(
  userLat: number,
  userLng: number,
  stationLat: number | null,
  stationLng: number | null
): number | null {
  if (stationLat === null || stationLng === null) return null;

  const R = 6371000;
  const dLat = ((stationLat - userLat) * Math.PI) / 180;
  const dLng = ((stationLng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((stationLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  const walkingDistance = distance * 1.3;
  const walkingSpeedMps = 1.4;
  const walkingTimeSeconds = walkingDistance / walkingSpeedMps;

  return Math.round(walkingTimeSeconds / 60);
}
