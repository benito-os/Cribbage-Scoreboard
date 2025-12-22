import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SuitIcon } from "./suit-icon";
import type { Player, TrumpSuit, BidType } from "@shared/schema";
import { getMaxBid, getPepperBid } from "@shared/schema";
import { Flame, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BidDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (bidderId: string, amount: number, type: BidType, trumpSuit: TrumpSuit) => void;
  players: Player[];
  playerCount: 3 | 4;
  currentDealerIndex: number;
}

type Suit = "spades" | "hearts" | "diamonds" | "clubs";
const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

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

  // Default to player after dealer
  const defaultBidderIndex = (currentDealerIndex + 1) % playerCount;
  const defaultBidderId = players[defaultBidderIndex]?.id || "";

  const [bidderId, setBidderId] = useState<string>(defaultBidderId);
  const [bidAmount, setBidAmount] = useState<number | null>(null);
  const [bidType, setBidType] = useState<BidType>("standard");

  // Reset form when dialog opens with default bidder
  useEffect(() => {
    if (open) {
      setBidderId(players[defaultBidderIndex]?.id || "");
      setBidAmount(null);
      setBidType("standard");
    }
  }, [open, defaultBidderIndex, players]);

  const handleBidSelect = (amount: number) => {
    setBidAmount(amount);
    setBidType("standard");
  };

  const handlePepperSelect = (type: "pepper" | "pepperNo") => {
    setBidType(type);
    setBidAmount(pepperBid);
    
    // For Pepper No, auto-submit immediately
    if (type === "pepperNo" && bidderId) {
      onSubmit(bidderId, pepperBid, type, "none");
      onClose();
    }
  };

  const handleTrumpSelect = (suit: Suit) => {
    // Auto-submit when trump is selected (for standard and pepper bids)
    if (!bidderId) return;
    
    const finalAmount = bidType === "standard" ? (bidAmount || 1) : pepperBid;
    onSubmit(bidderId, finalAmount, bidType, suit);
    onClose();
  };

  const handleBidderSelect = (playerId: string) => {
    setBidderId(playerId);
  };

  // Generate bid buttons 1 to maxBid
  const bidOptions = Array.from({ length: maxBid }, (_, i) => i + 1);

  // Show trump selection only after bid is selected (not Pepper No)
  const showTrumpSelection = bidAmount !== null && bidType !== "pepperNo";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Enter Bid</DialogTitle>
          <DialogDescription>
            Tap bidder, then bid amount, then trump suit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Bidder Selection - Large tap buttons */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Who is bidding?</Label>
            <div className="grid grid-cols-2 gap-2">
              {players.map((player, index) => (
                <Button
                  key={player.id}
                  type="button"
                  variant={bidderId === player.id ? "default" : "outline"}
                  onClick={() => handleBidderSelect(player.id)}
                  className={cn(
                    "h-12 text-base justify-start gap-2",
                    bidderId === player.id && "ring-2 ring-primary ring-offset-2"
                  )}
                  data-testid={`button-bidder-${player.id}`}
                >
                  {bidderId === player.id && <Check className="h-4 w-4 flex-shrink-0" />}
                  <span className="truncate">{player.name}</span>
                  {index === defaultBidderIndex && (
                    <span className="text-xs opacity-60 ml-auto">(1st)</span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Bid Amount - Large grid of tap-once buttons */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Bid amount</Label>
            <div className="grid grid-cols-4 gap-2">
              {bidOptions.map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant={bidAmount === num && bidType === "standard" ? "default" : "outline"}
                  onClick={() => handleBidSelect(num)}
                  className={cn(
                    "h-14 text-xl font-bold",
                    bidAmount === num && bidType === "standard" && "ring-2 ring-primary ring-offset-2"
                  )}
                  data-testid={`button-bid-${num}`}
                >
                  {num}
                </Button>
              ))}
            </div>
            
            {/* Pepper bids row */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant={bidType === "pepper" ? "default" : "outline"}
                onClick={() => handlePepperSelect("pepper")}
                className={cn(
                  "h-14 text-base gap-2",
                  bidType === "pepper" && "ring-2 ring-primary ring-offset-2"
                )}
                data-testid="button-bid-pepper"
              >
                <Flame className="h-5 w-5" />
                Pepper ({pepperBid})
              </Button>
              <Button
                type="button"
                variant={bidType === "pepperNo" ? "default" : "outline"}
                onClick={() => handlePepperSelect("pepperNo")}
                className={cn(
                  "h-14 text-base gap-2",
                  bidType === "pepperNo" && "ring-2 ring-primary ring-offset-2"
                )}
                data-testid="button-bid-pepperno"
              >
                <Flame className="h-5 w-5" />
                Pepper No ({pepperBid})
              </Button>
            </div>
          </div>

          {/* Trump Suit Selection - Large buttons, auto-submits on tap */}
          {showTrumpSelection && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Tap trump suit to confirm
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {suits.map((suit) => (
                  <Button
                    key={suit}
                    type="button"
                    variant="outline"
                    onClick={() => handleTrumpSelect(suit)}
                    className="h-16 flex flex-col gap-1"
                    data-testid={`button-trump-${suit}`}
                  >
                    <SuitIcon suit={suit} size="lg" />
                    <span className="text-xs capitalize">{suit}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!showTrumpSelection && bidType !== "pepperNo" && (
            <p className="text-center text-sm text-muted-foreground py-2">
              Select a bid amount to continue
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full"
            data-testid="button-bid-cancel"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
