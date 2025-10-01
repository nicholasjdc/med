
import { useState, useEffect, useCallback } from 'react';

export interface TimerHook {
    elapsedTime: number;
    resetTimer: () => void;
}

export const useTimer = (isResusRunning: boolean): TimerHook => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isResusRunning && startTime === null) {
      setStartTime(Date.now());
    }
  }, [isResusRunning, startTime]);

  useEffect(() => {
    let interval: number | undefined;
    if (isResusRunning && startTime !== null) { 
      // Use standard NodeJS.Timeout for React Native intervals
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } 
    return () => { if (interval !== undefined) clearInterval(interval); };
  }, [isResusRunning, startTime]);

  const resetTimer = useCallback(() => {
    setElapsedTime(0);
    setStartTime(null);
  }, []);

  return { elapsedTime, resetTimer };
};
