import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Player } from "@shared/schema";
import { Crown, CircleDot } from "lucide-react";

interface PlayerScoreCardProps {
  player: Player;
  targetScore: number;
  isCurrentBidder?: boolean;
  isWinner?: boolean;
  isNextDealer?: boolean;
  rank?: number;
}

export function PlayerScoreCard({
  player,
  targetScore,
  isCurrentBidder = false,
  isWinner = false,
  isNextDealer = false,
  rank,
}: PlayerScoreCardProps) {
  const progress = Math.max(0, Math.min(100, (player.score / targetScore) * 100));
  const isNegative = player.score < 0;

  return (
    <Card
      className={cn(
        "relative p-4 transition-all",
        isWinner && "ring-2 ring-primary",
        isCurrentBidder && "ring-2 ring-chart-4"
      )}
      data-testid={`card-player-${player.id}`}
    >
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="gap-1">
            <Crown className="h-3 w-3" />
            Winner
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h3
            className="font-medium text-lg truncate"
            data-testid={`text-player-name-${player.id}`}
          >
            {player.name}
          </h3>
          {player.isDealer && (
            <Badge variant="outline" className="gap-1 text-xs">
              <CircleDot className="h-3 w-3" />
              Dealer
            </Badge>
          )}
          {isNextDealer && !player.isDealer && (
            <Badge variant="secondary" className="text-xs">
              Next
            </Badge>
          )}
        </div>
        {rank !== undefined && (
          <Badge variant="secondary" className="flex-shrink-0 text-xs">
            #{rank}
          </Badge>
        )}
      </div>

      <div className="text-center mb-3">
        <span
          className={cn(
            "text-5xl font-bold tabular-nums tracking-tight",
            isNegative && "text-destructive"
          )}
          data-testid={`text-player-score-${player.id}`}
        >
          {player.score}
        </span>
        <span className="text-muted-foreground text-lg ml-1">
          / {targetScore}
        </span>
      </div>

      <Progress
        value={progress}
        className="h-2"
        data-testid={`progress-player-${player.id}`}
      />

      {isCurrentBidder && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <Badge className="bg-chart-4 text-white">Bidding</Badge>
        </div>
      )}
    </Card>
  );
}
