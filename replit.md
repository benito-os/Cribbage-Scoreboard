# Cribbage Scorekeeper

A scorekeeping application for the Cribbage card game, the classic pegging and counting game.

## Overview

This app helps players track scores during in-person Cribbage games. It handles:
- 2, 3, or 4 player games with a target score of 121 points
- Pegging phase score entry
- Hand scoring with two modes:
  - **Card Entry Mode**: Select the 4 hand cards + starter card, app auto-calculates score with detailed breakdown (fifteens, pairs, runs, flushes, nobs)
  - **Manual Mode**: Just enter the point value directly
- Score editing before submission in case the calculation is wrong
- Crib scoring for the dealer
- Hand history with undo/redo capability
- Auto-save to localStorage
- Skunk and double-skunk tracking

## Technical Architecture

### Frontend (React + TypeScript)
- **Routing**: wouter for navigation between setup and game screens
- **State Management**: React Context (GameProvider) with localStorage persistence
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS with Inter font

### Key Files
- `client/src/lib/gameContext.tsx` - Game state management and persistence
- `client/src/lib/playerProfilesContext.tsx` - Player profiles and statistics
- `client/src/pages/game-setup.tsx` - Initial setup screen
- `client/src/pages/active-game.tsx` - Main game screen with scoring phases
- `client/src/components/card-selector.tsx` - Card selection UI for entering hands
- `client/src/components/score-entry-dialog.tsx` - Score entry with auto-calculation and manual modes
- `client/src/components/score-breakdown.tsx` - Visual breakdown of scoring combinations
- `shared/schema.ts` - TypeScript types and Cribbage scoring logic

### Backend
- Minimal Express server serving the React frontend
- No API endpoints needed - all game state is client-side

## Cribbage Scoring Summary

### During Play (Pegging)
- Fifteen: 2 points
- Pair: 2 points
- Three of a kind: 6 points
- Four of a kind: 12 points
- Run (3+ cards): 1 point per card
- 31: 2 points
- Go/Last card: 1 point

### Counting Hands/Crib
- Fifteen (any combo summing to 15): 2 points each
- Pair: 2 points
- Three of a kind: 6 points
- Four of a kind: 12 points
- Run (3+ consecutive cards): 1 point per card
- Flush (4 in hand): 4 points (5 if starter matches)
- Nobs (Jack matching starter suit): 1 point
- Maximum possible hand: 29 points

### Winning
- First to 121 points wins
- Skunk: Winner reaches 121 while opponent is under 91
- Double Skunk: Winner reaches 121 while opponent is under 61

## Running the App

```bash
npm run dev
```

The app runs on port 5000 with Vite HMR for development.
