import { useMemo } from 'react';
import { WeightLog } from '../types';

/**
 * Custom Hook to compute Exponential Moving Average (EMA-7) & Simple Moving Average (SMA-7)
 * over daily weight logs.
 */
export function useMovingAverage(weightLogs: WeightLog[] = [], period: number = 7): WeightLog[] {
  return useMemo(() => {
    if (!weightLogs || weightLogs.length === 0) {
      return [];
    }

    // Sort chronologically ascending by timestamp
    const sorted = [...weightLogs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const k = 2 / (period + 1);
    let currentEma: number | null = null;

    const computed = sorted.map((entry, index) => {
      const weight = Number(entry.weightKg);

      if (index === 0 || currentEma === null) {
        currentEma = weight;
      } else {
        currentEma = (weight * k) + (currentEma * (1 - k));
      }

      // Also compute SMA-7 for reference
      const startIdx = Math.max(0, index - period + 1);
      const windowSlice = sorted.slice(startIdx, index + 1);
      const sma = windowSlice.reduce((acc, curr) => acc + Number(curr.weightKg), 0) / windowSlice.length;

      const roundedEma = Math.round(currentEma * 100) / 100;
      const roundedSma = Math.round(sma * 100) / 100;

      return {
        ...entry,
        weightKg: weight,
        ema7: roundedEma,
        sma7: roundedSma
      };
    });

    return computed;
  }, [weightLogs, period]);
}
