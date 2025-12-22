import { useState, useEffect, useRef } from "react";
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
import { Minus, Plus, Check, X, Ban } from "lucide-react";
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

  const [playerTricks, setPlayerTricks] = useState<PlayerTricks>(() => {
    const initial: PlayerTricks = {};
    players.forEach(p => { initial[p.id] = 0; });
    return initial;
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount or dialog close
  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      const initial: PlayerTricks = {};
      players.forEach(p => { initial[p.id] = 0; });
      setPlayerTricks(initial);
      setShowConfirm(false);
      // Clear any pending timer
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
        submitTimerRef.current = null;
      }
    }
  }, [open, players]);

  if (!currentBid?.bidderId) return null;

  const bidder = players.find(p => p.id === currentBid.bidderId);
  const bidAmount = currentBid.type === "standard" 
    ? currentBid.amount! 
    : getPepperBid(playerCount);

  const totalTricks = Object.values(playerTricks).reduce((sum, t) => sum + t, 0);
  const isValidTotal = totalTricks === maxTricks;
  const remaining = maxTricks - totalTricks;

  const { success, scoreChanges } = calculateAllScoreChanges(
    currentBid.bidderId,
    currentBid.amount!,
    currentBid.type!,
    playerTricks,
    playerCount
  );

  const incrementTricks = (playerId: string) => {
    if (totalTricks < maxTricks) {
      const newTricks = {
        ...playerTricks,
        [playerId]: (playerTricks[playerId] ?? 0) + 1,
      };
      setPlayerTricks(newTricks);
      
      // Check if this completes the total - auto-submit after brief delay
      const newTotal = Object.values(newTricks).reduce((sum, t) => sum + t, 0);
      if (newTotal === maxTricks) {
        // Clear any existing timer
        if (submitTimerRef.current) {
          clearTimeout(submitTimerRef.current);
        }
        // Brief delay to show result, then auto-submit
        submitTimerRef.current = setTimeout(() => {
          onSubmit(newTricks);
          submitTimerRef.current = null;
        }, 800);
        setShowConfirm(true);
      }
    }
  };

  const decrementTricks = (playerId: string) => {
    if ((playerTricks[playerId] ?? 0) > 0) {
      // Cancel auto-submit timer if decrementing
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
        submitTimerRef.current = null;
      }
      setPlayerTricks(prev => ({
        ...prev,
        [playerId]: (prev[playerId] ?? 0) - 1,
      }));
      setShowConfirm(false);
    }
  };

  const handleSubmit = () => {
    if (isValidTotal) {
      onSubmit(playerTricks);
    }
  };

  const handleClose = () => {
    // Cancel any pending auto-submit
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    onClose();
  };

  const getBidLabel = () => {
    if (currentBid.type === "pepper") return "Pepper";
    return `Bid ${bidAmount}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between gap-2">
            <span>Enter Tricks</span>
            <Badge 
              variant={isValidTotal ? "default" : "secondary"}
              className="text-base tabular-nums"
            >
              {totalTricks} / {maxTricks}
            </Badge>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{bidder?.name}</span>
            <Badge variant="outline" className="gap-1">
              {getBidLabel()}
              {currentBid.trumpSuit === "none" ? (
                <Ban className="h-3 w-3 text-muted-foreground" />
              ) : currentBid.trumpSuit && (
                <SuitIcon suit={currentBid.trumpSuit} size="sm" />
              )}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Player Tricks - Large touch targets */}
          {players.map((player) => {
            const tricks = playerTricks[player.id] ?? 0;
            const isBidder = player.id === currentBid.bidderId;
            const scoreChange = scoreChanges[player.id] ?? 0;

            return (
              <div
                key={player.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg",
                  isBidder ? "bg-chart-4/10 border border-chart-4/20" : "bg-muted/30"
                )}
                data-testid={`row-player-tricks-${player.id}`}
              >
                {/* Large decrement button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => decrementTricks(player.id)}
                  disabled={tricks <= 0}
                  className="h-14 w-14 flex-shrink-0"
                  data-testid={`button-tricks-decrease-${player.id}`}
                >
                  <Minus className="h-6 w-6" />
                </Button>

                {/* Player info and count */}
                <div className="flex-1 min-w-0 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-medium truncate text-sm">{player.name}</span>
                    {isBidder && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        bid
                      </Badge>
                    )}
                  </div>
                  <span
                    className="text-4xl font-bold tabular-nums block"
                    data-testid={`text-tricks-${player.id}`}
                  >
                    {tricks}
                  </span>
                  <span className={cn(
                    "text-xs tabular-nums",
                    scoreChange > 0 ? "text-primary" : scoreChange < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {scoreChange > 0 ? "+" : ""}{scoreChange}
                  </span>
                </div>

                {/* Large increment button */}
                <Button
                  type="button"
                  variant={remaining > 0 ? "default" : "outline"}
                  onClick={() => incrementTricks(player.id)}
                  disabled={totalTricks >= maxTricks}
                  className="h-14 w-14 flex-shrink-0"
                  data-testid={`button-tricks-increase-${player.id}`}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            );
          })}

          {/* Remaining indicator */}
          {!isValidTotal && (
            <p className="text-center text-sm text-muted-foreground">
              {remaining} trick{remaining !== 1 ? "s" : ""} remaining
            </p>
          )}

          {/* Result preview - auto-submits after brief delay */}
          {showConfirm && isValidTotal && (
            <div
              className={cn(
                "rounded-lg p-4 text-center animate-pulse",
                success
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-destructive/10 border border-destructive/20"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {success ? (
                  <Check className="h-6 w-6 text-primary" />
                ) : (
                  <X className="h-6 w-6 text-destructive" />
                )}
                <span className={cn(
                  "text-lg font-semibold",
                  success ? "text-primary" : "text-destructive"
                )}>
                  {bidder?.name} {success ? "made it!" : "missed"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Saving...</p>
            </div>
          )}
        </div>

        {/* Cancel at bottom - always visible */}
        <Button
          type="button"
          variant="ghost"
          onClick={handleClose}
          className="w-full"
          data-testid="button-result-cancel"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
