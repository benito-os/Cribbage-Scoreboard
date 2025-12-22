# Pepper Scorekeeper

A scorekeeping application for the Pepper card game, a classic Midwestern trick-taking game similar to Euchre.

## Overview

This app helps players track scores during in-person Pepper card games. It handles:
- 3 or 4 player games with appropriate target scores (32 for 3 players, 25 for 4 players)
- Bidding (1-6 for 4 players, 1-8 for 3 players, plus Pepper and Pepper No special bids)
- Trump suit selection
- Round results with automatic score calculation
- Round history with undo capability
- Auto-save to localStorage

## Technical Architecture

### Frontend (React + TypeScript)
- **Routing**: wouter for navigation between setup and game screens
- **State Management**: React Context (GameProvider) with localStorage persistence
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS with Inter font

### Key Files
- `client/src/lib/gameContext.tsx` - Game state management and persistence
- `client/src/pages/game-setup.tsx` - Initial setup screen
- `client/src/pages/active-game.tsx` - Main game screen
- `client/src/components/` - UI components (BidDialog, RoundResultDialog, PlayerScoreCard, etc.)
- `shared/schema.ts` - TypeScript types and game logic helpers

### Backend
- Minimal Express server serving the React frontend
- No API endpoints needed - all game state is client-side

## Game Rules Summary

1. **Bidding**: Players bid tricks (1-8 for 3 players, 1-6 for 4 players)
2. **Pepper**: Special bid of 9 (3-player) or 7 (4-player) with trump
3. **Pepper No**: Same as Pepper but with no trump suit
4. **Scoring**: Make bid = +bid points, Miss bid = -bid points
5. **Winning**: First to reach target score (32 for 3 players, 25 for 4 players)

## Running the App

```bash
npm run dev
```

The app runs on port 5000 with Vite HMR for development.
