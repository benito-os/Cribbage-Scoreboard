import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { GameState, Player, HandResult, Card, ScoreEntry, GamePhase } from "@shared/schema";
import { getTargetScore, getSkunkStatus, checkHisHeels } from "@shared/schema";

const STORAGE_KEY = "cribbage-game-state";

interface PlayerInput {
  name: string;
  profileId?: string;
}

interface GameContextType {
  gameState: GameState | null;
  createGame: (playerCount: 2 | 3 | 4, players: PlayerInput[], dealerIndex: number) => void;
  setStarterCard: (card: Card) => void;
  submitPeggingScores: (scores: Record<string, number>) => void;
  submitHandScore: (entry: ScoreEntry) => void;
  submitCribScore: (entry: ScoreEntry) => void;
  finishHand: () => void;
  undoLastHand: () => void;
  redoHand: () => void;
  resetGame: () => void;
  reorderPlayers: (newOrder: Player[]) => void;
  getPlayer: (id: string) => Player | undefined;
  getCurrentDealer: () => Player | undefined;
  canUndo: boolean;
  canRedo: boolean;
  onGameComplete: ((completedGame: GameState | null) => void) | null;
  setOnGameComplete: (callback: ((completedGame: GameState | null) => void) | null) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [redoStack, setRedoStack] = useState<{
    hand: HandResult;
    dealerIndex: number;
    playerScores: Record<string, number>;
  }[]>([]);

