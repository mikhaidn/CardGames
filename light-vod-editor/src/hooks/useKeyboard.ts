import { useEffect } from 'react';

interface KeyboardShortcuts {
  onFrameBack: () => void;
  onFrameForward: () => void;
  onJumpBack: () => void;
  onJumpForward: () => void;
  onPlayPause: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            shortcuts.onJumpBack();
          } else {
            shortcuts.onFrameBack();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            shortcuts.onJumpForward();
          } else {
            shortcuts.onFrameForward();
          }
          break;
        case ' ':
          e.preventDefault();
          shortcuts.onPlayPause();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}
