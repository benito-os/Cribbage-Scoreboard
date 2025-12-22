import { useEffect, useCallback } from "react";
import { useGame } from "@/lib/gameContext";
import { usePlayerProfiles } from "@/lib/playerProfilesContext";
import type { GameState, HandResult } from "@shared/schema";
import { getSkunkStatus } from "@shared/schema";

export function useGameCompletion() {
  const { setOnGameComplete } = useGame();
  const { addCompletedGame, updatePlayerStats, recordGameEnd } = usePlayerProfiles();

  const handleGameComplete = useCallback((completedGame: GameState | null) => {
    if (!completedGame) return;
    const { players, hands, winnerId, playerCount, targetScore } = completedGame;

    const winner = players.find(p => p.id === winnerId);
    const winnerProfile = winner?.profileId;

    const lowestScore = Math.min(...players.filter(p => p.id !== winnerId).map(p => p.score));
    const skunkStatus = winner ? getSkunkStatus(winner.score, lowestScore) : "none";

    addCompletedGame({
      playerCount,
      targetScore,
      players: players.map(p => ({
        profileId: p.profileId,
        name: p.name,
        finalScore: p.score,
      })),
      hands,
      winnerId: winnerProfile,
      winnerName: winner?.name ?? "Unknown",
      totalHands: hands.length,
      skunkStatus,
    });

    players.forEach(player => {
      if (!player.profileId) return;

      hands.forEach((hand: HandResult) => {
        const handEntry = hand.handScores.find(s => s.playerId === player.id);
        const handScore = handEntry?.points ?? 0;
        const wasDealer = hand.dealerId === player.id;

        updatePlayerStats(player.profileId!, {
          handScore,
          wasDealer,
        });
      });

      const wasSkunk = skunkStatus === "skunk" || skunkStatus === "doubleSkunk";
      recordGameEnd(
        player.profileId, 
        player.id === winnerId,
        skunkStatus === "skunk",
        skunkStatus === "doubleSkunk"
      );
    });
  }, [addCompletedGame, updatePlayerStats, recordGameEnd]);

  useEffect(() => {
    setOnGameComplete(() => handleGameComplete);
    return () => setOnGameComplete(() => null);
  }, [setOnGameComplete, handleGameComplete]);
}
