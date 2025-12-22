import type { Player } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface CribbageBoardProps {
  players: Player[];
  targetScore: number;
}

const DOUBLE_SKUNK_LINE = 61;
const SKUNK_LINE = 91;

const PLAYER_COLORS = [
  { bg: "bg-red-500", text: "text-red-600 dark:text-red-400", border: "border-red-500" },
  { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500" },
  { bg: "bg-green-500", text: "text-green-600 dark:text-green-400", border: "border-green-500" },
  { bg: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500" },
];

export function CribbageBoard({ players, targetScore }: CribbageBoardProps) {
  const getPercentage = (score: number) => Math.min(100, (score / targetScore) * 100);
  
  const milestones = [
    { score: DOUBLE_SKUNK_LINE, label: "61", color: "bg-red-500", description: "Double Skunk" },
    { score: SKUNK_LINE, label: "91", color: "bg-amber-500", description: "Skunk" },
    { score: targetScore, label: "121", color: "bg-green-500", description: "Finish" },
  ];

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <div className="relative bg-muted/50 rounded-lg p-4">
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-6">
          <div className="absolute inset-0 flex">
            <div 
              className="bg-red-500/20" 
              style={{ width: `${getPercentage(DOUBLE_SKUNK_LINE)}%` }} 
            />
            <div 
              className="bg-amber-500/20" 
              style={{ width: `${getPercentage(SKUNK_LINE) - getPercentage(DOUBLE_SKUNK_LINE)}%` }} 
            />
            <div 
              className="bg-green-500/20" 
              style={{ width: `${100 - getPercentage(SKUNK_LINE)}%` }} 
            />
          </div>
          
          {milestones.map((milestone) => (
            <div
              key={milestone.score}
              className="absolute top-0 bottom-0 w-0.5 bg-border"
              style={{ left: `${getPercentage(milestone.score)}%` }}
            />
          ))}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mb-4">
          <span>0</span>
          <div className="flex gap-6">
            {milestones.map((milestone) => (
              <div key={milestone.score} className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", milestone.color)} />
                <span>{milestone.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {sortedPlayers.map((player) => {
            const color = PLAYER_COLORS[players.indexOf(player)] || PLAYER_COLORS[0];
            const percentage = getPercentage(player.score);
            const isWinner = player.score >= targetScore;
            
            return (
              <div key={player.id} className="flex items-center gap-3">
                <div className="w-20 flex items-center gap-1.5 flex-shrink-0">
                  <div className={cn("w-3 h-3 rounded-full flex-shrink-0", color.bg)} />
                  <span className={cn("text-sm font-medium truncate", color.text)}>
                    {player.name}
                  </span>
                </div>
                
                <div className="flex-1 relative">
                  <div className="h-6 bg-muted rounded-md overflow-hidden relative">
                    <div 
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-md transition-all duration-300",
                        color.bg,
                        "opacity-80"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                    
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-red-500/50"
                      style={{ left: `${getPercentage(DOUBLE_SKUNK_LINE)}%` }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-amber-500/50"
                      style={{ left: `${getPercentage(SKUNK_LINE)}%` }}
                    />
                    
                    <div 
                      className="absolute inset-y-0 flex items-center justify-end pr-2 transition-all duration-300"
                      style={{ width: `${Math.max(percentage, 10)}%` }}
                    >
                      {isWinner ? (
                        <Trophy className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-bold text-white drop-shadow-sm">
                          {player.score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="w-12 text-right flex-shrink-0">
                  <span className="text-sm tabular-nums font-medium">
                    {targetScore - player.score > 0 ? targetScore - player.score : "Win"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-red-500/20 rounded-sm border border-red-500/30" />
          <span>Double Skunk Zone (0-60)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-amber-500/20 rounded-sm border border-amber-500/30" />
          <span>Skunk Zone (61-90)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-green-500/20 rounded-sm border border-green-500/30" />
          <span>Safe (91-121)</span>
        </div>
      </div>
    </div>
  );
}
