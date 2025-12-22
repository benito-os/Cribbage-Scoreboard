import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SuitIcon } from "./suit-icon";
import type { Round, Player } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Check, X, CircleDot } from "lucide-react";

interface RoundHistoryProps {
  rounds: Round[];
  players: Player[];
  maxHeight?: string;
}

export function RoundHistory({ rounds, players, maxHeight = "300px" }: RoundHistoryProps) {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name ?? "Unknown";

  const getBidLabel = (round: Round) => {
    if (round.bidType === "pepperNo") return "Pepper No";
    if (round.bidType === "pepper") return "Pepper";
    return round.bidAmount.toString();
  };

  if (rounds.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No rounds played yet. Start bidding!
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-base">Round History</h3>
      </div>
      <ScrollArea style={{ maxHeight }} className="w-full">
        <div className="divide-y">
          {[...rounds].reverse().map((round) => (
            <div
              key={round.id}
              className="px-4 py-3 flex items-center gap-3"
              data-testid={`row-round-${round.id}`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {round.roundNumber}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium truncate">
                    {getPlayerName(round.bidderId)}
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    {getBidLabel(round)}
                    {round.trumpSuit !== "none" && (
                      <SuitIcon suit={round.trumpSuit} size="sm" />
                    )}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <CircleDot className="h-3 w-3" />
                  <span className="truncate">{getPlayerName(round.dealerId)}</span>
                  <span className="text-muted-foreground/60">dealt</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-muted-foreground">
                  {round.tricksWon} tricks
                </span>
                <div
                  className={cn(
                    "flex items-center gap-1 font-semibold tabular-nums",
                    round.bidSuccess ? "text-primary" : "text-destructive"
                  )}
                >
                  {round.bidSuccess ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span>
                    {round.scoreChange > 0 ? "+" : ""}
                    {round.scoreChange}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
