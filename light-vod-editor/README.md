# Light VOD Editor

A browser-based video trimming tool that generates FFmpeg commands. Fast, local, and private - your videos never leave your computer.

**Part of the Plokmin Consortium collection.**

## 🎯 What It Does

Generate FFmpeg commands to:
- ✂️ **Trim videos** - Cut multiple segments from large video files (4-7 GB tested)
- 🔗 **Merge segments** - Combine multiple clips into one video
- 📦 **Split segments** - Export each clip as a separate file
- 🎤 **Add voiceovers** - Record and mix multiple audio tracks
- 📍 **Mark timestamps** - Add labeled markers for easy navigation

**No upload, no re-encoding in the browser** - just generates the commands you need.

## 🚀 Quick Start

```bash
# From repo root
npm install
npm run dev:light-vod-editor
```

Or visit the live app: https://mikhaidn.github.io/PlokminFun/light-vod-editor/

1. **Load** your video file (works with any size - tested with 4-7 GB files)
2. **Add segments** - Double-click timeline or use "Add Segment" button
3. **Adjust segments** - Drag handles to fine-tune start/end points
4. **Name segments** (optional) - Click to edit segment names
5. **Copy** the generated FFmpeg command
6. **Run** the command in your terminal

## ✨ Features

### Video Trimming & Segmentation
- **Double-click timeline** - Create 10-second segments instantly
- **Real-time video scrubbing** - Video updates while dragging segment handles
- **Continuous timeline seeking** - Click and drag timeline to scrub smoothly
- **Inline segment editing** - Click to edit names, start/end times, duration
- **Custom export naming** - Name your output files (uses segment names in split mode)
- **Bracket-style handles** - Clear visual indicators extending outward for easy grabbing
- **Two export modes**:
  - **Merge** - Combine all segments into one video
  - **Split** - Export each segment as a separate file

### Navigation & Controls
- **Horizontal trackpad swipe** - Natural video scrubbing
- **Keyboard shortcuts**:
  - `←/→` - Move 1 frame backward/forward
  - `Shift + ←/→` - Jump 5 seconds
  - `Spacebar` - Play/pause
- **Drag handles** - Adjust start/end with live video preview
- **Drag segment body** - Move entire segment (previews start when moving left, end when moving right)

## Development

```bash
# Install dependencies (from repo root)
npm install

# Start dev server
npm run dev:light-vod-editor

# Run tests
npm test -w light-vod-editor

# Build for production
npm run build -w light-vod-editor

# Type checking
npm run typecheck
```

## 📋 Project Structure

```
light-vod-editor/
├── src/
│   ├── components/         # React components
│   │   ├── VideoPlayer.tsx      # Video playback with time tracking
│   │   ├── Timeline.tsx          # Interactive timeline with draggable segments
│   │   └── SegmentList.tsx       # Editable segment list
│   ├── utils/              # Core utilities
│   │   ├── ffmpeg-commands.ts    # FFmpeg command generation
│   │   └── formatters.ts         # Time/byte formatting
│   ├── hooks/              # React hooks
│   │   └── useKeyboard.ts        # Keyboard shortcuts
│   ├── __tests__/          # Test files
│   └── styles/             # CSS (extracted from original HTML for 1:1 parity)
└── README.md
```

## 🎮 Common Workflows

### 1. Split One VOD into Multiple Runs
1. Load your 2-hour VOD
2. Double-click timeline to add segments for each run
3. Name each segment (e.g., "Run1", "Run2", "Run3", "Run4")
4. Switch to "📦 Split Into Separate Files" mode
5. Copy commands and run in terminal → Get `Run1.mp4`, `Run2.mp4`, etc.

### 2. Create Highlights Reel
1. Load your stream VOD
2. Double-click to mark all exciting moments (kills, wins, funny moments)
3. Stay in "🔗 Merge All Segments" mode
4. Copy command and run → Get one highlights video

## 🛠️ Technical Details

### Architecture
- **React + TypeScript**: Type-safe components with hooks for state management
- **Vite**: Fast dev server and optimized builds
- **Test-driven development**: 18 tests covering FFmpeg commands, time formatting, segment math
- **CSS extracted from original HTML**: Ensures 1:1 visual parity with prototype

### How It Works
1. Video loads locally via `createObjectURL()` (instant playback, no upload)
2. User creates/edits segments via timeline interaction
3. FFmpeg commands generated with complex filter chains
4. User runs commands → FFmpeg processes video on their machine

### Why FFmpeg Commands?
- ✅ **Fast** - No re-encoding with `-c copy` codec
- ✅ **Scalable** - Works with any file size (tested 4-7 GB)
- ✅ **Quality** - No quality loss
- ✅ **Flexible** - Commands can be tweaked

### FFmpeg Installation
**Mac:** `brew install ffmpeg`
**Linux:** `sudo apt install ffmpeg`
**Windows:** [ffmpeg.org](https://ffmpeg.org/download.html)
