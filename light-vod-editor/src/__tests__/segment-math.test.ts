import { describe, it, expect } from 'vitest';

// Pure functions for segment calculations
export function calculateDuration(start: number, end: number): number {
  return end - start;
}

export function calculateTotalDuration(segments: Array<{ start: number; end: number }>): number {
  return segments.reduce((total, seg) => total + (seg.end - seg.start), 0);
}

export function timeToPercent(time: number, duration: number): number {
  return (time / duration) * 100;
}

export function percentToTime(percent: number, duration: number): number {
  return (percent / 100) * duration;
}

describe('Segment Math', () => {
  describe('calculateDuration', () => {
    it('calculates segment duration', () => {
      expect(calculateDuration(10, 20)).toBe(10);
      expect(calculateDuration(0, 100)).toBe(100);
      expect(calculateDuration(5.5, 15.25)).toBe(9.75);
    });
  });

  describe('calculateTotalDuration', () => {
    it('sums all segment durations', () => {
      const segments = [
        { start: 10, end: 20 }, // 10s
        { start: 30, end: 45 }, // 15s
        { start: 50, end: 65 }, // 15s
      ];
      expect(calculateTotalDuration(segments)).toBe(40);
    });

    it('returns 0 for empty array', () => {
      expect(calculateTotalDuration([])).toBe(0);
    });
  });

  describe('Timeline conversions', () => {
    it('converts time to percent', () => {
      expect(timeToPercent(50, 100)).toBe(50);
      expect(timeToPercent(0, 100)).toBe(0);
      expect(timeToPercent(100, 100)).toBe(100);
      expect(timeToPercent(25, 100)).toBe(25);
    });

    it('converts percent to time', () => {
      expect(percentToTime(50, 100)).toBe(50);
      expect(percentToTime(0, 100)).toBe(0);
      expect(percentToTime(100, 100)).toBe(100);
      expect(percentToTime(25, 200)).toBe(50);
    });

    it('round-trips correctly', () => {
      const time = 42.5;
      const duration = 100;
      const percent = timeToPercent(time, duration);
      const backToTime = percentToTime(percent, duration);
      expect(backToTime).toBeCloseTo(time);
    });
  });
});
