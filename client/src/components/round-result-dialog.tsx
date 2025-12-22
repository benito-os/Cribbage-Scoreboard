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
import type { GameState, PlayerTricks, PlayerParticipation } from "@shared/schema";
import { calculateAllScoreChanges, getMaxTricks, getPepperBid } from "@shared/schema";
import { Minus, Plus, Check, X, Ban, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoundResultDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (playerTricks: PlayerTricks, playerParticipation?: PlayerParticipation) => void;
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
  const [playerParticipation, setPlayerParticipation] = useState<PlayerParticipation>(() => {
    const initial: PlayerParticipation = {};
    players.forEach(p => { initial[p.id] = "play"; });
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
      const initialTricks: PlayerTricks = {};
      const initialParticipation: PlayerParticipation = {};
      players.forEach(p => { 
        initialTricks[p.id] = 0; 
        initialParticipation[p.id] = "play";
      });
      setPlayerTricks(initialTricks);
      setPlayerParticipation(initialParticipation);
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

  // Count only participating players' tricks for total
  const totalTricks = Object.entries(playerTricks).reduce((sum, [playerId, t]) => {
    const participation = playerParticipation[playerId] ?? "play";
    return participation === "play" ? sum + t : sum;
  }, 0);
  const isValidTotal = totalTricks === maxTricks;
  const remaining = maxTricks - totalTricks;

  const isNoTrump = currentBid.trumpSuit === "none";
  const hasTrump = !isNoTrump;
  
  const { success, scoreChanges } = calculateAllScoreChanges(
    currentBid.bidderId,
    currentBid.amount!,
    currentBid.type!,
    playerTricks,
    playerCount,
    currentBid.trumpSuit,
    playerParticipation
  );
  
  const toggleParticipation = (playerId: string) => {
    // Can't fold if No Trump - everyone must play
    if (isNoTrump) return;
    // Bidder always plays
    if (playerId === currentBid.bidderId) return;
    
    setPlayerParticipation(prev => {
      const newStatus = prev[playerId] === "play" ? "fold" : "play";
      const updated = { ...prev, [playerId]: newStatus as "play" | "fold" };
      
      // If folding, reset their tricks to 0
      if (newStatus === "fold") {
        setPlayerTricks(prevTricks => ({ ...prevTricks, [playerId]: 0 }));
      }
      
      return updated;
    });
    
    // Cancel any pending auto-submit when participation changes
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
    setShowConfirm(false);
  };

  const incrementTricks = (playerId: string) => {
    // Can't increment tricks for folded players
    if (playerParticipation[playerId] === "fold") return;
    
    if (totalTricks < maxTricks) {
      const newTricks = {
        ...playerTricks,
        [playerId]: (playerTricks[playerId] ?? 0) + 1,
      };
      setPlayerTricks(newTricks);
      
      // Check if this completes the total - auto-submit after brief delay
      const newTotal = Object.entries(newTricks).reduce((sum, [pId, t]) => {
        const participation = playerParticipation[pId] ?? "play";
        return participation === "play" ? sum + t : sum;
      }, 0);
      if (newTotal === maxTricks) {
        // Clear any existing timer
        if (submitTimerRef.current) {
          clearTimeout(submitTimerRef.current);
        }
        // Brief delay to show result, then auto-submit
        submitTimerRef.current = setTimeout(() => {
          onSubmit(newTricks, playerParticipation);
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
      onSubmit(playerTricks, playerParticipation);
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
          <DialogDescription asChild>
            <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{bidder?.name}</span>
              <Badge variant="outline" className="gap-1">
                {getBidLabel()}
                {currentBid.trumpSuit === "none" ? (
                  <Ban className="h-3 w-3 text-muted-foreground" />
                ) : currentBid.trumpSuit && (
                  <SuitIcon suit={currentBid.trumpSuit} size="sm" />
                )}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* No Trump warning */}
          {isNoTrump && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                No Trump: 0 tricks = -{bidAmount} penalty
              </p>
            </div>
          )}
          
          {/* Trump helper warning */}
          {hasTrump && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">
                Helpers with 0 tricks = -{bidAmount} penalty. Tap name to fold.
              </p>
            </div>
          )}
          
          {/* Player Tricks - Large touch targets */}
          {players.map((player) => {
            const tricks = playerTricks[player.id] ?? 0;
            const isBidder = player.id === currentBid.bidderId;
            const scoreChange = scoreChanges[player.id] ?? 0;
            const participation = playerParticipation[player.id] ?? "play";
            const isFolded = participation === "fold";
            const canToggleFold = hasTrump && !isBidder;

            return (
              <div
                key={player.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg",
                  isBidder ? "bg-chart-4/10 border border-chart-4/20" : 
                  isFolded ? "bg-muted/20 opacity-60" : "bg-muted/30"
                )}
                data-testid={`row-player-tricks-${player.id}`}
              >
                {/* Large decrement button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => decrementTricks(player.id)}
                  disabled={tricks <= 0 || isFolded}
                  className="h-14 w-14 flex-shrink-0"
                  data-testid={`button-tricks-decrease-${player.id}`}
                >
                  <Minus className="h-6 w-6" />
                </Button>

                {/* Player info and count - tappable to toggle fold for non-bidders with trump */}
                <div 
                  className={cn(
                    "flex-1 min-w-0 text-center",
                    canToggleFold && "cursor-pointer"
                  )}
                  onClick={() => canToggleFold && toggleParticipation(player.id)}
                  data-testid={`toggle-fold-${player.id}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn(
                      "font-medium truncate text-sm",
                      isFolded && "line-through"
                    )}>{player.name}</span>
                    {isBidder && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        bid
                      </Badge>
                    )}
                    {isFolded && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 gap-0.5">
                        <UserX className="h-3 w-3" />
                        fold
                      </Badge>
                    )}
                  </div>
                  {isFolded ? (
                    <span className="text-2xl font-bold text-muted-foreground block">
                      --
                    </span>
                  ) : (
                    <span
                      className="text-4xl font-bold tabular-nums block"
                      data-testid={`text-tricks-${player.id}`}
                    >
                      {tricks}
                    </span>
                  )}
                  <span className={cn(
                    "text-xs tabular-nums",
                    scoreChange > 0 ? "text-primary" : scoreChange < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {isFolded ? "0 (folded)" : `${scoreChange > 0 ? "+" : ""}${scoreChange}`}
                  </span>
                </div>

                {/* Large increment button */}
                <Button
                  type="button"
                  variant={remaining > 0 && !isFolded ? "default" : "outline"}
                  onClick={() => incrementTricks(player.id)}
                  disabled={totalTricks >= maxTricks || isFolded}
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
