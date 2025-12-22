import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGame } from "@/lib/gameContext";
import { ScoreEntryDialog, PeggingScoreDialog } from "@/components/score-entry-dialog";
import { HandHistory } from "@/components/hand-history";
import { PlayerReorderDialog } from "@/components/player-reorder-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Player, ScoreEntry, Card as CardType } from "@shared/schema";
import { checkHisHeels } from "@shared/schema";
import {
  Undo2,
  Redo2,
  RotateCcw,
  Home,
  Trophy,
  ArrowUpDown,
  CircleDot,
  Play,
  Calculator,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActiveGame() {
  const { 
    gameState, 
    submitPeggingScores, 
    submitHandScore, 
    submitCribScore, 
    finishHand,
    undoLastHand, 
    redoHand, 
    resetGame, 
    reorderPlayers, 
    canUndo, 
    canRedo 
  } = useGame();
  const [, setLocation] = useLocation();

  const [showPeggingDialog, setShowPeggingDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [scoreDialogPlayer, setScoreDialogPlayer] = useState<Player | null>(null);
  const [isScoringCrib, setIsScoringCrib] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showReorderDialog, setShowReorderDialog] = useState(false);

  if (!gameState) {
    setLocation("/");
    return null;
  }

  const { players, targetScore, hands, gamePhase, currentHand, winnerId, playerCount, currentDealerIndex } = gameState;

  const rankedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentDealer = players[currentDealerIndex];
  const nextDealerIndex = (currentDealerIndex + 1) % playerCount;
  const nextDealer = players[nextDealerIndex];

  const hasPeggingScores = currentHand?.peggingScores && Object.keys(currentHand.peggingScores).length > 0;
  const handScoresEntered = currentHand?.handScores?.length ?? 0;
  const hasCribScore = !!currentHand?.cribScore;
  const allHandsScored = handScoresEntered >= playerCount;
  const handComplete = allHandsScored && hasCribScore;

  const getNextPlayerToScore = (): Player | null => {
    if (!hasPeggingScores) return null;
    
    const scoredPlayerIds = new Set(currentHand?.handScores?.map(s => s.playerId) ?? []);
    
    const orderFromDealer: Player[] = [];
    for (let i = 1; i <= playerCount; i++) {
      const idx = (currentDealerIndex + i) % playerCount;
      orderFromDealer.push(players[idx]);
    }
    
    return orderFromDealer.find(p => !scoredPlayerIds.has(p.id)) ?? null;
  };

  const nextPlayerToScore = getNextPlayerToScore();

  const handlePeggingSubmit = (scores: Record<string, number>) => {
    submitPeggingScores(scores);
    setShowPeggingDialog(false);
  };

  const handleOpenScoreDialog = (player: Player, isCrib: boolean) => {
    setScoreDialogPlayer(player);
    setIsScoringCrib(isCrib);
    setShowScoreDialog(true);
  };

  const handleScoreSubmit = (entry: ScoreEntry) => {
    if (isScoringCrib) {
      submitCribScore(entry);
    } else {
      submitHandScore(entry);
    }
    setShowScoreDialog(false);
    setScoreDialogPlayer(null);
  };

  const handleFinishHand = () => {
    finishHand();
  };

  const handleUndo = () => {
    undoLastHand();
  };

  const handleRedo = () => {
    redoHand();
  };

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
    setLocation("/");
  };

  const handleNewGame = () => {
    resetGame();
    setLocation("/");
  };

  const handleReorder = (newOrder: Player[]) => {
    reorderPlayers(newOrder);
  };

  const winner = players.find((p) => p.id === winnerId);

  const getHandScoreForPlayer = (playerId: string): number | null => {
    const entry = currentHand?.handScores?.find(s => s.playerId === playerId);
    return entry?.points ?? null;
  };

  const getCribScoreForDealer = (): number | null => {
    return currentHand?.cribScore?.points ?? null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowResetConfirm(true)}
              data-testid="button-home"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold">Hand {hands.length + 1}</h1>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CircleDot className="h-3 w-3" />
                <span>{currentDealer?.name} deals</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowReorderDialog(true)}
              data-testid="button-reorder"
            >
              <ArrowUpDown className="h-5 w-5" />
            </Button>
            {canUndo && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                data-testid="button-undo"
              >
                <Undo2 className="h-5 w-5" />
              </Button>
            )}
            {canRedo && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                data-testid="button-redo"
              >
                <Redo2 className="h-5 w-5" />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {gamePhase === "complete" && winner && (
            <Card className="p-6 text-center bg-primary/5 border-primary">
              <Trophy className="h-12 w-12 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-1">{winner.name} Wins!</h2>
              <p className="text-muted-foreground mb-4">
                Final score: {winner.score} points
              </p>
              <Button onClick={handleNewGame} className="gap-2" data-testid="button-new-game">
                <RotateCcw className="h-4 w-4" />
                New Game
              </Button>
            </Card>
          )}

          {gamePhase === "pegging" && (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium">Pegging Phase</h3>
                  <p className="text-sm text-muted-foreground">
                    Play cards and track pegging points
                  </p>
                </div>
                <Button
                  onClick={() => setShowPeggingDialog(true)}
                  className="gap-2"
                  data-testid="button-enter-pegging"
                >
                  <Play className="h-4 w-4" />
                  Enter Pegging
                </Button>
              </div>
            </Card>
          )}

          {gamePhase === "counting" && (
            <Card className="p-4 space-y-4">
              <div>
                <h3 className="font-medium mb-1">Counting Phase</h3>
                <p className="text-sm text-muted-foreground">
                  Score each hand, then the crib
                </p>
              </div>

              <div className="space-y-2">
                {players
                  .map((_, idx) => players[(currentDealerIndex + idx + 1) % playerCount])
                  .map((player) => {
                    const score = getHandScoreForPlayer(player.id);
                    const isDealer = player.id === currentDealer?.id;
                    return (
                      <div
                        key={player.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md",
                          score !== null ? "bg-primary/5" : "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.name}</span>
                          {isDealer && (
                            <Badge variant="outline" className="text-xs">Dealer</Badge>
                          )}
                        </div>
                        {score !== null ? (
                          <Badge>{score} pts</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenScoreDialog(player, false)}
                            disabled={nextPlayerToScore?.id !== player.id}
                            data-testid={`button-score-${player.id}`}
                          >
                            <Calculator className="h-4 w-4 mr-1" />
                            Score Hand
                          </Button>
                        )}
                      </div>
                    );
                  })}

                <div
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md border-2 border-dashed",
                    hasCribScore ? "bg-primary/5 border-primary/30" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{currentDealer?.name}'s Crib</span>
                  </div>
                  {hasCribScore ? (
                    <Badge>{currentHand?.cribScore?.points} pts</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => currentDealer && handleOpenScoreDialog(currentDealer, true)}
                      disabled={!allHandsScored}
                      data-testid="button-score-crib"
                    >
                      <Calculator className="h-4 w-4 mr-1" />
                      Score Crib
                    </Button>
                  )}
                </div>
              </div>

              {handComplete && (
                <Button
                  onClick={handleFinishHand}
                  className="w-full gap-2"
                  data-testid="button-finish-hand"
                >
                  <Play className="h-4 w-4" />
                  Start Next Hand
                </Button>
              )}
            </Card>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-muted-foreground">Scores</h2>
              <span className="text-xs text-muted-foreground">First to {targetScore}</span>
            </div>
            <div
              className={cn(
                "grid gap-3",
                playerCount === 2 ? "grid-cols-2" : playerCount === 3 ? "grid-cols-3" : "grid-cols-2"
              )}
            >
              {rankedPlayers.map((player, index) => {
                const isWinner = winnerId === player.id;
                const isDealer = player.id === currentDealer?.id;
                const isNextDealer = player.id === nextDealer?.id;
                const progressPct = Math.min((player.score / targetScore) * 100, 100);
                
                return (
                  <Card
                    key={player.id}
                    className={cn(
                      "p-3 relative",
                      isWinner && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {index === 0 && !isWinner && (
                          <span className="text-lg">👑</span>
                        )}
                        {isWinner && (
                          <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{player.name}</span>
                      </div>
                      {isDealer && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">D</Badge>
                      )}
                      {isNextDealer && !isDealer && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">Next</Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold mb-1">{player.score}</div>
                    <Progress value={progressPct} className="h-1.5" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {targetScore - player.score > 0 
                        ? `${targetScore - player.score} to go`
                        : "Winner!"
                      }
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {hands.length > 0 && (
            <section>
              <HandHistory
                hands={hands}
                players={players}
                maxHeight="300px"
              />
            </section>
          )}
        </div>
      </main>

      <PeggingScoreDialog
        open={showPeggingDialog}
        onOpenChange={setShowPeggingDialog}
        players={players}
        onSubmit={handlePeggingSubmit}
      />

      {scoreDialogPlayer && (
        <ScoreEntryDialog
          open={showScoreDialog}
          onOpenChange={setShowScoreDialog}
          playerName={scoreDialogPlayer.name}
          playerId={scoreDialogPlayer.id}
          isCrib={isScoringCrib}
          starterCard={currentHand?.starterCard}
          onSubmit={handleScoreSubmit}
          existingHandCards={currentHand?.handScores?.flatMap(s => s.cards ?? []) ?? []}
        />
      )}

      <PlayerReorderDialog
        open={showReorderDialog}
        onClose={() => setShowReorderDialog(false)}
        onSave={handleReorder}
        players={players}
      />

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Current Game?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the current game and return to setup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-reset-cancel">
              Keep Playing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-reset-confirm"
            >
              End Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
