# Development Guide - Light VOD Editor

## Quick Context
React + TypeScript video editor that generates FFmpeg commands. Zero upload, browser-based trimming with real-time scrubbing.

## Start Developing
```bash
npm install                      # Install dependencies
npm run dev:light-vod-editor    # Start dev server (http://localhost:5174)
npm test -w light-vod-editor    # Run tests (18 tests)
npm run typecheck               # Type checking
```

## Key Features Implemented
- **Real-time video scrubbing**: Video updates while dragging segment handles
- **Continuous timeline seeking**: Click and drag timeline to scrub
- **Double-click segment creation**: Creates 10s segments at click position
- **Inline editing**: Click segment names, times, duration to edit
- **Custom export naming**: Optional output names with fallback to segment names
- **Bracket-style handles**: Extend outward from segments for easy grabbing

## Architecture

### Components (`src/components/`)
- **VideoPlayer.tsx**: Video playback, tracks current time
- **Timeline.tsx**: Interactive timeline with draggable segments/handles, wheel scrolling
- **SegmentList.tsx**: Displays segments with inline editing

### Utils (`src/utils/`)
- **ffmpeg-commands.ts**: Generates concat/split FFmpeg commands
- **formatters.ts**: Time formatting (HH:MM:SS.ss for FFmpeg)

### Hooks (`src/hooks/`)
- **useKeyboard.ts**: Keyboard shortcuts (←/→ frame, Shift+←/→ 5s, Space play/pause)

### Types (`src/types.ts`)
```typescript
interface Segment { start: number; end: number; name?: string; }
interface VideoFile { file: File; url: string; duration: number; width: number; height: number; }
type ExportMode = 'concat' | 'split';
```

### Tests (`src/__tests__/`)
- `ffmpeg-commands.test.ts`: Command generation logic
- `formatters.test.ts`: Time formatting
- `segment-math.test.ts`: Segment calculations

## Timeline Interaction Details

### Dragging Behavior
1. **Start handle** (`transform: translate(-100%, -50%)`): Extends left from segment start, white line marks boundary
2. **End handle** (`transform: translate(0%, -50%)`): Extends right from segment end, white line marks boundary
3. **Segment body**: Dragging shows start when moving left, end when moving right
4. **Timeline seeking**: Click+drag anywhere (not on segment/handle) to scrub continuously

### Handle Design (CSS)
```css
.trim-handle-start {
  border-radius: 3px 0 0 3px;  /* Left bracket shape */
}
.trim-handle-start::after {
  right: 0;  /* White indicator line at right edge */
}
.trim-handle-end {
  border-radius: 0 3px 3px 0;  /* Right bracket shape */
}
.trim-handle-end::after {
  left: 0;  /* White indicator line at left edge */
}
```

## Export Naming Logic

### Concat Mode
```
customName → segment[0].name → `{baseName}_merged`
```

### Split Mode
Each segment uses:
```
segment.name → `{customPrefix}_segment{i+1}` → `{baseName}_segment{i+1}`
```

## FFmpeg Commands

### Concat (Merge)
Uses filter_complex with trim/atrim → concat:
```bash
ffmpeg -i "input.mp4" \
  -filter_complex "[0:v]trim=...[v0]; [0:a]atrim=...[a0]; [v0][a0]concat=..." \
  -map "[outv]" -map "[outa]" "output.mp4"
```

### Split (Separate Files)
Uses `-ss` (seek) + `-t` (duration) with `-c copy`:
```bash
ffmpeg -ss HH:MM:SS.ss -t DURATION -i "input.mp4" -c copy "segment1.mp4"
```

## Common Tasks

### Adding a New Feature
1. Write tests first (`src/__tests__/`)
2. Implement in appropriate file
3. Update types if needed
4. Test in browser with large file (4-7 GB)

### Debugging Timeline Issues
- Check transform values in Timeline.tsx (handles positioned correctly?)
- Verify dragging state logic (start/end/segment/seeking)
- Test with multiple segments (color-coded for visual debugging)

### Modifying FFmpeg Output
- Edit `src/utils/ffmpeg-commands.ts`
- Run tests: `npm test ffmpeg-commands`
- Test actual command with small video file

## TDD Approach
1. Write test in `src/__tests__/`
2. Run `npm test -w light-vod-editor -- --watch`
3. Implement feature until tests pass
4. Refactor if needed

## CSS Notes
- All styles in `src/styles/app.css`
- Extracted from `trimmer-multi.html` for 1:1 visual parity
- Dark theme with blue accents (#4a9eff)
- Timeline height: 80px, handles: 14px wide, 50px tall

## Browser Compatibility
- Uses `createObjectURL()` for local video loading
- `navigator.clipboard.writeText()` for copy button
- Wheel events for horizontal scrolling
- Tested with 4-7 GB MP4 files

## Deployment
- Live: https://mikhaidn.github.io/PlokminFun/light-vod-editor/
- Build: `npm run build -w light-vod-editor`
- Output: `dist/`
