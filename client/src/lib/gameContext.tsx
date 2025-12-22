import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { GameState, Player, Round, TrumpSuit, BidType } from "@shared/schema";
import { getTargetScore, calculateScoreChange, getPepperBid } from "@shared/schema";

const STORAGE_KEY = "pepper-game-state";

interface GameContextType {
  gameState: GameState | null;
  createGame: (playerCount: 3 | 4, playerNames: string[], dealerIndex: number) => void;
  startBidding: () => void;
  submitBid: (bidderId: string, amount: number, type: BidType, trumpSuit: TrumpSuit) => void;
  submitRoundResult: (tricksWon: number) => void;
  undoLastRound: () => void;
  resetGame: () => void;
  getPlayer: (id: string) => Player | undefined;
  getCurrentDealer: () => Player | undefined;
  canUndo: boolean;
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

  const submitRoundResult = useCallback((tricksWon: number) => {
    setGameState(prev => {
      if (!prev || !prev.currentBid?.bidderId) return prev;

      const { bidderId, amount, type, trumpSuit } = prev.currentBid;
      const effectiveAmount = type === "standard" ? amount! : getPepperBid(prev.playerCount);
      const { success, scoreChange } = calculateScoreChange(
        amount!,
        type!,
        tricksWon,
        prev.playerCount
      );

      const newRound: Round = {
        id: generateId(),
        roundNumber: prev.rounds.length + 1,
        dealerId: prev.players[prev.currentDealerIndex].id,
        bidderId,
        bidAmount: effectiveAmount,
        bidType: type!,
        trumpSuit: trumpSuit!,
        tricksWon,
        bidSuccess: success,
        scoreChange,
      };

      const updatedPlayers = prev.players.map(player => {
        if (player.id === bidderId) {
          return { ...player, score: player.score + scoreChange };
        }
        return player;
      });

      // Check for winner
      const winner = updatedPlayers.find(p => p.score >= prev.targetScore);

      // Rotate dealer
      const nextDealerIndex = (prev.currentDealerIndex + 1) % prev.playerCount;
      const playersWithDealer = updatedPlayers.map((p, i) => ({
        ...p,
        isDealer: i === nextDealerIndex,
      }));

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
      const updatedPlayers = prev.players.map(player => {
        if (player.id === lastRound.bidderId) {
          return { ...player, score: player.score - lastRound.scoreChange };
        }
        return player;
      });

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

  return (
    <GameContext.Provider
      value={{
        gameState,
        createGame,
        startBidding,
        submitBid,
        submitRoundResult,
        undoLastRound,
        resetGame,
        getPlayer,
        getCurrentDealer,
        canUndo,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
