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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuitSelector } from "./suit-icon";
import type { Player, TrumpSuit, BidType } from "@shared/schema";
import { getMaxBid, getPepperBid } from "@shared/schema";
import { Minus, Plus, Flame } from "lucide-react";

interface BidDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (bidderId: string, amount: number, type: BidType, trumpSuit: TrumpSuit) => void;
  players: Player[];
  playerCount: 3 | 4;
  currentDealerIndex: number;
}

export function BidDialog({
  open,
  onClose,
  onSubmit,
  players,
  playerCount,
  currentDealerIndex,
}: BidDialogProps) {
  const maxBid = getMaxBid(playerCount);
  const pepperBid = getPepperBid(playerCount);

  const [bidderId, setBidderId] = useState<string>("");
  const [bidAmount, setBidAmount] = useState<number>(1);
  const [bidType, setBidType] = useState<BidType>("standard");
  const [trumpSuit, setTrumpSuit] = useState<TrumpSuit | null>(null);

  const handleBidTypeChange = (type: BidType) => {
    setBidType(type);
    if (type === "pepperNo") {
      setTrumpSuit("none");
    } else if (type !== "standard" && trumpSuit === "none") {
      setTrumpSuit(null);
    }
  };

  const incrementBid = () => {
    if (bidAmount < maxBid) {
      setBidAmount(prev => prev + 1);
    }
  };

  const decrementBid = () => {
    if (bidAmount > 1) {
      setBidAmount(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!bidderId) return;
    if (bidType !== "pepperNo" && !trumpSuit) return;

    const finalAmount = bidType === "standard" ? bidAmount : pepperBid;
    const finalSuit = bidType === "pepperNo" ? "none" : trumpSuit!;

    onSubmit(bidderId, finalAmount, bidType, finalSuit);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setBidderId("");
    setBidAmount(1);
    setBidType("standard");
    setTrumpSuit(null);
  };

  const canSubmit = bidderId && (bidType === "pepperNo" || trumpSuit);

  // Player starting after dealer
  const startingPlayerIndex = (currentDealerIndex + 1) % playerCount;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Enter Bid</DialogTitle>
          <DialogDescription>
            Select the bidder and their bid for this round
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bidder Selection */}
          <div className="space-y-2">
            <Label htmlFor="bidder-select">Who is bidding?</Label>
            <Select value={bidderId} onValueChange={setBidderId}>
              <SelectTrigger id="bidder-select" data-testid="select-bidder">
                <SelectValue placeholder="Select bidder" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player, index) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                    {index === startingPlayerIndex && " (first)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bid Type Selection */}
          <div className="space-y-2">
            <Label>Bid Type</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={bidType === "standard" ? "default" : "outline"}
                onClick={() => handleBidTypeChange("standard")}
                data-testid="button-bid-standard"
              >
                Standard
              </Button>
              <Button
                type="button"
                variant={bidType === "pepper" ? "default" : "outline"}
                onClick={() => handleBidTypeChange("pepper")}
                className="gap-1"
                data-testid="button-bid-pepper"
              >
                <Flame className="h-4 w-4" />
                Pepper ({pepperBid})
              </Button>
              <Button
                type="button"
                variant={bidType === "pepperNo" ? "default" : "outline"}
                onClick={() => handleBidTypeChange("pepperNo")}
                className="gap-1"
                data-testid="button-bid-pepperno"
              >
                <Flame className="h-4 w-4" />
                Pepper No ({pepperBid})
              </Button>
            </div>
          </div>

          {/* Bid Amount (only for standard) */}
          {bidType === "standard" && (
            <div className="space-y-2">
              <Label>Bid Amount (1-{maxBid})</Label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={decrementBid}
                  disabled={bidAmount <= 1}
                  data-testid="button-bid-decrease"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span
                  className="text-5xl font-bold tabular-nums w-16 text-center"
                  data-testid="text-bid-amount"
                >
                  {bidAmount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={incrementBid}
                  disabled={bidAmount >= maxBid}
                  data-testid="button-bid-increase"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Trump Suit Selection */}
          {bidType !== "pepperNo" && (
            <div className="space-y-2">
              <Label>Trump Suit</Label>
              <SuitSelector selected={trumpSuit} onSelect={setTrumpSuit} />
            </div>
          )}

          {bidType === "pepperNo" && (
            <div className="text-center text-muted-foreground py-2">
              No trump suit - high card wins each trick
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-testid="button-bid-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1"
            data-testid="button-bid-confirm"
          >
            Confirm Bid
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
