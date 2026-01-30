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
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

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
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
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
