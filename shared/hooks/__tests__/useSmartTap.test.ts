/**
 * Tests for useSmartTap hook
 * RFC-005 Phase 3 Week 7: Smart tap-to-move feature
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSmartTap } from '../useSmartTap';
import type { GameLocation } from '../../types/GameLocation';
import * as SettingsContext from '../../contexts/SettingsContext';

// Mock the useSettings hook
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

describe('useSmartTap', () => {
  const mockGetValidMoves = vi.fn<(from: GameLocation) => GameLocation[]>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Traditional mode (smartTapToMove = false)', () => {
    beforeEach(() => {
      vi.mocked(SettingsContext.useSettings).mockReturnValue({
        settings: { smartTapToMove: false } as any,
        updateSettings: vi.fn(),
        resetSettings: vi.fn(),
      });
    });

    it('should return select action for any location', () => {
      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      const location: GameLocation = { type: 'tableau', index: 0 };
      const action = result.current.handleTap(location);

      expect(action).toEqual({
        action: 'select',
        location,
      });
      expect(mockGetValidMoves).not.toHaveBeenCalled();
    });

    it('should indicate smart tap is disabled', () => {
      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      expect(result.current.smartTapEnabled).toBe(false);
    });
  });

  describe('Smart tap mode (smartTapToMove = true)', () => {
    beforeEach(() => {
      vi.mocked(SettingsContext.useSettings).mockReturnValue({
        settings: { smartTapToMove: true } as any,
        updateSettings: vi.fn(),
        resetSettings: vi.fn(),
      });
    });

    it('should indicate smart tap is enabled', () => {
      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      expect(result.current.smartTapEnabled).toBe(true);
    });

    it('should return invalid action when no valid moves', () => {
      mockGetValidMoves.mockReturnValue([]);

      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      const location: GameLocation = { type: 'tableau', index: 0 };
      const action = result.current.handleTap(location);

      expect(action).toEqual({
        action: 'invalid',
        location,
      });
      expect(mockGetValidMoves).toHaveBeenCalledWith(location);
    });

    it('should return auto-move action when exactly one valid move', () => {
      const from: GameLocation = { type: 'tableau', index: 0 };
      const to: GameLocation = { type: 'foundation', index: 0 };
      mockGetValidMoves.mockReturnValue([to]);

      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      const action = result.current.handleTap(from);

      expect(action).toEqual({
        action: 'auto-move',
        from,
        to,
      });
      expect(mockGetValidMoves).toHaveBeenCalledWith(from);
    });

    it('should return highlight action when multiple valid moves', () => {
      const from: GameLocation = { type: 'tableau', index: 0 };
      const validMoves: GameLocation[] = [
        { type: 'foundation', index: 0 },
        { type: 'tableau', index: 1 },
        { type: 'freeCell', index: 0 },
      ];
      mockGetValidMoves.mockReturnValue(validMoves);

      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      const action = result.current.handleTap(from);

      expect(action).toEqual({
        action: 'highlight',
        location: from,
        options: validMoves,
      });
      expect(mockGetValidMoves).toHaveBeenCalledWith(from);
    });

    it('should call getValidMoves with the tapped location', () => {
      mockGetValidMoves.mockReturnValue([]);

      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      const location: GameLocation = { type: 'freeCell', index: 2 };
      result.current.handleTap(location);

      expect(mockGetValidMoves).toHaveBeenCalledTimes(1);
      expect(mockGetValidMoves).toHaveBeenCalledWith(location);
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      vi.mocked(SettingsContext.useSettings).mockReturnValue({
        settings: { smartTapToMove: true } as any,
        updateSettings: vi.fn(),
        resetSettings: vi.fn(),
      });
    });

    it('should handle empty array of valid moves', () => {
      mockGetValidMoves.mockReturnValue([]);

      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      const location: GameLocation = { type: 'stock', index: 0 };
      const action = result.current.handleTap(location);

      expect(action.action).toBe('invalid');
    });

    it('should handle two valid moves as highlight', () => {
      const from: GameLocation = { type: 'tableau', index: 0 };
      const validMoves: GameLocation[] = [
        { type: 'foundation', index: 0 },
        { type: 'tableau', index: 1 },
      ];
      mockGetValidMoves.mockReturnValue(validMoves);

      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      const action = result.current.handleTap(from);

      expect(action.action).toBe('highlight');
      if (action.action === 'highlight') {
        expect(action.options).toHaveLength(2);
      }
    });

    it('should work with different location types', () => {
      const locations: GameLocation[] = [
        { type: 'tableau', index: 3 },
        { type: 'foundation', index: 1 },
        { type: 'freeCell', index: 2 },
        { type: 'waste', index: 0 },
        { type: 'stock', index: 0 },
      ];

      mockGetValidMoves.mockReturnValue([]);

      const { result } = renderHook(() => useSmartTap(mockGetValidMoves));

      locations.forEach((location) => {
        const action = result.current.handleTap(location);
        expect(action.action).toBe('invalid');
        expect(mockGetValidMoves).toHaveBeenCalledWith(location);
        mockGetValidMoves.mockClear();
      });
    });
  });

  describe('Setting changes', () => {
    it('should react to settings changes', () => {
      const { result, rerender } = renderHook(() => useSmartTap(mockGetValidMoves));

      // Start with smart tap disabled
      vi.mocked(SettingsContext.useSettings).mockReturnValue({
        settings: { smartTapToMove: false } as any,
        updateSettings: vi.fn(),
        resetSettings: vi.fn(),
      });
      rerender();

      expect(result.current.smartTapEnabled).toBe(false);

      // Enable smart tap
      vi.mocked(SettingsContext.useSettings).mockReturnValue({
        settings: { smartTapToMove: true } as any,
        updateSettings: vi.fn(),
        resetSettings: vi.fn(),
      });
      rerender();

      expect(result.current.smartTapEnabled).toBe(true);
    });
  });
});
