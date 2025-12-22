import type { Player } from "@shared/schema";
import { cn } from "@/lib/utils";
import { AlertTriangle, Flag } from "lucide-react";

interface CribbageBoardProps {
  players: Player[];
  targetScore: number;
}

const DOUBLE_SKUNK_LINE = 61;
const SKUNK_LINE = 91;

const PLAYER_COLORS = [
  { peg: "bg-red-500", track: "bg-red-500/20", text: "text-red-600 dark:text-red-400" },
  { peg: "bg-blue-500", track: "bg-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
  { peg: "bg-green-500", track: "bg-green-500/20", text: "text-green-600 dark:text-green-400" },
  { peg: "bg-amber-500", track: "bg-amber-500/20", text: "text-amber-600 dark:text-amber-400" },
];

export function CribbageBoard({ players, targetScore }: CribbageBoardProps) {
  const getPercentage = (score: number) => Math.min((score / targetScore) * 100, 100);
  
  const doubleSkunkPct = getPercentage(DOUBLE_SKUNK_LINE);
  const skunkPct = getPercentage(SKUNK_LINE);

  return (
    <div className="space-y-3 p-4 rounded-lg bg-amber-900/10 dark:bg-amber-900/20 border border-amber-800/20">
      <div className="relative">
        <div className="h-12 bg-amber-100 dark:bg-amber-950/50 rounded-lg overflow-hidden relative border border-amber-200 dark:border-amber-800">
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-400/60 dark:bg-red-500/40 z-10"
            style={{ left: `${doubleSkunkPct}%` }}
          />
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400/60 dark:bg-amber-500/40 z-10"
            style={{ left: `${skunkPct}%` }}
          />
          
          <div className="absolute inset-0 flex">
            {[0, 30, 60, 90].map(pos => (
              <div
                key={pos}
                className="absolute top-0 bottom-0 w-px bg-amber-300/50 dark:bg-amber-700/50"
                style={{ left: `${(pos / targetScore) * 100}%` }}
              />
            ))}
          </div>

          <div
            className="absolute right-0 top-0 bottom-0 w-2 bg-primary/30 border-l-2 border-primary"
            title="Finish"
          />

          {players.map((player, idx) => {
            const pct = getPercentage(player.score);
            const color = PLAYER_COLORS[idx];
            const offset = (idx - (players.length - 1) / 2) * 8;
            
            return (
              <div
                key={player.id}
                className={cn(
                  "absolute h-3 w-3 rounded-full transition-all duration-500 shadow-md border-2 border-white dark:border-gray-800",
                  color.peg
                )}
                style={{
                  left: `calc(${pct}% - 6px)`,
                  top: `calc(50% + ${offset}px - 6px)`,
                }}
                title={`${player.name}: ${player.score} pts`}
              />
            );
          })}
        </div>

        <div className="absolute -bottom-1 flex justify-between w-full text-[10px] text-muted-foreground px-1">
          <span>0</span>
          <span style={{ position: 'absolute', left: `${doubleSkunkPct}%`, transform: 'translateX(-50%)' }}>
            {DOUBLE_SKUNK_LINE}
          </span>
          <span style={{ position: 'absolute', left: `${skunkPct}%`, transform: 'translateX(-50%)' }}>
            {SKUNK_LINE}
          </span>
          <span className="ml-auto">{targetScore}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mt-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-red-500 dark:text-red-400">
            <AlertTriangle className="h-3 w-3" />
            <span>Double Skunk</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span>Skunk</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-primary">
          <Flag className="h-3 w-3" />
          <span>Finish</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1">
        {players.map((player, idx) => {
          const color = PLAYER_COLORS[idx];
          return (
            <div key={player.id} className="flex items-center gap-1.5">
              <div className={cn("h-2.5 w-2.5 rounded-full", color.peg)} />
              <span className={cn("font-medium", color.text)}>{player.name}</span>
              <span className="text-muted-foreground">({player.score})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