  const [onGameComplete, setOnGameComplete] = useState<((completedGame: GameState | null) => void) | null>(null);
  const [processedGameIds, setProcessedGameIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (gameState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  useEffect(() => {
    if (
      gameState?.gamePhase === "complete" && 
      gameState?.id && 
      !processedGameIds.has(gameState.id) &&
      onGameComplete
    ) {
      setProcessedGameIds(prev => new Set(Array.from(prev).concat(gameState.id)));
      onGameComplete(gameState);
    }
  }, [gameState?.gamePhase, gameState?.id, processedGameIds, onGameComplete]);

  const createGame = useCallback((playerCount: 2 | 3 | 4, playerInputs: PlayerInput[], dealerIndex: number) => {
    const players: Player[] = playerInputs.map((input, index) => ({
      id: generateId(),
      name: input.name,
      score: 0,
      isDealer: index === dealerIndex,
      profileId: input.profileId,
    }));

    const newGame: GameState = {
      id: generateId(),
      playerCount,
      targetScore: getTargetScore(),
      players,
      hands: [],
      currentDealerIndex: dealerIndex,
      gamePhase: "pegging",
      currentHand: {
        peggingScores: {},
        handScores: [],
      },
    };

    setGameState(newGame);
    setRedoStack([]);
    setProcessedGameIds(new Set());
  }, []);

  const setStarterCard = useCallback((card: Card) => {
    setGameState(prev => {
      if (!prev) return null;
      
      // Check for His Heels - if starter is a Jack, dealer gets 2 points
      let updatedPlayers = prev.players;
      let hisHeelsAwarded = false;
      let hisHeelsPoints = 0;
      
      if (checkHisHeels(card)) {
        const dealerId = prev.players[prev.currentDealerIndex].id;
        updatedPlayers = prev.players.map(player => {
          if (player.id === dealerId) {
            return { ...player, score: player.score + 2 };
          }
          return player;
        });
        hisHeelsAwarded = true;
        hisHeelsPoints = 2;
      }
      
      // Check for winner after His Heels
      const winners = updatedPlayers.filter(p => p.score >= prev.targetScore);
      const winner = winners.length > 0 
        ? winners.reduce((a, b) => a.score >= b.score ? a : b)
        : null;
      
      return {
        ...prev,
        players: updatedPlayers,
        currentHand: {
          ...prev.currentHand,
          starterCard: card,
          hisHeelsAwarded,
          hisHeelsPoints,
        },
        gamePhase: winner ? "complete" : prev.gamePhase,
        winnerId: winner?.id,
      };
    });
  }, []);

  const submitPeggingScores = useCallback((scores: Record<string, number>) => {
    setGameState(prev => {
      if (!prev) return null;
      
      // Apply pegging scores immediately to check for winner during pegging
      const updatedPlayers = prev.players.map(player => ({
        ...player,
        score: player.score + (scores[player.id] ?? 0),
      }));

      // Check for winner
      const winners = updatedPlayers.filter(p => p.score >= prev.targetScore);
      const winner = winners.length > 0 
        ? winners.reduce((a, b) => a.score >= b.score ? a : b)
        : null;

      return {
        ...prev,
        players: updatedPlayers,
        currentHand: {
          ...prev.currentHand,
          peggingScores: scores,
        },
        gamePhase: winner ? "complete" : "counting",
        winnerId: winner?.id,
      };
    });
  }, []);

  const submitHandScore = useCallback((entry: ScoreEntry) => {
    setGameState(prev => {
      if (!prev) return null;
      
      // Apply hand score immediately
      const updatedPlayers = prev.players.map(player => {
        if (player.id === entry.playerId) {
          return { ...player, score: player.score + entry.points };
        }
        return player;
      });

      // Check for winner
      const winners = updatedPlayers.filter(p => p.score >= prev.targetScore);
      const winner = winners.length > 0 
        ? winners.reduce((a, b) => a.score >= b.score ? a : b)
        : null;

      const existingScores = prev.currentHand?.handScores ?? [];
      
      return {
        ...prev,
        players: updatedPlayers,
        currentHand: {
          ...prev.currentHand,
          handScores: [...existingScores, entry],
        },
        gamePhase: winner ? "complete" : prev.gamePhase,
        winnerId: winner?.id,
      };
    });
  }, []);

  const submitCribScore = useCallback((entry: ScoreEntry) => {
    setGameState(prev => {
      if (!prev) return null;
      
      // Apply crib score
      const updatedPlayers = prev.players.map(player => {
        if (player.id === entry.playerId) {
          return { ...player, score: player.score + entry.points };
        }
        return player;
      });

      // Check for winner
      const winners = updatedPlayers.filter(p => p.score >= prev.targetScore);
      const winner = winners.length > 0 
        ? winners.reduce((a, b) => a.score >= b.score ? a : b)
        : null;

      return {
        ...prev,
        players: updatedPlayers,
        currentHand: {
          ...prev.currentHand,
          cribScore: entry,
        },
        gamePhase: winner ? "complete" : prev.gamePhase,
        winnerId: winner?.id,
      };
    });
  }, []);

  const finishHand = useCallback(() => {
    setGameState(prev => {
      if (!prev || !prev.currentHand) return prev;

      const { peggingScores, handScores, cribScore, starterCard, hisHeelsPoints } = prev.currentHand;
      const dealerId = prev.players[prev.currentDealerIndex].id;
      
      // Calculate total score changes for this hand (including His Heels for dealer)
      const scoreChanges: Record<string, number> = {};
      for (const player of prev.players) {
        scoreChanges[player.id] = 
          (peggingScores?.[player.id] ?? 0) +
          (handScores?.find(s => s.playerId === player.id)?.points ?? 0) +
          (cribScore?.playerId === player.id ? cribScore.points : 0) +
          (player.id === dealerId ? (hisHeelsPoints ?? 0) : 0);
      }

      const newHand: HandResult = {
        id: generateId(),
        handNumber: prev.hands.length + 1,
        dealerId,
        starterCard,
        peggingScores: peggingScores ?? {},
        handScores: handScores ?? [],
        cribScore,
        hisHeelsPoints: hisHeelsPoints ?? undefined,
        scoreChanges,
      };

      // Rotate dealer
      const nextDealerIndex = (prev.currentDealerIndex + 1) % prev.playerCount;
      const playersWithDealer = prev.players.map((p, i) => ({
        ...p,
        isDealer: i === nextDealerIndex,
      }));

      setRedoStack([]);

      return {
        ...prev,
        players: playersWithDealer,
        hands: [...prev.hands, newHand],
        currentDealerIndex: nextDealerIndex,
        gamePhase: "pegging",
        currentHand: {
          peggingScores: {},
          handScores: [],
        },
      };
    });
  }, []);

  const undoLastHand = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.hands.length === 0) return prev;

      const lastHand = prev.hands[prev.hands.length - 1];
      
      const playerScores: Record<string, number> = {};
      prev.players.forEach(p => { playerScores[p.id] = p.score; });
      setRedoStack(stack => [...stack, {
        hand: lastHand,
        dealerIndex: prev.currentDealerIndex,
        playerScores,
      }]);
      
      // Reverse all score changes
      const updatedPlayers = prev.players.map(player => ({
        ...player,
        score: player.score - (lastHand.scoreChanges[player.id] ?? 0),
      }));

      // Restore previous dealer
      const prevDealerIndex = (prev.currentDealerIndex - 1 + prev.playerCount) % prev.playerCount;
      const playersWithDealer = updatedPlayers.map((p, i) => ({
        ...p,
        isDealer: i === prevDealerIndex,
      }));

      return {
        ...prev,
        players: playersWithDealer,
        hands: prev.hands.slice(0, -1),
        currentDealerIndex: prevDealerIndex,
        gamePhase: "pegging",
        currentHand: {
          peggingScores: {},
          handScores: [],
        },
        winnerId: undefined,
      };
    });
  }, []);

  const redoHand = useCallback(() => {
    if (redoStack.length === 0) return;

    const lastUndo = redoStack[redoStack.length - 1];
    setRedoStack(stack => stack.slice(0, -1));

    setGameState(prev => {
      if (!prev) return prev;

      const { hand, dealerIndex, playerScores } = lastUndo;

      const updatedPlayers = prev.players.map((player, idx) => ({
        ...player,
        score: playerScores[player.id] ?? player.score,
        isDealer: idx === dealerIndex,
      }));

      const winners = updatedPlayers.filter(p => p.score >= prev.targetScore);
      const winner = winners.length > 0 
        ? winners.reduce((a, b) => a.score >= b.score ? a : b)
        : null;

      return {
        ...prev,
        players: updatedPlayers,
        hands: [...prev.hands, hand],
        currentDealerIndex: dealerIndex,
        gamePhase: winner ? "complete" : "pegging",
        winnerId: winner?.id,
      };
    });
  }, [redoStack]);

  const reorderPlayers = useCallback((newOrder: Player[]) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const currentDealerId = prev.players[prev.currentDealerIndex]?.id;
      const newDealerIndex = newOrder.findIndex(p => p.id === currentDealerId);
      
      const playersWithDealer = newOrder.map((p, i) => ({
        ...p,
        isDealer: i === newDealerIndex,
      }));

      return {
        ...prev,
        players: playersWithDealer,
        currentDealerIndex: newDealerIndex >= 0 ? newDealerIndex : 0,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(null);
  }, []);

  const getPlayer = useCallback((id: string) => {
    return gameState?.players.find(p => p.id === id);
  }, [gameState]);

  const getCurrentDealer = useCallback(() => {
    if (!gameState) return undefined;
    return gameState.players[gameState.currentDealerIndex];
  }, [gameState]);

  const canUndo = (gameState?.hands.length ?? 0) > 0;
  const canRedo = redoStack.length > 0;

  return (
    <GameContext.Provider
      value={{
        gameState,
        createGame,
        setStarterCard,
        submitPeggingScores,
        submitHandScore,
        submitCribScore,
        finishHand,
        undoLastHand,
        redoHand,
        resetGame,
        reorderPlayers,
        getPlayer,
        getCurrentDealer,
        canUndo,
        canRedo,
        onGameComplete,
        setOnGameComplete,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
