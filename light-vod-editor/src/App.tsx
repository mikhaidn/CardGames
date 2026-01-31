import { useState, useRef } from 'react';
import './styles/app.css';
import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { SegmentList } from './components/SegmentList';
import { useKeyboardShortcuts } from './hooks/useKeyboard';
import { generateConcatCommand, generateSplitCommands } from './utils/ffmpeg-commands';
import { formatBytes, formatTime } from './utils/formatters';
import type { Segment, VideoFile, ExportMode } from './types';

function App() {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [exportMode, setExportMode] = useState<ExportMode>('concat');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [exportName, setExportName] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleVideoLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    setVideoFile({
      file,
      url,
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
    });
  };

  const addSegment = (start: number, end: number) => {
    setSegments([...segments, { start, end }]);
  };

  const handleAddSegmentAtCurrent = () => {
    if (!videoFile) return;
    const start = Math.max(0, currentTime);
    const end = Math.min(videoFile.duration, start + 10);
    addSegment(start, end);
    setSelectedIndex(segments.length);
  };

  const handleDeleteSegment = (index: number) => {
    if (!confirm(`Delete segment ${index + 1}?`)) return;
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else if (selectedIndex !== null && selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleSelectSegment = (index: number) => {
    setSelectedIndex(index);
    if (videoRef.current) {
      videoRef.current.currentTime = segments[index].start;
    }
  };

  const handlePreviewSegment = (index: number) => {
    const segment = segments[index];
    if (!videoRef.current) return;

    videoRef.current.currentTime = segment.start;
    videoRef.current.play();

    const checkEnd = setInterval(() => {
      if (videoRef.current && videoRef.current.currentTime >= segment.end) {
        videoRef.current.pause();
        clearInterval(checkEnd);
      }
    }, 100);
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSegmentUpdate = (index: number, start: number, end: number) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], start, end };
    setSegments(newSegments);
  };

  const handleSegmentFieldUpdate = (index: number, updates: Partial<Segment>) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], ...updates };
    setSegments(newSegments);
  };

  const handleCopyCommand = async (type: ExportMode) => {
    if (!videoFile || segments.length === 0) return;

    let command: string;
    if (type === 'concat') {
      command = generateConcatCommand(videoFile.file.name, segments, exportName || undefined);
    } else {
      command = generateSplitCommands(videoFile.file.name, segments, exportName || undefined).join('\n\n');
    }

    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(type);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      alert('Failed to copy: ' + (err as Error).message);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onFrameBack: () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 0.033);
      }
    },
    onFrameForward: () => {
      if (videoRef.current && videoFile) {
        videoRef.current.currentTime = Math.min(videoFile.duration, videoRef.current.currentTime + 0.033);
      }
    },
    onJumpBack: () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      }
    },
    onJumpForward: () => {
      if (videoRef.current && videoFile) {
        videoRef.current.currentTime = Math.min(videoFile.duration, videoRef.current.currentTime + 5);
      }
    },
    onPlayPause: () => {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    },
  }, !!videoFile);

  return (
    <div>
      <h1>🎬 Light VOD Editor - Multi-Segment</h1>
      <p className="subtitle">
        Cut multiple segments and merge into one video or export as separate files. Fast, local, private.
      </p>

      {/* Step 1: Load Video */}
      <div className="section">
        <h2>📂 Step 1: Load Your Video</h2>
        <p>No upload needed - file stays on your computer. Works with any size (tested with 4-7 GB files).</p>
        <input type="file" accept="video/*" onChange={handleVideoLoad} />
      </div>

      {videoFile && (
        <>
          {/* Stats */}
          <div className="section">
            <h2>📊 Video Information</h2>
            <div className="stats">
              <div className="stat-card">
                <div className="stat-value">{formatTime(videoFile.duration)}</div>
                <div className="stat-label">Duration</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatBytes(videoFile.file.size)}</div>
                <div className="stat-label">File Size</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{videoFile.width}x{videoFile.height}</div>
                <div className="stat-label">Resolution</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{segments.length}</div>
                <div className="stat-label">Segments</div>
              </div>
            </div>
          </div>

          {/* Step 2: Preview */}
          <div className="section">
            <h2>👁️ Step 2: Preview & Find Trim Points</h2>
            <p>Scrub through your video to find the perfect start and end points for each segment.</p>
            <VideoPlayer
              videoFile={videoFile}
              onTimeUpdate={setCurrentTime}
              onVideoRef={(ref) => { videoRef.current = ref; }}
            />
          </div>

          {/* Step 3: Mark Segments */}
          <div className="section">
            <h2>✂️ Step 3: Mark Segments</h2>
            <p>Click timeline to seek, use buttons to capture start/end points.</p>

            <Timeline
              duration={videoFile.duration}
              currentTime={currentTime}
              segments={segments}
              selectedIndex={selectedIndex}
              onSeek={handleSeek}
              onSegmentUpdate={handleSegmentUpdate}
              onAddSegment={(start, end) => {
                addSegment(start, end);
                setSelectedIndex(segments.length);
              }}
              videoRef={videoRef.current}
            />

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <button onClick={handleAddSegmentAtCurrent} className="success">
                ➕ Add Segment at Current Time
              </button>
            </div>

            <div style={{ margin: '20px 0' }}>
              <h3 style={{ color: '#6ab7ff', marginBottom: '10px', fontSize: '1.2em' }}>💡 Navigation Tips</h3>
              <ul style={{ paddingLeft: '20px', margin: 0, color: '#c9d1d9', fontSize: '13px' }}>
                <li><strong>Double-click timeline</strong> - Create 10s segment at position</li>
                <li><strong>Click timeline</strong> - Jump to position</li>
                <li><strong>Click and drag timeline</strong> - Scrub continuously</li>
                <li><strong>Drag handles</strong> - Adjust start/end (video scrubs in real-time!)</li>
                <li><strong>Drag segment body</strong> - Move entire segment</li>
                <li><strong>Horizontal trackpad swipe</strong> - Scrub video smoothly</li>
                <li><strong>← / →</strong> - 1 frame back/forward</li>
                <li><strong>Shift + ← / →</strong> - Jump 5 seconds</li>
                <li><strong>Spacebar</strong> - Play/pause</li>
              </ul>
            </div>

            <SegmentList
              segments={segments}
              selectedIndex={selectedIndex}
              onSelect={handleSelectSegment}
              onPreview={handlePreviewSegment}
              onDelete={handleDeleteSegment}
              onUpdate={handleSegmentFieldUpdate}
            />
          </div>

          {/* Step 4: Export */}
          {segments.length > 0 && (
            <div className="section">
              <h2>🚀 Step 4: Choose Export Mode</h2>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#c9d1d9', fontWeight: 600 }}>
                  Output Name (optional)
                </label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  placeholder={
                    exportMode === 'concat'
                      ? segments[0]?.name || `${videoFile.file.name.replace(/\.[^/.]+$/, '')}_merged`
                      : `${videoFile.file.name.replace(/\.[^/.]+$/, '')}_segment#`
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#e0e0e0',
                    fontSize: '15px',
                  }}
                />
                <small style={{ display: 'block', marginTop: '6px', color: '#8b949e', fontSize: '13px' }}>
                  {exportMode === 'concat'
                    ? 'Leave blank to use first segment name or default to "_merged"'
                    : 'Leave blank to use segment names or default to "_segment#"'}
                </small>
              </div>

              <div className="mode-selector">
                <div
                  className={`mode-option ${exportMode === 'concat' ? 'active' : ''}`}
                  onClick={() => setExportMode('concat')}
                >
                  <h4>🔗 Merge All Segments</h4>
                  <p>Combine all segments into one video file</p>
                </div>
                <div
                  className={`mode-option ${exportMode === 'split' ? 'active' : ''}`}
                  onClick={() => setExportMode('split')}
                >
                  <h4>📦 Split Into Separate Files</h4>
                  <p>Export each segment as its own file</p>
                </div>
              </div>

              {exportMode === 'concat' && (
                <div className="command-output">
                  <div className="command-header">
                    <h3>Merge Segments (Fast - No Re-encoding)</h3>
                    <button
                      className={`copy-btn ${copiedCommand === 'concat' ? 'copied' : ''}`}
                      onClick={() => handleCopyCommand('concat')}
                    >
                      {copiedCommand === 'concat' ? '✅ Copied!' : '📋 Copy Command'}
                    </button>
                  </div>
                  <pre>{generateConcatCommand(videoFile.file.name, segments, exportName || undefined)}</pre>
                </div>
              )}

              {exportMode === 'split' && (
                <div className="command-output">
                  <div className="command-header">
                    <h3>Split Into Separate Files (Fast - No Re-encoding)</h3>
                    <button
                      className={`copy-btn ${copiedCommand === 'split' ? 'copied' : ''}`}
                      onClick={() => handleCopyCommand('split')}
                    >
                      {copiedCommand === 'split' ? '✅ Copied!' : '📋 Copy All Commands'}
                    </button>
                  </div>
                  <pre>{generateSplitCommands(videoFile.file.name, segments, exportName || undefined).join('\n\n')}</pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
