import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { GameState, Player, Round, TrumpSuit, BidType, PlayerTricks, PlayerParticipation } from "@shared/schema";
import { getTargetScore, calculateAllScoreChanges, getPepperBid } from "@shared/schema";

const STORAGE_KEY = "pepper-game-state";

interface GameContextType {
  gameState: GameState | null;
  createGame: (playerCount: 3 | 4, playerNames: string[], dealerIndex: number) => void;
  startBidding: () => void;
  submitBid: (bidderId: string, amount: number, type: BidType, trumpSuit: TrumpSuit) => void;
  submitRoundResult: (playerTricks: PlayerTricks, playerParticipation?: PlayerParticipation) => void;
  undoLastRound: () => void;
  redoRound: () => void;
  resetGame: () => void;
  reorderPlayers: (newOrder: Player[]) => void;
  getPlayer: (id: string) => Player | undefined;
  getCurrentDealer: () => Player | undefined;
  canUndo: boolean;
  canRedo: boolean;
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

  // Redo stack for undone rounds
  const [redoStack, setRedoStack] = useState<{
    round: Round;
    dealerIndex: number;
    playerScores: Record<string, number>;
  }[]>([]);

  // Persist state to localStorage
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  const createGame = useCallback((playerCount: 3 | 4, playerNames: string[], dealerIndex: number) => {
    const players: Player[] = playerNames.map((name, index) => ({
      id: generateId(),
      name,
      score: 0,
      isDealer: index === dealerIndex,
    }));

    const newGame: GameState = {
      id: generateId(),
      playerCount,
      targetScore: getTargetScore(playerCount),
      players,
      rounds: [],
      currentDealerIndex: dealerIndex,
      gamePhase: "bidding",
    };

    setGameState(newGame);
  }, []);

  const startBidding = useCallback(() => {
    setGameState(prev => prev ? { ...prev, gamePhase: "bidding", currentBid: undefined } : null);
  }, []);

  const submitBid = useCallback((bidderId: string, amount: number, type: BidType, trumpSuit: TrumpSuit) => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        gamePhase: "playing",
        currentBid: {
          bidderId,
          amount,
          type,
          trumpSuit,
        },
      };
    });
  }, []);

  const submitRoundResult = useCallback((playerTricks: PlayerTricks, playerParticipation?: PlayerParticipation) => {
    setGameState(prev => {
      if (!prev || !prev.currentBid?.bidderId) return prev;

      const { bidderId, amount, type, trumpSuit } = prev.currentBid;
      const effectiveAmount = type === "standard" ? amount! : getPepperBid(prev.playerCount);
      
      const { success, scoreChanges } = calculateAllScoreChanges(
        bidderId,
        amount!,
        type!,
        playerTricks,
        prev.playerCount,
        trumpSuit,
        playerParticipation
      );

      const newRound: Round = {
        id: generateId(),
        roundNumber: prev.rounds.length + 1,
        dealerId: prev.players[prev.currentDealerIndex].id,
        bidderId,
        bidAmount: effectiveAmount,
        bidType: type!,
        trumpSuit: trumpSuit!,
        playerTricks,
        playerParticipation,
        bidSuccess: success,
        scoreChanges,
      };

      // Update all player scores
      const updatedPlayers = prev.players.map(player => ({
        ...player,
        score: player.score + (scoreChanges[player.id] ?? 0),
      }));

      // Check for winner (highest score if multiple reach target)
      const winners = updatedPlayers.filter(p => p.score >= prev.targetScore);
      const winner = winners.length > 0 
        ? winners.reduce((a, b) => a.score >= b.score ? a : b)
        : null;

      // Rotate dealer
      const nextDealerIndex = (prev.currentDealerIndex + 1) % prev.playerCount;
      const playersWithDealer = updatedPlayers.map((p, i) => ({
        ...p,
        isDealer: i === nextDealerIndex,
      }));

      // Clear redo stack when a new round is submitted
      setRedoStack([]);

      return {
        ...prev,
        players: playersWithDealer,
        rounds: [...prev.rounds, newRound],
        currentDealerIndex: nextDealerIndex,
        gamePhase: winner ? "complete" : "bidding",
        currentBid: undefined,
        winnerId: winner?.id,
      };
    });
  }, []);

  const undoLastRound = useCallback(() => {
    setGameState(prev => {
      if (!prev || prev.rounds.length === 0) return prev;

      const lastRound = prev.rounds[prev.rounds.length - 1];
      
      // Save to redo stack before removing
      const playerScores: Record<string, number> = {};
      prev.players.forEach(p => { playerScores[p.id] = p.score; });
      setRedoStack(stack => [...stack, {
        round: lastRound,
        dealerIndex: prev.currentDealerIndex,
        playerScores,
      }]);
      
      // Reverse all score changes
      const updatedPlayers = prev.players.map(player => ({
        ...player,
        score: player.score - (lastRound.scoreChanges[player.id] ?? 0),
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
        rounds: prev.rounds.slice(0, -1),
        currentDealerIndex: prevDealerIndex,
        gamePhase: "bidding",
        winnerId: undefined,
      };
    });
  }, []);

  const redoRound = useCallback(() => {
    if (redoStack.length === 0) return;

    const lastUndo = redoStack[redoStack.length - 1];
    setRedoStack(stack => stack.slice(0, -1));

    setGameState(prev => {
      if (!prev) return prev;

      const { round, dealerIndex, playerScores } = lastUndo;

      // Restore player scores and dealer flag based on stored dealerIndex
      const updatedPlayers = prev.players.map((player, idx) => ({
        ...player,
        score: playerScores[player.id] ?? player.score,
        isDealer: idx === dealerIndex,
      }));

      // Check for winner
      const winners = updatedPlayers.filter(p => p.score >= prev.targetScore);
      const winner = winners.length > 0 
        ? winners.reduce((a, b) => a.score >= b.score ? a : b)
        : null;

      return {
        ...prev,
        players: updatedPlayers,
        rounds: [...prev.rounds, round],
        currentDealerIndex: dealerIndex,
        gamePhase: winner ? "complete" : "bidding",
        winnerId: winner?.id,
      };
    });
  }, [redoStack]);

  const reorderPlayers = useCallback((newOrder: Player[]) => {
    setGameState(prev => {
      if (!prev) return prev;
      
      // Find the current dealer's ID
      const currentDealerId = prev.players[prev.currentDealerIndex]?.id;
      
      // Find the new index of the dealer
      const newDealerIndex = newOrder.findIndex(p => p.id === currentDealerId);
      
      // Update dealer flags
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

  const canUndo = (gameState?.rounds.length ?? 0) > 0;
  const canRedo = redoStack.length > 0;

  return (
    <GameContext.Provider
      value={{
        gameState,
        createGame,
        startBidding,
        submitBid,
        submitRoundResult,
        undoLastRound,
        redoRound,
        resetGame,
        reorderPlayers,
        getPlayer,
        getCurrentDealer,
        canUndo,
        canRedo,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
