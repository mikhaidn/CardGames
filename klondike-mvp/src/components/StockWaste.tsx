import React from 'react';
import { CardFlip, EmptyCell, type LayoutSizes } from '@cardgames/shared';
import type { CardType } from '@cardgames/shared';

interface StockWasteProps {
  stock: CardType[];
  waste: CardType[];
  onStockClick: () => void;
  onWasteClick: () => void;
  isWasteSelected: boolean;
  layoutSizes: LayoutSizes;
  onDragStart?: () => (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => (e: React.DragEvent) => void;
  onTouchStart?: () => (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  flipDuration?: number;
}

export const StockWaste: React.FC<StockWasteProps> = ({
  stock,
  waste,
  onStockClick,
  onWasteClick,
  isWasteSelected,
  layoutSizes,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTouchStart,
  onTouchEnd,
  flipDuration = 300,
}) => {
  const { cardWidth, cardHeight, cardGap, fontSize } = layoutSizes;

  return (
    <div style={{ display: 'flex', gap: `${cardGap}px` }}>
      {/* Stock Pile */}
      <div
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          cursor: 'pointer',
        }}
      >
        {stock.length > 0 ? (
          <CardFlip
            card={stock[stock.length - 1]}
            faceUp={false}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            fontSize={fontSize}
            flipDuration={flipDuration}
            cardBackTheme="blue"
            onClick={onStockClick}
            title="Click to draw cards from stock"
          />
        ) : (
          <EmptyCell
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            label="↻"
            onClick={onStockClick}
            title="Click to recycle waste pile back to stock (unlimited)"
          />
        )}
      </div>

      {/* Waste Pile - Shows up to 3 cards in fanned layout */}
      <div
        style={{
          position: 'relative',
          width: `${cardWidth * 2}px`, // Wider to accommodate fanned cards
          height: `${cardHeight}px`,
          cursor: waste.length > 0 ? 'pointer' : 'default',
        }}
        data-drop-target-type="waste"
        data-drop-target-index={0}
        onDragOver={onDragOver}
        onDrop={onDrop ? onDrop() : undefined}
      >
        {waste.length > 0 ? (
          <>
            {/* Show up to 3 cards from waste pile in fanned layout */}
            {waste.slice(-3).map((card, index, visibleCards) => {
              const isTopCard = index === visibleCards.length - 1;
              const fanOffset = cardWidth * 0.25; // 25% card width offset between cards

              return (
                <div
                  key={`waste-${waste.length - 3 + index}`}
                  style={{
                    position: 'absolute',
                    left: `${index * fanOffset}px`,
                    top: 0,
                  }}
                  onClick={isTopCard ? onWasteClick : undefined}
                >
                  <CardFlip
                    card={card}
                    faceUp={true}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    fontSize={fontSize}
                    flipDuration={flipDuration}
                    isSelected={isTopCard && isWasteSelected}
                    draggable={isTopCard}
                    onDragStart={isTopCard && onDragStart ? onDragStart() : undefined}
                    onDragEnd={isTopCard ? onDragEnd : undefined}
                    onTouchStart={isTopCard && onTouchStart ? onTouchStart() : undefined}
                    onTouchEnd={isTopCard ? onTouchEnd : undefined}
                  />
                </div>
              );
            })}
          </>
        ) : (
          <EmptyCell cardWidth={cardWidth} cardHeight={cardHeight} label="" />
        )}
      </div>
    </div>
  );
};
