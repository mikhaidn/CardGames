# 🂡 Card Games Collection

Classic solitaire games built with modern web technology. Play online at [mikhaidn.github.io/CardGames](https://mikhaidn.github.io/CardGames/)

## 🎮 Available Games

| Game | Status | Play Now |
|------|--------|----------|
| **FreeCell** | ✅ Live | [Play FreeCell](https://mikhaidn.github.io/CardGames/freecell/) |
| **Klondike** | ✅ Live | [Play Klondike](https://mikhaidn.github.io/CardGames/klondike/) |
| Spider Solitaire | 🚧 Coming Soon | - |
| Pyramid | 🚧 Coming Soon | - |
| Tri-Peaks | 🚧 Coming Soon | - |
| Yukon | 🚧 Coming Soon | - |

## 🏗️ Architecture

This is a **monorepo** built with npm workspaces, featuring:

- **Shared library** (`@cardgames/shared`) - Reusable game components, hooks, and utilities
- **Individual games** - FreeCell and Klondike, each as standalone apps
- **React + TypeScript + Vite** - Modern web stack with full type safety
- **GitHub Pages** - Auto-deployment on push to `main`

```
CardGames/
├── shared/           # @cardgames/shared library
│   ├── components/   # GameControls, DraggingCardPreview, Card, CardBack
│   ├── hooks/        # useGameHistory, useCardInteraction
│   └── utils/        # Common utilities
├── freecell-mvp/     # FreeCell game
├── klondike-mvp/     # Klondike game
├── index.html        # Root landing page (game selector)
├── docs/             # Documentation
└── rfcs/             # Design documents (Request for Comments)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation & Development

```bash
# Install all dependencies
npm install

# Build shared library
npm run build -w shared

# Run a game in development mode
cd freecell-mvp && npm run dev
# or
cd klondike-mvp && npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build everything
npm run build
```

## 🧪 Testing

Each game has comprehensive test coverage:

```bash
# Run all tests
npm test

# Watch mode for TDD
npm run test:watch

# Coverage report
npm run test:coverage

# Game-specific tests
cd freecell-mvp && npm test
cd klondike-mvp && npm test
cd shared && npm test
```

## 📚 Documentation

### For Developers
- **[AI_GUIDE.md](AI_GUIDE.md)** - 30-second quick start for AI agents
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and design decisions
- **[STATUS.md](STATUS.md)** - Current work status and sprint progress
- **[ROADMAP.md](ROADMAP.md)** - Future plans and priorities
- **[DOCS.md](DOCS.md)** - Complete documentation index

### For Contributors
- **[rfcs/](rfcs/)** - Request for Comments (design proposals)
- **[docs/development/](docs/development/)** - Testing, monorepo setup, version management
- **[docs/deployment/](docs/deployment/)** - GitHub Pages, PWA, native apps
- **[docs/games/](docs/games/)** - Game-specific documentation

## 🤝 Contributing

1. Check **[STATUS.md](STATUS.md)** to see what's being worked on
2. Review **[ROADMAP.md](ROADMAP.md)** for priorities
3. Read relevant **[RFCs](rfcs/INDEX.md)** for design decisions
4. Write tests first (TDD approach)
5. Run `npm run lint && npm test && npm run build` before committing

## 📦 Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Unit testing
- **@testing-library/react** - Component testing
- **ESLint** - Code linting
- **npm workspaces** - Monorepo management

## 🌐 Deployment

Games are automatically deployed to GitHub Pages when pushing to `main`:

- **Root:** https://mikhaidn.github.io/CardGames/
- **FreeCell:** https://mikhaidn.github.io/CardGames/freecell/
- **Klondike:** https://mikhaidn.github.io/CardGames/klondike/

See **[docs/deployment/github-pages.md](docs/deployment/github-pages.md)** for details.

## ✨ Features

### Shared Components
- **GameControls** - New Game, Undo, Redo, Settings, Help buttons
- **DraggingCardPreview** - Visual feedback during drag
- **Card/CardBack** - Unified card rendering with customizable backs
- **useGameHistory** - Undo/redo state management
- **useCardInteraction** - Unified drag-and-drop + click interactions

### Game Features
- Responsive design (mobile, tablet, desktop)
- Undo/redo support
- Reproducible games (seeded RNG)
- Drag-and-drop card movement
- Click-to-select on touch devices
- Win detection and celebration
- Statistics tracking (time, moves)

## 📄 License

[Add your license here]

## 🐛 Issues

Found a bug? [Create an issue](https://github.com/mikhaidn/CardGames/issues)
