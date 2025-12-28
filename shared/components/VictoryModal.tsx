/**
 * Victory Modal Component
 * Displays congratulations message when player wins
 * Used by FreeCell, Klondike, and future games
 */

import React, { useEffect } from 'react';

interface VictoryModalProps {
  /** Whether the modal is shown */
  isOpen: boolean;

  /** Number of moves taken to win */
  moves: number;

  /** Optional game seed to display */
  seed?: number;

  /** Callback when "New Game" is clicked */
  onNewGame: () => void;

  /** Optional custom title (defaults to "Congratulations!") */
  title?: string;

  /** Optional game name for custom messages */
  gameName?: string;
}

/**
 * Victory modal shown when player wins a game
 *
 * Features:
 * - Shows move count and optional seed
 * - ESC key to dismiss (calls onNewGame)
 * - Responsive design
 * - High z-index (10000) to appear above confetti (9999)
 *
 * @example
 * ```tsx
 * <VictoryModal
 *   isOpen={isWon}
 *   moves={gameState.moves}
 *   seed={gameState.seed}
 *   onNewGame={handleNewGame}
 * />
 * ```
 */
export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  moves,
  seed,
  onNewGame,
  title = 'Congratulations!',
  gameName,
}) => {
  // Handle ESC key to start new game
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onNewGame();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onNewGame]);

  if (!isOpen) return null;

  const isMobile = window.innerWidth < 600;
  const buttonHeight = 44; // WCAG AAA minimum touch target
  const padding = isMobile ? '24px' : '32px';
  const fontSize = isMobile ? 0.9 : 1.0;
  const titleSize = isMobile ? '1.5em' : '2em';
  const buttonPadding = isMobile ? '8px 12px' : '12px 24px';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: isMobile ? '16px' : '24px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
      onClick={onNewGame}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding,
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: isMobile ? '90%' : '400px',
          minWidth: isMobile ? 'auto' : '300px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="victory-modal-title"
          style={{
            fontSize: titleSize,
            marginBottom: '16px',
            color: '#1e40af',
          }}
        >
          {title.includes('🎉') ? title : `🎉 ${title}`}
        </h2>

        <p
          style={{
            fontSize: `${fontSize}em`,
            marginBottom: seed !== undefined ? '8px' : '24px',
            color: '#333',
          }}
        >
          {gameName
            ? `You won ${gameName} in ${moves} ${moves === 1 ? 'move' : 'moves'}!`
            : `You won in ${moves} ${moves === 1 ? 'move' : 'moves'}!`}
        </p>

        {seed !== undefined && (
          <p
            style={{
              fontSize: `${fontSize * 0.9}em`,
              marginBottom: '24px',
              color: '#666',
              fontFamily: 'monospace',
            }}
          >
            Seed: {seed}
          </p>
        )}

        <button
          onClick={onNewGame}
          style={{
            padding: buttonPadding,
            minHeight: `${buttonHeight}px`,
            fontSize: `${fontSize}em`,
            cursor: 'pointer',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
          }}
          aria-label="Start new game"
        >
          New Game
        </button>
      </div>
    </div>
  );
};
