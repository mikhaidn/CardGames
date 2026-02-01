import { describe, it, expect } from 'vitest';
import { generateConcatCommand, generateSplitCommands } from '../utils/ffmpeg-commands';

describe('FFmpeg Command Generation', () => {
  describe('concat (merge segments)', () => {
    it('merges single segment', () => {
      const cmd = generateConcatCommand('video.mp4', [{ start: 10, end: 20 }]);

      expect(cmd).toContain('ffmpeg -i "video.mp4"');
      expect(cmd).toContain('trim=start=10.00:end=20.00');
      expect(cmd).toContain('concat=n=1:v=1:a=1');
      expect(cmd).toContain('video_merged.mp4');
    });

    it('merges multiple segments', () => {
      const cmd = generateConcatCommand('video.mp4', [
        { start: 10, end: 20 },
        { start: 30, end: 45 },
      ]);

      expect(cmd).toContain('trim=start=10.00:end=20.00');
      expect(cmd).toContain('trim=start=30.00:end=45.00');
      expect(cmd).toContain('concat=n=2:v=1:a=1');
    });

    it('preserves file extension', () => {
      expect(generateConcatCommand('video.mkv', [{ start: 0, end: 10 }])).toContain('.mkv');
      expect(generateConcatCommand('video.webm', [{ start: 0, end: 10 }])).toContain('.webm');
    });

    it('throws on empty segments', () => {
      expect(() => generateConcatCommand('video.mp4', [])).toThrow('no segments');
    });
  });

  describe('split (separate files)', () => {
    it('splits single segment', () => {
      const cmds = generateSplitCommands('video.mp4', [{ start: 10, end: 20 }]);

      expect(cmds).toHaveLength(1);
      expect(cmds[0]).toContain('ffmpeg -ss 00:00:10.00 -t 10.00');
      expect(cmds[0]).toContain('-c copy');
      expect(cmds[0]).toContain('video_segment1.mp4');
    });

    it('splits multiple segments', () => {
      const cmds = generateSplitCommands('video.mp4', [
        { start: 10, end: 20 },
        { start: 30, end: 50 },
      ]);

      expect(cmds).toHaveLength(2);
      expect(cmds[0]).toContain('-ss 00:00:10.00 -t 10.00');
      expect(cmds[1]).toContain('-ss 00:00:30.00 -t 20.00');
    });

    it('throws on empty segments', () => {
      expect(() => generateSplitCommands('video.mp4', [])).toThrow('no segments');
    });
  });
});
