import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseTimerReturn {
  targetSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  formattedTime: string;
  startTimer: (secs?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  adjustSeconds: (amount: number) => void;
  setTargetSeconds: (secs: number) => void;
}

export function useTimer(initialSeconds: number = 60): UseTimerReturn {
  const [targetSeconds, setTargetSeconds] = useState<number>(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Play audio sound using Web Audio API synth
  const playAlertSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio fallback silent failure
    }

    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const startTimer = useCallback((secs?: number) => {
    const duration = secs !== undefined ? secs : targetSeconds;
    setTargetSeconds(duration);
    setRemainingSeconds(duration);
    setIsRunning(true);
  }, [targetSeconds]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resumeTimer = useCallback(() => {
    if (remainingSeconds > 0) {
      setIsRunning(true);
    }
  }, [remainingSeconds]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setRemainingSeconds(targetSeconds);
  }, [targetSeconds]);

  const adjustSeconds = useCallback((amount: number) => {
    setRemainingSeconds((prev) => Math.max(0, prev + amount));
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
            playAlertSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, playAlertSound]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    targetSeconds,
    remainingSeconds,
    isRunning,
    formattedTime: formatTime(remainingSeconds),
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    adjustSeconds,
    setTargetSeconds
  };
}
