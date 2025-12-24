# RFC-005: Unified Game Builder & UI Perfection Strategy

**Status**: Proposed
**Created**: 2025-12-24
**Author**: Architecture Team

## Table of Contents

- [Overview](#overview)
- [Current State Assessment](#current-state-assessment)
- [Problem Statement](#problem-statement)
- [Proposed Solution](#proposed-solution)
- [Implementation Phases](#implementation-phases)
- [Timeline & Effort Estimates](#timeline--effort-estimates)
- [Success Criteria](#success-criteria)
- [Risks & Mitigations](#risks--mitigations)
- [Alternative Approaches](#alternative-approaches)
- [Decision: UI Before or After Unification](#decision-ui-before-or-after-unification)

## Overview

This RFC proposes a strategic roadmap to achieve a **config-driven game builder system** where adding new solitaire games (like Spider, Pyramid, Golf, etc.) requires only a single configuration file and minimal game-specific code.

Additionally, it addresses the question of **when to invest in UI perfection** relative to the unification effort.

### Goals

1. **Reduce new game effort from 3-4 days to <1 day**
2. **Enable config-driven game definition**
3. **Eliminate code duplication** (~600-700 lines currently duplicated)
4. **Perfect UI once, benefit all games** (animations, accessibility, mobile)
5. **Maintain type safety and flexibility**

## Current State Assessment

### Architecture Maturity Score: 72/100

| Component | Maturity | Status |
|-----------|----------|--------|
| **Shared Library** | 90% | ✅ Excellent - Components, hooks, rules are highly reusable |
| **Type Safety** | 85% | ✅ Good - Strong interfaces, minor inconsistencies |
| **Validation Rules** | 80% | ✅ Good - Core rules shared, game-specific well organized |
| **Move Execution** | 60% | ⚠️ Needs work - Different patterns between games |
| **Component Reuse** | 70% | ⚠️ Partial - Tableau/Foundation reusable but need abstraction |
| **State Management** | 50% | ⚠️ Needs work - Different schemas, no shared pattern |
| **Configuration** | 30% | ❌ Missing - No config-driven game setup |
| **Documentation** | 75% | ✅ Good - Strong docs, needs unified pattern guide |
| **Test Coverage** | 85% | ✅ Excellent - 1600+ tests |
| **Deployment** | 90% | ✅ Excellent - Monorepo auto-deploy |

### What's Already Shared (1835 lines)

**Components** (`@cardgames/shared/components/`):
- `Card.tsx` - Universal card display
- `CardBack.tsx` - Card back patterns
- `EmptyCell.tsx` - Empty slot placeholder
- `GameControls.tsx` - New Game/Undo/Redo/Settings
- `DraggingCardPreview.tsx` - Drag feedback

**Hooks** (`@cardgames/shared/hooks/`):
- `useGameHistory.ts` - Undo/redo + localStorage
- `useCardInteraction.ts` - Unified drag + click interaction

**Rules** (`@cardgames/shared/rules/`):
- `solitaireRules.ts` - Color detection, stacking, sequences
- Fully reusable across tableau-based games

**Types** (`@cardgames/shared/types/`):
- `Card.ts`, `GameLocation.ts`, `CardInteraction.ts`
- Unified location type supports all current games

### What's Still Duplicated (~620 lines)

**Move Execution Patterns**:
- Klondike: Generic `moveCards(state, from, to, count)` (~160 lines)
- FreeCell: Specialized functions (`moveCardToFreeCell`, `moveCardFromFreeCell`, etc.) (~180 lines)
- **Pattern inconsistency prevents easy abstraction**

**Validation Logic**:
- Similar structure, different implementations (~170 lines duplicated)
- Both games validate tableau→tableau, tableau→foundation, etc.

**Component Layout**:
- `GameBoard.tsx`: ~450 lines (Klondike) vs ~550 lines (FreeCell)
- Similar structure, different game-specific areas (~250 lines duplicated)

**UI Handlers**:
- Drag/drop + click handlers (~80 lines duplicated)
- Being consolidated via `useCardInteraction` hook

## Problem Statement

### Current Pain Points

1. **Adding Spider Solitaire requires 3-4 days of work**:
   - Write game state schema (~50 lines)
   - Implement validation rules (~80-100 lines)
   - Build move execution (~150-200 lines)
   - Create game components (~400-500 lines)
   - Write tests (~500+ lines)
   - **Total: ~1200 lines of code**

2. **Code duplication across games**:
   - Similar validation patterns reimplemented
   - Move execution follows different patterns
   - UI components have overlapping logic

3. **UI perfection is 2-3x effort**:
   - Polishing Klondike UI doesn't benefit FreeCell
   - Must reimplement animations, transitions, mobile optimizations for each game

4. **No clear pattern for new contributors**:
   - Hard to know which code to copy/modify for new games
   - No single source of truth for "how to add a game"

### Desired End State

**Adding Spider Solitaire (or any new game) should be:**

```typescript
// spider/spider.config.ts (~100-150 lines total)
export const SpiderConfig: GameConfig<SpiderGameState> = {
  metadata: {
    name: 'Spider Solitaire',
    id: 'spider',
    description: 'Classic 2-suit Spider'
  },

  layout: {
    numTableauColumns: 10,
    numFoundations: 8,
    specialAreas: ['stock']
  },

  rules: {
    tableauStackRule: 'sameSuit',
    emptyTableauRule: 'anyCard',
    foundationRule: 'completeSuit'
  },

  actions: SpiderGameActions,  // ~200 lines of game logic
  component: SpiderLayout       // ~50 lines of layout config
}

// Then just: const game = createGame(SpiderConfig);
```

**Effort to add Spider: <1 day** (vs current 3-4 days)

## Proposed Solution

### Three-Phase Approach

```
Phase 1: UI Prototype (2-3 days)
         ↓
Phase 2: Unification (3-4 weeks)
         ↓
Phase 3: Perfect UI (2-4 weeks)
```

### Phase 1: UI Exploration & Requirements (2-3 days)

**Goal**: Understand what "perfect UI" requires from the architecture

**Activities**:
- Pick one game (Klondike) as prototype
- Quickly experiment with UI improvements:
  - Smooth drag animations (spring physics?)
  - Card flip animations
  - Win celebration effects
  - Mobile touch optimization
  - Auto-complete animations
  - Visual polish (shadows, glows, transitions)
- **Document findings**: "Perfect UI needs X, Y, Z capabilities"
- Identify abstraction requirements:
  - Does animation state belong in game state?
  - What lifecycle hooks do components need?
  - What props are required for customization?

**Deliverables**:
- `/docs/architecture/ui-requirements.md` - Document of UI needs
- Prototype branch with experimental UI improvements
- Requirements for Phase 2 abstraction design

**Why This First?**
- Prevents building an abstraction that makes perfect UI hard
- Cheap to explore before committing to architecture
- Provides concrete requirements for generic components

### Phase 2: Game Unification (3-4 weeks)

**Goal**: Build a config-driven game builder system

#### Week 1-2: Standardize Move Execution

**Create shared action interface**:

```typescript
// shared/types/GameActions.ts (NEW)
export interface GameActions<TState> {
  // Core game logic
  validateMove: (state: TState, from: GameLocation, to: GameLocation) => boolean;
  executeMove: (state: TState, from: GameLocation, to: GameLocation) => TState | null;
  getCardAt: (state: TState, location: GameLocation) => Card | Card[] | null;

  // Game lifecycle
  initializeGame: (seed: number) => TState;
  isGameWon: (state: TState) => boolean;

  // Auto-actions (optional)
  getAutoMoves?: (state: TState) => Array<{from: GameLocation, to: GameLocation}>;
}

// Each game implements this
export class KlondikeGameActions implements GameActions<KlondikeGameState> { ... }
export class FreeCellGameActions implements GameActions<FreeCellGameState> { ... }
export class SpiderGameActions implements GameActions<SpiderGameState> { ... }
```

**Extract shared patterns**:

```typescript
// shared/state/moveExecution.ts (NEW)
export function createMoveExecutor<TState>(
  actions: GameActions<TState>
) {
  return {
    executeMove: (state: TState, from: GameLocation, to: GameLocation) => {
      if (!actions.validateMove(state, from, to)) return null;
      return actions.executeMove(state, from, to);
    },
    // ... other shared logic
  };
}
```

**Migrate existing games**:
- Refactor Klondike to use `GameActions` interface
- Refactor FreeCell to use `GameActions` interface
- Extract common validation patterns to `shared/rules/`

**Effort**: 6-8 days

#### Week 2-3: Create Game Config System

**Define configuration interface**:

```typescript
// shared/types/GameConfig.ts (NEW)
export interface GameConfig<TState> {
  metadata: {
    name: string;           // "Klondike Solitaire"
    id: string;             // "klondike"
    description: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  };

  layout: {
    numTableauColumns: number;        // 7 (Klondike), 8 (FreeCell), 10 (Spider)
    numFoundations: number;           // Usually 4
    specialAreas: Array<'stock' | 'waste' | 'freeCells'>;
  };

  rules: {
    tableauStackRule: 'alternatingColors' | 'sameSuit' | 'any';
    emptyTableauRule: 'kingOnly' | 'anyCard' | 'none';
    foundationRule: 'sameSuit' | 'completeSuit';
  };

  actions: GameActions<TState>;
  component: React.ComponentType<GameLayoutProps<TState>>;

  // UI customization (from Phase 1 findings)
  animations?: {
    flipDuration?: number;
    dragSpring?: SpringConfig;
    winCelebration?: boolean;
  };

  // Feature flags
  features?: {
    hints?: boolean;
    autoComplete?: boolean;
    statistics?: boolean;
  };
}
```

**Build game factory**:

```typescript
// shared/core/createGame.ts (NEW)
export function createGame<TState>(config: GameConfig<TState>) {
  return {
    // Returns a React component ready to render
    GameComponent: () => {
      const [seed, setSeed] = useState(() => Date.now());
      const { currentState, pushState, undo, redo } = useGameHistory({
        initialState: config.actions.initializeGame(seed)
      });

      return (
        <GenericGameBoard
          config={config}
          gameState={currentState}
          onMove={(from, to) => {
            const newState = config.actions.executeMove(currentState, from, to);
            if (newState) pushState(newState);
          }}
          onUndo={undo}
          onRedo={redo}
          onNewGame={() => {
            const newSeed = Date.now();
            setSeed(newSeed);
            pushState(config.actions.initializeGame(newSeed));
          }}
        />
      );
    },

    // Metadata for routing, menus, etc.
    metadata: config.metadata,

    // Test utilities
    testHelpers: {
      initializeGame: config.actions.initializeGame,
      validateMove: config.actions.validateMove,
      // ...
    }
  };
}
```

**Create config files for existing games**:

```typescript
// klondike-mvp/src/klondike.config.ts (NEW)
export const KlondikeConfig: GameConfig<KlondikeGameState> = {
  metadata: { name: 'Klondike Solitaire', id: 'klondike', ... },
  layout: { numTableauColumns: 7, numFoundations: 4, specialAreas: ['stock', 'waste'] },
  rules: { tableauStackRule: 'alternatingColors', emptyTableauRule: 'kingOnly', ... },
  actions: new KlondikeGameActions(),
  component: KlondikeLayout
};
```

**Effort**: 2-3 days

#### Week 3-4: Generic Components

**Build flexible game board**:

```typescript
// shared/components/GenericGameBoard.tsx (NEW)
export function GenericGameBoard<TState>({
  config,
  gameState,
  onMove,
  onUndo,
  onRedo,
  onNewGame
}: GenericGameBoardProps<TState>) {

  const { state: interactionState, handlers } = useCardInteraction({
    validateMove: (from, to) => config.actions.validateMove(gameState, from, to),
    executeMove: (from, to) => {
      const newState = config.actions.executeMove(gameState, from, to);
      if (newState) onMove(from, to);
    }
  });

  return (
    <div className="game-container">
      <GameTopRow
        config={config}
        state={gameState}
        onUndo={onUndo}
        onRedo={onRedo}
        onNewGame={onNewGame}
      />

      <GenericTableau
        columns={getTableauColumns(gameState, config)}
        numColumns={config.layout.numTableauColumns}
        interactionState={interactionState}
        handlers={handlers}
      />

      {config.layout.specialAreas.includes('stock') && (
        <StockWasteArea state={gameState} handlers={handlers} />
      )}

      {config.layout.specialAreas.includes('freeCells') && (
        <FreeCellArea state={gameState} handlers={handlers} />
      )}
    </div>
  );
}
```

**Refactor game-specific components**:
- Make Tableau generic (works for 7, 8, or 10 columns)
- Make FoundationArea generic (configurable count)
- Keep StockWaste and FreeCellArea as specialized (only used by 1 game each)

**Design for animation hooks** (from Phase 1 requirements):

```typescript
// shared/hooks/useGameAnimations.ts (NEW)
export function useGameAnimations(config: GameConfig) {
  const [animationState, setAnimationState] = useState({
    flippingCards: [],
    celebrationActive: false,
    // ...
  });

  return {
    playCardFlip: (cardId: string) => { ... },
    playCelebration: () => { ... },
    // ...
  };
}
```

**Effort**: 8-10 days

**Total Phase 2 Effort**: 16-21 days (~3-4 weeks)

### Phase 3: Perfect UI (2-4 weeks)

**Goal**: Polish the unified system once, all games benefit

#### Week 1: Animation System

**Implement smooth animations**:
- Card drag with spring physics
- Card flip animations (3D transforms)
- Win celebration (confetti, card cascade)
- Undo/redo transitions
- Auto-move animations

**Technologies**:
- Framer Motion or React Spring for physics-based animations
- CSS transitions for simple state changes
- RequestAnimationFrame for complex sequences

**Integration with unified system**:
```typescript
// Animations configured per-game but implementation shared
const KlondikeConfig = {
  // ...
  animations: {
    flipDuration: 300,
    dragSpring: { tension: 300, friction: 25 },
    winCelebration: true,
    autoMoveDelay: 150
  }
};
```

**Effort**: 5-6 days

#### Week 2: Mobile & Touch Optimization

**Responsive design**:
- Adaptive card sizing (existing `responsiveLayout.ts` enhanced)
- Touch-friendly hit targets (minimum 44x44px)
- Mobile-specific gestures (double-tap for auto-move)
- Orientation handling (portrait vs landscape)

**Performance**:
- Virtual scrolling for long tableaus (Spider)
- Debounced drag handlers
- Optimized re-renders (React.memo)

**Testing**:
- Test on real devices (iOS Safari, Android Chrome)
- Touch event debugging
- Performance profiling

**Effort**: 5-6 days

#### Week 3: Accessibility

**ARIA labels and keyboard navigation**:
- Enhanced screen reader support
- Full keyboard controls (arrow keys for navigation)
- Focus management
- Announce moves/wins to screen readers

**Visual accessibility**:
- High contrast mode
- Reduced motion mode (respects `prefers-reduced-motion`)
- Colorblind-friendly card suits
- Customizable color schemes

**Testing**:
- Lighthouse accessibility audit (score >90)
- Screen reader testing (NVDA, VoiceOver)
- Keyboard-only navigation testing

**Effort**: 3-4 days

#### Week 4: Visual Polish & Themes

**Visual improvements**:
- Card shadows and depth
- Smooth gradients
- Subtle hover effects
- Empty slot indicators
- Move preview highlights

**Theme system**:
```typescript
interface Theme {
  name: string;
  colors: {
    background: string;
    cardFace: string;
    cardBack: string;
    foundation: string;
    // ...
  };
  cardStyle: 'classic' | 'modern' | 'minimal';
  animations: 'full' | 'reduced' | 'none';
}
```

**Built-in themes**:
- Classic green felt
- Modern dark mode
- High contrast
- Minimal/clean

**Effort**: 3-4 days

**Total Phase 3 Effort**: 16-20 days (~2-4 weeks)

## Timeline & Effort Estimates

### Summary

| Phase | Duration | Effort (days) | Deliverables |
|-------|----------|---------------|--------------|
| **Phase 1: UI Prototype** | Week 1 | 2-3 | UI requirements doc, prototype |
| **Phase 2: Unification** | Week 2-5 | 16-21 | GameActions, GameConfig, generic components |
| **Phase 3: Perfect UI** | Week 6-9 | 16-20 | Animations, mobile, a11y, themes |
| **Total** | **9 weeks** | **34-44 days** | Full unified system + polished UI |

### Milestones

**Week 1**: ✅ UI requirements documented
**Week 2**: ✅ GameActions interface implemented, Klondike migrated
**Week 3**: ✅ FreeCell migrated, GameConfig defined
**Week 4**: ✅ GenericGameBoard working for both games
**Week 5**: ✅ Full migration complete, Spider started
**Week 6**: ✅ Animation system complete
**Week 7**: ✅ Mobile optimization complete
**Week 8**: ✅ Accessibility complete
**Week 9**: ✅ Themes + final polish complete

## Success Criteria

### Phase 2 Success Metrics

- [ ] Adding Spider Solitaire takes **<1 day** (down from 3-4 days)
- [ ] New games require **<500 lines** of game-specific code (down from ~1200)
- [ ] All existing tests pass after migration
- [ ] No regression in functionality or performance
- [ ] Code duplication reduced by **>70%** (~600 lines → <200 lines)

### Phase 3 Success Metrics

- [ ] Lighthouse performance score **>90**
- [ ] Lighthouse accessibility score **>90**
- [ ] Smooth 60fps animations on mid-range mobile devices
- [ ] Touch targets meet WCAG 2.1 AA standards (44x44px minimum)
- [ ] Full keyboard navigation support
- [ ] Screen reader support (tested with NVDA + VoiceOver)
- [ ] Works offline (PWA)
- [ ] Themes apply consistently across all games

### Long-term Success (6 months)

- [ ] 5+ games implemented using unified system
- [ ] Each new game takes **<1 day** to implement
- [ ] Community contributors can add games without core team support
- [ ] Zero major refactorings needed
- [ ] UI polish improvements benefit all games simultaneously

## Risks & Mitigations

### Risk 1: Over-abstraction

**Risk**: Generic system becomes too complex, harder to maintain than duplicated code

**Mitigation**:
- Start with 2-3 concrete games before abstracting
- Keep escape hatches (games can override generic behavior)
- Regular code reviews to prevent unnecessary complexity
- Document "when to use generic vs custom" patterns

**Likelihood**: Medium
**Impact**: High
**Mitigation effectiveness**: High

### Risk 2: UI Requirements Change Architecture

**Risk**: Perfect UI needs features the abstraction doesn't support

**Mitigation**:
- **Phase 1 prototyping** explicitly addresses this
- Build UI requirements into abstraction from the start
- Allow per-game UI customization in config
- Animation hooks designed for flexibility

**Likelihood**: Low (with Phase 1 prototyping)
**Impact**: High
**Mitigation effectiveness**: Very High

### Risk 3: Migration Breaks Existing Games

**Risk**: Refactoring introduces bugs in Klondike/FreeCell

**Mitigation**:
- Maintain 1600+ existing tests during migration
- Migrate one game at a time (Klondike first, then FreeCell)
- Keep both old and new implementations during transition
- Thorough manual testing before deprecating old code

**Likelihood**: Medium
**Impact**: Medium
**Mitigation effectiveness**: High

### Risk 4: Timeline Overruns

**Risk**: 9 weeks becomes 12-15 weeks

**Mitigation**:
- Break work into small, shippable increments
- Prioritize core functionality over polish
- Phase 3 can be time-boxed (ship with "good enough" UI)
- Track progress weekly, adjust scope as needed

**Likelihood**: Medium
**Impact**: Low
**Mitigation effectiveness**: Medium

### Risk 5: Generic Components Are Slower

**Risk**: Abstraction adds performance overhead

**Mitigation**:
- Performance testing at each milestone
- React.memo and useMemo for expensive renders
- Virtual scrolling for long lists
- Benchmark against current implementations

**Likelihood**: Low
**Impact**: Medium
**Mitigation effectiveness**: High

## Alternative Approaches

### Alternative 1: Build Spider First, Refactor Later

**Approach**: Duplicate Klondike pattern for Spider, refactor when 3+ games exist

**Pros**:
- Faster to Spider (3-4 days vs 9 weeks)
- Easier to see abstraction patterns with 3 concrete examples
- Less upfront design risk

**Cons**:
- More total code duplication (~1200 lines for Spider)
- UI perfection must be done 3 times
- Refactoring 3 games is harder than 2
- Technical debt accumulates

**Verdict**: ❌ Not recommended if 5+ games planned. ✅ Acceptable if only 3 total games.

### Alternative 2: Full Framework (Like Phaser/PixiJS)

**Approach**: Use a game engine instead of custom React components

**Pros**:
- Built-in animation system
- Better performance for complex games
- Standardized patterns

**Cons**:
- Huge migration effort (rewrite everything)
- Loses React ecosystem (harder for web devs)
- Overkill for solitaire games
- Accessibility harder (canvas vs DOM)

**Verdict**: ❌ Not recommended. Current React approach is suitable.

### Alternative 3: UI First, Unification Later

**Approach**: Perfect Klondike/FreeCell UI, then unify

**Pros**:
- Immediate user value (polished games now)
- UI requirements are discovered naturally

**Cons**:
- **Must redo UI work during unification** (2-3 weeks wasted)
- Polish must be applied 2-3 times (before unification)
- Risk: abstraction makes current UI patterns impossible
- More total effort (polish 2x + unify vs unify + polish 1x)

**Verdict**: ❌ Not recommended. See detailed analysis below.

## Decision: UI Before or After Unification

### Recommendation: **UI AFTER unification** (with prototype first)

### Rationale

**The Core Problem with UI First**:

If we perfect Klondike's UI before unification:
1. Spend 2-3 weeks polishing Klondike UI
2. Spend 3-4 weeks on unification
3. Find that animations don't work with `GenericGameBoard` abstraction
4. **Rebuild animations for unified system** (1-2 weeks wasted)
5. Repeat for each game-specific optimization

**Total time: 8-10 weeks + rework**

**The Benefits of Unification First**:

If we unify before UI perfection:
1. Spend 2-3 days prototyping UI (understand requirements)
2. Spend 3-4 weeks building unified system **designed for those requirements**
3. Spend 2-4 weeks perfecting UI **once for all games**

**Total time: 6-9 weeks, zero rework**

### Why Prototype First Matters

**The key insight**: We need to know what perfect UI looks like **before** designing the abstraction, but we don't need to **build** perfect UI until after.

**Phase 1 prototyping answers**:
- Does animation state go in game state or separate?
- What lifecycle hooks do components need?
- Can we use CSS transitions or need JavaScript?
- How do mobile gestures integrate?

**Then Phase 2 designs for those requirements**:
```typescript
// Example: Prototype discovers we need animation callbacks
interface GameActions<TState> {
  executeMove: (...) => TState;
  onMoveAnimationComplete?: () => void;  // ← Added based on prototype
}
```

### Real-World Analogy

**UI First** = Renovate one room perfectly, then realize you need to knock down walls for an open floor plan, redo the room

**Prototype → Unify → Polish** = Sketch floor plan, then build open layout, then furnish all rooms

### Exception: Need Polished Demo Soon?

If you need to **ship a polished Klondike in 2 weeks**:
- Go ahead and perfect Klondike UI now
- Accept you'll rebuild some of it during unification
- Use it as the reference implementation for "what perfect looks like"
- Budget extra time for re-implementation

**But if timeline is flexible: Prototype → Unify → Perfect**

## Next Steps

### Immediate Actions (This Week)

1. **Review this RFC with team**
   - Discuss risks and timeline
   - Confirm approach (prototype → unify → polish)
   - Get buy-in for 9-week timeline

2. **Create project board**
   - Set up milestones for each week
   - Track progress on Phase 1/2/3 tasks
   - Assign owners for each component

3. **Start Phase 1 (UI Prototype)**
   - Create `prototype/ui-exploration` branch
   - Document current baseline (screenshots, performance metrics)
   - Begin experimenting with animations

### Phase 1 Kickoff (Week 1)

- [ ] Create `/docs/architecture/ui-requirements.md`
- [ ] Set up animation library (Framer Motion or React Spring)
- [ ] Prototype 3-5 key animations in Klondike
- [ ] Test on mobile devices
- [ ] Document findings and requirements

### Phase 2 Preparation (Week 1-2)

- [ ] Design `GameActions<TState>` interface
- [ ] Design `GameConfig<TState>` interface
- [ ] Plan migration strategy for Klondike
- [ ] Identify shared patterns to extract

### Communication Plan

- **Weekly updates**: Post progress to team channel
- **Demo sessions**: Show working prototypes at end of each phase
- **Documentation**: Update this RFC with learnings
- **Retrospective**: After each phase, document what worked/didn't

## Conclusion

The CardGames project is **70-75% of the way** to a unified game builder system. The foundation is excellent, with strong shared components, hooks, and rules.

**The proposed three-phase approach**:
1. **Prototype UI** (2-3 days) - Understand requirements
2. **Unify architecture** (3-4 weeks) - Build config-driven system
3. **Perfect UI** (2-4 weeks) - Polish once, benefit all games

**Result**:
- Adding new games: **3-4 days → <1 day**
- UI perfection: **Per-game effort → One-time effort**
- Code quality: **Duplication eliminated, patterns clear**
- Timeline: **9 weeks to complete solution**

This approach minimizes wasted effort, ensures the abstraction supports perfect UI, and sets up the project for long-term success with 5+ games.

---

**Status**: Awaiting team review and approval

**Next Action**: Schedule RFC review meeting
