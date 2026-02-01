import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "subway-tracker-muted";

type SoundType = "click" | "arrival" | "alert" | "zoom" | "toggle" | "drag" | "drop" | "select" | "deselect" | "refresh" | "error" | "success" | "whoosh";

const SOUND_FREQUENCIES: Record<SoundType, number[]> = {
  click: [800],
  arrival: [523, 659, 784],
  alert: [440, 330],
  zoom: [600, 700],
  toggle: [500, 600],
  drag: [300, 400],
  drop: [600, 800, 1000],
  select: [440, 550, 660],
  deselect: [660, 550, 440],
  refresh: [800, 900, 1000, 1100],
  error: [200, 150],
  success: [523, 659, 784, 1047],
  whoosh: [200, 400, 600, 300],
};

const SOUND_DURATIONS: Record<SoundType, number> = {
  click: 50,
  arrival: 150,
  alert: 200,
  zoom: 80,
  toggle: 60,
  drag: 100,
  drop: 120,
  select: 100,
  deselect: 80,
  refresh: 60,
  error: 150,
  success: 100,
  whoosh: 50,
};

const SOUND_WAVE_TYPES: Partial<Record<SoundType, OscillatorType>> = {
  alert: "square",
  error: "sawtooth",
  whoosh: "triangle",
};

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;

    try {
      const ctx = getAudioContext();
      const frequencies = SOUND_FREQUENCIES[type];
      const duration = SOUND_DURATIONS[type] / 1000;

      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = SOUND_WAVE_TYPES[type] || "sine";

        const startTime = ctx.currentTime + (index * duration * 0.8);
        const endTime = startTime + duration;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

        oscillator.start(startTime);
        oscillator.stop(endTime);
      });
    } catch (e) {
      // Audio not supported
    }
  }, [isMuted, getAudioContext]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { isMuted, toggleMute, playSound };
}
