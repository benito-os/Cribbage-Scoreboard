import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { PlayerScoreCard } from "@/components/player-score-card";
import { RoundHistory } from "@/components/round-history";
import { BidDialog } from "@/components/bid-dialog";
import { RoundResultDialog } from "@/components/round-result-dialog";
import { PlayerReorderDialog } from "@/components/player-reorder-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { SuitIcon } from "@/components/suit-icon";
import { Badge } from "@/components/ui/badge";
import type { PlayerTricks, Player } from "@shared/schema";
import {
  Undo2,
  Plus,
  RotateCcw,
  Home,
  Trophy,
  Check,
  Flame,
  ArrowUpDown,
  CircleDot,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActiveGame() {
  const { gameState, submitBid, submitRoundResult, undoLastRound, resetGame, reorderPlayers, canUndo } =
    useGame();
  const [, setLocation] = useLocation();

  const [showBidDialog, setShowBidDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showReorderDialog, setShowReorderDialog] = useState(false);

  if (!gameState) {
    setLocation("/");
    return null;
  }

  const { players, targetScore, rounds, gamePhase, currentBid, winnerId, playerCount, currentDealerIndex } =
    gameState;

  const rankedPlayers = [...players].sort((a, b) => b.score - a.score);
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const currentDealer = players[currentDealerIndex];

  const handleNewRound = () => {
    setShowBidDialog(true);
  };

  const handleBidSubmit = (
    bidderId: string,
    amount: number,
    type: "standard" | "pepper" | "pepperNo",
    trumpSuit: "spades" | "hearts" | "diamonds" | "clubs" | "none"
  ) => {
    submitBid(bidderId, amount, type, trumpSuit);
    setShowResultDialog(true);
  };

  const handleResultSubmit = (playerTricks: PlayerTricks) => {
    submitRoundResult(playerTricks);
    setShowResultDialog(false);
  };

  const handleUndo = () => {
    undoLastRound();
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

  const getBidLabel = () => {
    if (!currentBid) return "";
    if (currentBid.type === "pepperNo") return "Pepper No";
    if (currentBid.type === "pepper") return "Pepper";
    return `Bid ${currentBid.amount}`;
  };

  const getLastRoundSummary = () => {
    if (!lastRound) return null;
    const bidder = players.find(p => p.id === lastRound.bidderId);
    return {
      bidder,
      success: lastRound.bidSuccess,
      scoreChanges: lastRound.scoreChanges,
    };
  };

  const lastRoundSummary = getLastRoundSummary();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Header */}
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
              <h1 className="font-semibold">Round {rounds.length + 1}</h1>
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content - scrollable */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* Winner Banner */}
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

          {/* Last Round Summary - Inline compact display */}
          {lastRoundSummary && gamePhase !== "complete" && (
            <div className={cn(
              "rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2 flex-wrap",
              lastRoundSummary.success 
                ? "bg-primary/10 text-primary" 
                : "bg-destructive/10 text-destructive"
            )}>
              <div className="flex items-center gap-1.5">
                {lastRoundSummary.success ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {lastRoundSummary.bidder?.name} {lastRoundSummary.success ? "made" : "missed"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {players.map(p => {
                  const change = lastRoundSummary.scoreChanges?.[p.id] ?? 0;
                  if (change === 0) return null;
                  return (
                    <span key={p.id} className="text-foreground">
                      {p.name.split(' ')[0]}: {change > 0 ? '+' : ''}{change}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Bid Status */}
          {gamePhase === "playing" && currentBid?.bidderId && (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-chart-4" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {players.find((p) => p.id === currentBid.bidderId)?.name}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>{getBidLabel()}</span>
                      {currentBid.trumpSuit && currentBid.trumpSuit !== "none" && (
                        <SuitIcon suit={currentBid.trumpSuit} size="sm" />
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowResultDialog(true)}
                  className="gap-2"
                  data-testid="button-enter-result"
                >
                  <Check className="h-4 w-4" />
                  Enter Tricks
                </Button>
              </div>
            </Card>
          )}

          {/* Scoreboard */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-muted-foreground">Scores</h2>
              <span className="text-xs text-muted-foreground">First to {targetScore}</span>
            </div>
            <div
              className={cn(
                "grid gap-3",
                playerCount === 3 ? "grid-cols-3" : "grid-cols-2"
              )}
            >
              {rankedPlayers.map((player, index) => (
                <PlayerScoreCard
                  key={player.id}
                  player={player}
                  targetScore={targetScore}
                  isCurrentBidder={currentBid?.bidderId === player.id}
                  isWinner={winnerId === player.id}
                  rank={index + 1}
                />
              ))}
            </div>
          </section>

          {/* Round History - Collapsible */}
          {rounds.length > 0 && (
            <section>
              <RoundHistory
                rounds={rounds}
                players={players}
                maxHeight="300px"
              />
            </section>
          )}
        </div>
      </main>

      {/* Fixed Bottom Action Bar - Thumb zone */}
      {gamePhase === "bidding" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-40">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleNewRound}
              className="w-full h-14 text-lg gap-2"
              data-testid="button-new-round"
            >
              <Plus className="h-5 w-5" />
              Enter Bid
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <BidDialog
        open={showBidDialog}
        onClose={() => setShowBidDialog(false)}
        onSubmit={handleBidSubmit}
        players={players}
        playerCount={playerCount}
        currentDealerIndex={currentDealerIndex}
      />

      <RoundResultDialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        onSubmit={handleResultSubmit}
        gameState={gameState}
      />

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
