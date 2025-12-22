import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlayerProfiles } from "@/lib/playerProfilesContext";
import { ArrowLeft, Trophy, Calendar, Users, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export default function GameHistory() {
  const [, setLocation] = useLocation();
  const { gameHistory } = usePlayerProfiles();
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());

  const toggleExpand = (gameId: string) => {
    setExpandedGames(prev => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const sortedHistory = [...gameHistory].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Game History</h1>
            <p className="text-sm text-muted-foreground">
              {gameHistory.length} game{gameHistory.length !== 1 ? "s" : ""} played
            </p>
          </div>
        </div>

        {sortedHistory.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No completed games yet. Finish a game to see it here!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedHistory.map(game => {
              const isExpanded = expandedGames.has(game.id);
              const sortedPlayers = [...game.players].sort((a, b) => b.finalScore - a.finalScore);

              return (
                <Collapsible
                  key={game.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpand(game.id)}
                >
                  <Card className="overflow-hidden" data-testid={`card-game-${game.id}`}>
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover-elevate">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{game.winnerName}</span>
                              {game.skunkStatus === "skunk" && (
                                <Badge variant="secondary" className="text-xs">Skunk</Badge>
                              )}
                              {game.skunkStatus === "doubleSkunk" && (
                                <Badge className="text-xs bg-amber-500">Double Skunk</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(game.completedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {game.playerCount} players
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {game.totalHands} hands
                              </Badge>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t pt-3">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Final Scores</h4>
                        <div className="space-y-1">
                          {sortedPlayers.map((player, index) => (
                            <div
                              key={player.name}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 text-muted-foreground">#{index + 1}</span>
                                <span className={cn(index === 0 && "font-medium")}>
                                  {player.name}
                                </span>
                                {index === 0 && (
                                  <Trophy className="h-3 w-3 text-primary" />
                                )}
                              </div>
                              <span className="font-medium tabular-nums">
                                {player.finalScore}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
