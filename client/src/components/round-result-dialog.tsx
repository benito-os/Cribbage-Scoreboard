import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuitIcon } from "./suit-icon";
import type { GameState, PlayerTricks } from "@shared/schema";
import { calculateAllScoreChanges, getMaxTricks, getPepperBid } from "@shared/schema";
import { Minus, Plus, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoundResultDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (playerTricks: PlayerTricks) => void;
  gameState: GameState;
}

export function RoundResultDialog({
  open,
  onClose,
  onSubmit,
  gameState,
}: RoundResultDialogProps) {
  const { currentBid, players, playerCount } = gameState;
  const maxTricks = getMaxTricks(playerCount);

  // Initialize tricks for all players
  const [playerTricks, setPlayerTricks] = useState<PlayerTricks>(() => {
    const initial: PlayerTricks = {};
    players.forEach(p => { initial[p.id] = 0; });
    return initial;
  });

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      const initial: PlayerTricks = {};
      players.forEach(p => { initial[p.id] = 0; });
      setPlayerTricks(initial);
    }
  }, [open, players]);

  if (!currentBid?.bidderId) return null;

  const bidder = players.find(p => p.id === currentBid.bidderId);
  const bidAmount = currentBid.type === "standard" 
    ? currentBid.amount! 
    : getPepperBid(playerCount);

  // Calculate totals
  const totalTricks = Object.values(playerTricks).reduce((sum, t) => sum + t, 0);
  const isValidTotal = totalTricks === maxTricks;

  // Calculate score preview
  const { success, scoreChanges } = calculateAllScoreChanges(
    currentBid.bidderId,
    currentBid.amount!,
    currentBid.type!,
    playerTricks,
    playerCount
  );

  const incrementTricks = (playerId: string) => {
    if (totalTricks < maxTricks) {
      setPlayerTricks(prev => ({
        ...prev,
        [playerId]: (prev[playerId] ?? 0) + 1,
      }));
    }
  };

  const decrementTricks = (playerId: string) => {
    if ((playerTricks[playerId] ?? 0) > 0) {
      setPlayerTricks(prev => ({
        ...prev,
        [playerId]: (prev[playerId] ?? 0) - 1,
      }));
    }
  };

  const handleSubmit = () => {
    if (isValidTotal) {
      onSubmit(playerTricks);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const getBidLabel = () => {
    if (currentBid.type === "pepperNo") return "Pepper No";
    if (currentBid.type === "pepper") return "Pepper";
    return `Bid ${bidAmount}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Round Result</DialogTitle>
          <DialogDescription>
            Enter the tricks won by each player
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Current Bid Summary */}
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="font-medium">{bidder?.name}</span>
              <Badge variant="secondary" className="gap-1">
                {getBidLabel()}
                {currentBid.trumpSuit && currentBid.trumpSuit !== "none" && (
                  <SuitIcon suit={currentBid.trumpSuit} size="sm" />
                )}
              </Badge>
              <span className="text-sm text-muted-foreground">
                (needs {bidAmount})
              </span>
            </div>
          </div>

          {/* Player Tricks Grid */}
          <div className="space-y-2">
            {players.map((player) => {
              const tricks = playerTricks[player.id] ?? 0;
              const isBidder = player.id === currentBid.bidderId;
              const scoreChange = scoreChanges[player.id] ?? 0;

              return (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    isBidder ? "bg-chart-4/10 border border-chart-4/20" : "bg-muted/30"
                  )}
                  data-testid={`row-player-tricks-${player.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{player.name}</span>
                      {isBidder && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Bidder
                        </Badge>
                      )}
                    </div>
                    <div className={cn(
                      "text-sm tabular-nums",
                      scoreChange > 0 ? "text-primary" : scoreChange < 0 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {scoreChange > 0 ? "+" : ""}{scoreChange} pts
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => decrementTricks(player.id)}
                      disabled={tricks <= 0}
                      data-testid={`button-tricks-decrease-${player.id}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span
                      className="text-3xl font-bold tabular-nums w-10 text-center"
                      data-testid={`text-tricks-${player.id}`}
                    >
                      {tricks}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => incrementTricks(player.id)}
                      disabled={totalTricks >= maxTricks}
                      data-testid={`button-tricks-increase-${player.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Validation */}
          <div
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              isValidTotal
                ? "bg-primary/10 border border-primary/20"
                : "bg-muted/50 border border-border"
            )}
          >
            <div className="flex items-center gap-2">
              {isValidTotal ? (
                <Check className="h-5 w-5 text-primary" />
              ) : (
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className={cn(
                "font-medium",
                isValidTotal ? "text-primary" : "text-muted-foreground"
              )}>
                Total Tricks
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-2xl font-bold tabular-nums",
                isValidTotal ? "text-primary" : "text-foreground"
              )}>
                {totalTricks}
              </span>
              <span className="text-muted-foreground">/ {maxTricks}</span>
            </div>
          </div>

          {/* Bid Result Preview */}
          {isValidTotal && (
            <div
              className={cn(
                "rounded-lg p-3 text-center",
                success
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-destructive/10 border border-destructive/20"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {success ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <X className="h-5 w-5 text-destructive" />
                )}
                <span className={cn(
                  "font-semibold",
                  success ? "text-primary" : "text-destructive"
                )}>
                  {bidder?.name} {success ? "made the bid!" : "missed the bid"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            data-testid="button-result-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValidTotal}
            className="flex-1"
            data-testid="button-result-confirm"
          >
            Confirm Result
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
