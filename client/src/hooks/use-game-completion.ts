import { useEffect, useCallback } from "react";
import { useGame } from "@/lib/gameContext";
import { usePlayerProfiles } from "@/lib/playerProfilesContext";
import type { GameState, Round } from "@shared/schema";

export function useGameCompletion() {
  const { setOnGameComplete } = useGame();
  const { addCompletedGame, updatePlayerStats, recordGameEnd } = usePlayerProfiles();

  const handleGameComplete = useCallback((completedGame: GameState | null) => {
    if (!completedGame) return;
    const { players, rounds, winnerId, playerCount, targetScore } = completedGame;

    // Find winner details
    const winner = players.find(p => p.id === winnerId);
    const winnerProfile = winner?.profileId;

    // Save to game history
    addCompletedGame({
      playerCount,
      targetScore,
      players: players.map(p => ({
        profileId: p.profileId,
        name: p.name,
        finalScore: p.score,
      })),
      rounds,
      winnerId: winnerProfile,
      winnerName: winner?.name ?? "Unknown",
      totalRounds: rounds.length,
    });

    // Update stats for each player
    players.forEach(player => {
      if (!player.profileId) return;

      // Process each round for this player (updatePlayerStats is designed for per-round calls)
      rounds.forEach((round: Round) => {
        const wasBidder = round.bidderId === player.id;
        const tricksWon = round.playerTricks[player.id] ?? 0;
        const wasPepper = wasBidder && round.bidType === "pepper";

        updatePlayerStats(player.profileId!, {
          won: player.id === winnerId,
          wasBidder,
          bidSuccess: wasBidder ? round.bidSuccess : undefined,
          wasPepper,
          tricksWon,
        });
      });

      // Record game end once per player (gamesPlayed, gamesWon)
      recordGameEnd(player.profileId, player.id === winnerId);
    });
  }, [addCompletedGame, updatePlayerStats, recordGameEnd]);

  useEffect(() => {
    setOnGameComplete(handleGameComplete);
    return () => setOnGameComplete(null);
  }, [setOnGameComplete, handleGameComplete]);
}
