import { describe, it, expect } from 'vitest';
import { formatTimeFFmpeg } from '../utils/formatters';

describe('Time Formatting', () => {
  describe('formatTimeFFmpeg', () => {
    it('formats zero', () => {
      expect(formatTimeFFmpeg(0)).toBe('00:00:00.00');
    });

    it('formats seconds', () => {
      expect(formatTimeFFmpeg(5.5)).toBe('00:00:05.50');
      expect(formatTimeFFmpeg(30.33)).toBe('00:00:30.33');
    });

    it('formats minutes', () => {
      expect(formatTimeFFmpeg(60)).toBe('00:01:00.00');
      expect(formatTimeFFmpeg(90.25)).toBe('00:01:30.25');
    });

    it('formats hours', () => {
      expect(formatTimeFFmpeg(3600)).toBe('01:00:00.00');
      expect(formatTimeFFmpeg(3665.12)).toBe('01:01:05.12');
    });
  });
});
