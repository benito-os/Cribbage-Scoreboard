import { useState } from "react";
import type { HandResult, Player } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, CircleDot, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface HandHistoryProps {
  hands: HandResult[];
  players: Player[];
  maxHeight?: string;
}

export function HandHistory({ hands, players, maxHeight = "400px" }: HandHistoryProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name ?? "Unknown";

  const reversedHands = [...hands].reverse();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between py-2"
          data-testid="button-toggle-history"
        >
          <span className="text-sm font-medium text-muted-foreground">
            Hand History ({hands.length})
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          className="space-y-2 overflow-y-auto pr-1"
          style={{ maxHeight }}
        >
          {reversedHands.map((hand) => (
            <Card key={hand.id} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Hand {hand.handNumber}</Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CircleDot className="h-3 w-3" />
                    <span>{getPlayerName(hand.dealerId)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(hand.scoreChanges).map(([playerId, change]) => {
                  const playerName = getPlayerName(playerId);
                  const isDealer = playerId === hand.dealerId;
                  
                  const peggingPts = hand.peggingScores[playerId] ?? 0;
                  const handEntry = hand.handScores.find(s => s.playerId === playerId);
                  const handPts = handEntry?.points ?? 0;
                  const cribPts = hand.cribScore?.playerId === playerId ? hand.cribScore.points : 0;

                  return (
                    <div
                      key={playerId}
                      className={cn(
                        "p-2 rounded-md bg-muted/50",
                        change > 0 && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{playerName}</span>
                        <span className={cn(
                          "font-bold",
                          change > 0 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {change > 0 ? "+" : ""}{change}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 space-x-2">
                        {peggingPts > 0 && <span>Peg: {peggingPts}</span>}
                        {handPts > 0 && <span>Hand: {handPts}</span>}
                        {cribPts > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <Crown className="h-3 w-3" />
                            {cribPts}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
