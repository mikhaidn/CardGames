import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { type KlondikeGameState, type Location, isGameWon } from '../state/gameState';
import { drawFromStock, moveCards, autoMoveToFoundations } from '../state/gameActions';
import { Tableau } from './Tableau';
import { StockWaste } from './StockWaste';
import { FoundationArea } from './FoundationArea';
import { calculateLayoutSizes, type LayoutSizes } from '../utils/responsiveLayout';
import {
  GameControls,
  useGameHistory,
  useCardInteraction,
  FEATURE_FLAGS,
  type GameLocation,
} from '@cardgames/shared';
import { validateMove } from '../rules/moveValidation';
import { executeMove } from '../state/moveExecution';
import { version } from '../../package.json';

interface GameBoardProps {
  initialState: KlondikeGameState;
  onNewGame: () => void;
}

type SelectedCard =
  | { type: 'waste' }
  | { type: 'tableau'; columnIndex: number; cardCount: number }
  | { type: 'foundation'; index: number }
  | null;

export const GameBoard: React.FC<GameBoardProps> = ({ initialState, onNewGame }) => {
  // Use game history for undo/redo functionality
  const {
    currentState: gameState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useGameHistory<KlondikeGameState>({
    initialState,
    maxHistorySize: 100,
    persistKey: 'klondike-game-history',
  });

  // RFC-004 Phase 2: Shared interaction hook (feature-flagged)
  const sharedHookConfig = useMemo(() => ({
    validateMove: (from: GameLocation, to: GameLocation) => {
      return validateMove(gameState, from, to);
    },
    executeMove: (from: GameLocation, to: GameLocation) => {
      const newState = executeMove(gameState, from, to);
      if (newState) {
        pushState(newState);
      }
    },
  }), [gameState, pushState]);

  const {
    state: sharedInteractionState,
    handlers: sharedHandlers
  } = useCardInteraction<GameLocation>(sharedHookConfig);

  // Legacy selection state (used when feature flag is OFF)
  const [selectedCard, setSelectedCard] = useState<SelectedCard>(null);

  // Responsive layout sizing
  const [layoutSizes, setLayoutSizes] = useState<LayoutSizes>(() =>
    calculateLayoutSizes(window.innerWidth, window.innerHeight)
  );

  // Derive win state from game state
  const isWon = isGameWon(gameState);

  // Update layout sizes on window resize
  useEffect(() => {
    const handleResize = () => {
      setLayoutSizes(calculateLayoutSizes(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Handle stock click (draw card)
  const handleStockClick = () => {
    const newState = drawFromStock(gameState);
    if (newState !== gameState) {
      pushState(newState);
      setSelectedCard(null);
    }
  };

  // Handle waste click (select card)
  const handleWasteClick = () => {
    if (gameState.waste.length === 0) return;

    if (selectedCard?.type === 'waste') {
      setSelectedCard(null);
    } else {
      setSelectedCard({ type: 'waste' });
    }
  };

  // Handle tableau column click
  const handleTableauClick = (columnIndex: number, cardIndex: number) => {
    const column = gameState.tableau[columnIndex];
    const faceDownCount = column.cards.length - column.faceUpCount;

    // Can't select face-down cards
    if (cardIndex < faceDownCount) return;

    // If clicking same card, deselect
    if (
      selectedCard?.type === 'tableau' &&
      selectedCard.columnIndex === columnIndex &&
      cardIndex === column.cards.length - selectedCard.cardCount
    ) {
      setSelectedCard(null);
      return;
    }

    // If a card is selected, try to move it here
    if (selectedCard) {
      const destination: Location = { type: 'tableau', index: columnIndex };

      if (selectedCard.type === 'waste') {
        const newState = moveCards(gameState, { type: 'waste' }, destination, 1);
        if (newState) {
          pushState(newState);
          setSelectedCard(null);
        }
      } else if (selectedCard.type === 'tableau') {
        const source: Location = { type: 'tableau', index: selectedCard.columnIndex };
        const newState = moveCards(gameState, source, destination, selectedCard.cardCount);
        if (newState) {
          pushState(newState);
          setSelectedCard(null);
        }
      } else if (selectedCard.type === 'foundation') {
        const source: Location = { type: 'foundation', index: selectedCard.index };
        const newState = moveCards(gameState, source, destination, 1);
        if (newState) {
          pushState(newState);
          setSelectedCard(null);
        }
      }
    } else {
      // Select cards from this position to end
      const cardCount = column.cards.length - cardIndex;
      setSelectedCard({ type: 'tableau', columnIndex, cardCount });
    }
  };

  // Handle foundation click
  const handleFoundationClick = (foundationIndex: number) => {
    // If a card is selected, try to move it to foundation
    if (selectedCard) {
      const destination: Location = { type: 'foundation', index: foundationIndex };

      if (selectedCard.type === 'waste') {
        const newState = moveCards(gameState, { type: 'waste' }, destination, 1);
        if (newState) {
          pushState(newState);
          setSelectedCard(null);
        }
      } else if (selectedCard.type === 'tableau') {
        // Only single cards to foundation
        if (selectedCard.cardCount === 1) {
          const source: Location = { type: 'tableau', index: selectedCard.columnIndex };
          const newState = moveCards(gameState, source, destination, 1);
          if (newState) {
            pushState(newState);
            setSelectedCard(null);
          }
        }
      }
    } else {
      // Select top card from foundation
      const foundation = gameState.foundations[foundationIndex];
      if (foundation.length > 0) {
        setSelectedCard({ type: 'foundation', index: foundationIndex });
      }
    }
  };

  // Auto-complete (move all safe cards to foundations)
  const handleAutoComplete = () => {
    const newState = autoMoveToFoundations(gameState);
    if (newState !== gameState) {
      pushState(newState);
      setSelectedCard(null);
      // Clear shared hook selection if using it
      if (FEATURE_FLAGS.USE_SHARED_INTERACTION_HOOK && sharedInteractionState.selectedCard) {
        // Note: shared hook clears selection automatically on successful move
      }
    }
  };

  // Reset game to initial state
  const handleResetGame = useCallback(() => {
    resetHistory();
    setSelectedCard(null);
  }, [resetHistory]);

  // =============================================================================
  // RFC-004 Phase 2: Unified interaction handlers (feature-flagged)
  // =============================================================================

  /**
   * Unified waste click handler that uses either shared hook or legacy code
   * based on FEATURE_FLAGS.USE_SHARED_INTERACTION_HOOK
   */
  const handleWasteClickUnified = useCallback(() => {
    if (gameState.waste.length === 0) return;

    if (FEATURE_FLAGS.USE_SHARED_INTERACTION_HOOK) {
      // Use shared hook
      sharedHandlers.handleCardClick({
        type: 'waste',
        index: 0,
        cardCount: 1,
      });
    } else {
      // Legacy code
      handleWasteClick();
    }
  }, [gameState.waste.length, sharedHandlers]);

  /**
   * Unified tableau click handler
   */
  const handleTableauClickUnified = useCallback((columnIndex: number, cardIndex: number) => {
    if (FEATURE_FLAGS.USE_SHARED_INTERACTION_HOOK) {
      // Use shared hook
      const column = gameState.tableau[columnIndex];
      const faceDownCount = column.cards.length - column.faceUpCount;

      // Can't select face-down cards
      if (cardIndex < faceDownCount) return;

      const cardCount = column.cards.length - cardIndex;
      sharedHandlers.handleCardClick({
        type: 'tableau',
        index: columnIndex,
        cardCount,
      });
    } else {
      // Legacy code
      handleTableauClick(columnIndex, cardIndex);
    }
  }, [gameState.tableau, sharedHandlers]);

  /**
   * Unified foundation click handler
   */
  const handleFoundationClickUnified = useCallback((foundationIndex: number) => {
    if (FEATURE_FLAGS.USE_SHARED_INTERACTION_HOOK) {
      // Use shared hook
      sharedHandlers.handleCardClick({
        type: 'foundation',
        index: foundationIndex,
        cardCount: 1,
      });
    } else {
      // Legacy code
      handleFoundationClick(foundationIndex);
    }
  }, [sharedHandlers]);

  // Determine which selected state to use for rendering
  const displaySelectedCard = FEATURE_FLAGS.USE_SHARED_INTERACTION_HOOK
    ? sharedInteractionState.selectedCard
    : selectedCard;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z for redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
      // U key for undo (single key shortcut)
      else if (e.key === 'u' && !e.ctrlKey && !e.metaKey && !e.altKey && canUndo) {
        e.preventDefault();
        undo();
      }
      // R key for redo (single key shortcut)
      else if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey && canRedo) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const buttonHeight = 44; // WCAG AAA minimum touch target
  const isMobile = window.innerWidth < 600;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#1e40af',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          color: 'white',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '4px' }}>
            Klondike Solitaire
          </h1>
        </div>

        <GameControls
          moves={gameState.moves}
          seed={gameState.seed}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onReset={handleResetGame}
          onNewGame={onNewGame}
          showAutoComplete={true}
          onAutoComplete={handleAutoComplete}
          isMobile={isMobile}
          minButtonHeight={buttonHeight}
          buttonPadding={isMobile ? '8px 12px' : '8px 16px'}
          fontSize={isMobile ? 0.8 : 0.875}
        />
      </div>

      {/* Top Row: Stock/Waste and Foundations */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <StockWaste
          stock={gameState.stock}
          waste={gameState.waste}
          onStockClick={handleStockClick}
          onWasteClick={handleWasteClickUnified}
          isWasteSelected={displaySelectedCard?.type === 'waste'}
          layoutSizes={layoutSizes}
        />

        <FoundationArea
          foundations={gameState.foundations}
          onClick={handleFoundationClickUnified}
          selectedFoundation={
            displaySelectedCard?.type === 'foundation'
              ? (FEATURE_FLAGS.USE_SHARED_INTERACTION_HOOK
                  ? displaySelectedCard.index
                  : (displaySelectedCard as Extract<SelectedCard, { type: 'foundation' }>).index)
              : null
          }
          layoutSizes={layoutSizes}
        />
      </div>

      {/* Tableau */}
      <Tableau
        tableau={gameState.tableau}
        onClick={handleTableauClickUnified}
        selectedColumn={
          (() => {
            if (!displaySelectedCard || displaySelectedCard.type !== 'tableau') {
              return null;
            }

            if (FEATURE_FLAGS.USE_SHARED_INTERACTION_HOOK) {
              // Using GameLocation type
              const loc = displaySelectedCard as GameLocation;
              return {
                columnIndex: loc.index,
                cardCount: loc.cardCount ?? 1,
              };
            } else {
              // Using legacy SelectedCard type
              const sel = displaySelectedCard as Extract<SelectedCard, { type: 'tableau' }>;
              return {
                columnIndex: sel.columnIndex,
                cardCount: sel.cardCount,
              };
            }
          })()
        }
        layoutSizes={layoutSizes}
        gameState={gameState}
      />

      {/* Win Modal */}
      {isWon && (
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
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#1e40af' }}>
              🎉 You Won!
            </h2>
            <p style={{ marginBottom: '24px', color: '#333' }}>
              Completed in {gameState.moves} moves
            </p>
            <button
              onClick={onNewGame}
              style={{
                minHeight: `${buttonHeight}px`,
                padding: '12px 24px',
                fontSize: '1rem',
              }}
            >
              New Game
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '16px',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center',
        }}
      >
        v{version}
      </div>
    </div>
  );
};
