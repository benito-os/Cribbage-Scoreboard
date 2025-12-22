import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SuitIcon } from "./suit-icon";
import type { Round, Player } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Check, X, CircleDot, ChevronDown, ChevronUp, Ban } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface RoundHistoryProps {
  rounds: Round[];
  players: Player[];
  maxHeight?: string;
}

export function RoundHistory({ rounds, players, maxHeight = "300px" }: RoundHistoryProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name ?? "Unknown";

  const getBidLabel = (round: Round) => {
    if (round.bidType === "pepper") return "Pepper";
    return round.bidAmount.toString();
  };

  const toggleExpand = (roundId: string) => {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      if (next.has(roundId)) {
        next.delete(roundId);
      } else {
        next.add(roundId);
      }
      return next;
    });
  };

  // Get bidder's score change for display (with null safety for legacy data)
  const getBidderScoreChange = (round: Round) => {
    if (!round.scoreChanges) return 0;
    return round.scoreChanges[round.bidderId] ?? 0;
  };

  // Get bidder's tricks (with null safety for legacy data)
  const getBidderTricks = (round: Round) => {
    if (!round.playerTricks) return 0;
    return round.playerTricks[round.bidderId] ?? 0;
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
          {[...rounds].reverse().map((round) => {
            const isExpanded = expandedRounds.has(round.id);
            const bidderScoreChange = getBidderScoreChange(round);

            return (
              <Collapsible
                key={round.id}
                open={isExpanded}
                onOpenChange={() => toggleExpand(round.id)}
              >
                <CollapsibleTrigger asChild>
                  <div
                    className="px-4 py-3 flex items-center gap-3 cursor-pointer hover-elevate"
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
                          {round.trumpSuit === "none" ? (
                            <Ban className="h-3 w-3 text-muted-foreground" />
                          ) : (
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
                          {bidderScoreChange > 0 ? "+" : ""}
                          {bidderScoreChange}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-3 pl-14">
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <div className="text-xs text-muted-foreground mb-2 font-medium">
                        All Players
                      </div>
                      {players.map(player => {
                        const tricks = round.playerTricks?.[player.id] ?? 0;
                        const scoreChange = round.scoreChanges?.[player.id] ?? 0;
                        const isBidder = player.id === round.bidderId;
                        const isFolded = round.playerParticipation?.[player.id] === "fold";

                        return (
                          <div
                            key={player.id}
                            className={cn(
                              "flex items-center justify-between text-sm",
                              isFolded && "opacity-60"
                            )}
                          >
                            <span className={cn(
                              "truncate",
                              isBidder && "font-medium"
                            )}>
                              {player.name}
                              {isBidder && " (bidder)"}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground tabular-nums">
                                {isFolded ? "Folded" : `${tricks} trick${tricks !== 1 ? "s" : ""}`}
                              </span>
                              <span className={cn(
                                "font-medium tabular-nums w-12 text-right",
                                scoreChange > 0 ? "text-primary" : scoreChange < 0 ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {scoreChange > 0 ? "+" : ""}{scoreChange}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
