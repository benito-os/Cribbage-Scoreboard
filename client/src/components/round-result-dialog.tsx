import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SuitIcon } from "./suit-icon";
import type { GameState } from "@shared/schema";
import { calculateScoreChange, getMaxBid, getPepperBid } from "@shared/schema";
import { Minus, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoundResultDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (tricksWon: number) => void;
  gameState: GameState;
}

export function RoundResultDialog({
  open,
  onClose,
  onSubmit,
  gameState,
}: RoundResultDialogProps) {
  const { currentBid, players, playerCount } = gameState;
  // For Pepper/Pepper No, max tricks equals the pepper bid value (all tricks)
  // For standard bids, max is the normal trick count
  const isPepperBid = currentBid?.type === "pepper" || currentBid?.type === "pepperNo";
  const maxTricks = isPepperBid 
    ? getPepperBid(playerCount) 
    : (playerCount === 3 ? 8 : 6);

  const [tricksWon, setTricksWon] = useState<number>(0);

  if (!currentBid?.bidderId) return null;

  const bidder = players.find(p => p.id === currentBid.bidderId);
  const bidAmount = currentBid.type === "standard" 
    ? currentBid.amount! 
    : getPepperBid(playerCount);

  const { success, scoreChange } = calculateScoreChange(
    currentBid.amount!,
    currentBid.type!,
    tricksWon,
    playerCount
  );

  const incrementTricks = () => {
    if (tricksWon < maxTricks) {
      setTricksWon(prev => prev + 1);
    }
  };

  const decrementTricks = () => {
    if (tricksWon > 0) {
      setTricksWon(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(tricksWon);
    setTricksWon(0);
  };

  const handleClose = () => {
    setTricksWon(0);
    onClose();
  };

  const getBidLabel = () => {
    if (currentBid.type === "pepperNo") return "Pepper No";
    if (currentBid.type === "pepper") return "Pepper";
    return `Bid ${bidAmount}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Round Result</DialogTitle>
          <DialogDescription>
            How many tricks did {bidder?.name} take?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Bid Summary */}
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
            <div className="text-lg font-medium">{bidder?.name}</div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-base gap-1">
                {getBidLabel()}
                {currentBid.trumpSuit && currentBid.trumpSuit !== "none" && (
                  <SuitIcon suit={currentBid.trumpSuit} size="sm" />
                )}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Needs {bidAmount} trick{bidAmount !== 1 ? "s" : ""} to succeed
            </div>
          </div>

          {/* Tricks Won Input */}
          <div className="space-y-2">
            <Label className="text-center block">Tricks Won</Label>
            <div className="flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementTricks}
                disabled={tricksWon <= 0}
                data-testid="button-tricks-decrease"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span
                className="text-6xl font-bold tabular-nums w-20 text-center"
                data-testid="text-tricks-won"
              >
                {tricksWon}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementTricks}
                disabled={tricksWon >= maxTricks}
                data-testid="button-tricks-increase"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Result Preview */}
          <div
            className={cn(
              "rounded-lg p-4 text-center",
              success
                ? "bg-primary/10 border border-primary/20"
                : "bg-destructive/10 border border-destructive/20"
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              {success ? (
                <Check className="h-5 w-5 text-primary" />
              ) : (
                <X className="h-5 w-5 text-destructive" />
              )}
              <span className={cn(
                "font-semibold",
                success ? "text-primary" : "text-destructive"
              )}>
                {success ? "Bid Made!" : "Bid Failed"}
              </span>
            </div>
            <div
              className={cn(
                "text-3xl font-bold tabular-nums",
                success ? "text-primary" : "text-destructive"
              )}
              data-testid="text-score-preview"
            >
              {scoreChange > 0 ? "+" : ""}{scoreChange}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {bidder?.name}: {bidder?.score} → {(bidder?.score ?? 0) + scoreChange}
            </div>
          </div>
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
