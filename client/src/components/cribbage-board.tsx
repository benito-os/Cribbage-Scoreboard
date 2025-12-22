import type { Player } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CribbageBoardProps {
  players: Player[];
  targetScore: number;
}

const DOUBLE_SKUNK_LINE = 61;
const SKUNK_LINE = 91;

const PLAYER_COLORS = [
  { peg: "bg-red-500", hole: "bg-red-500/30", text: "text-red-600 dark:text-red-400", ring: "ring-red-500" },
  { peg: "bg-blue-500", hole: "bg-blue-500/30", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500" },
  { peg: "bg-green-500", hole: "bg-green-500/30", text: "text-green-600 dark:text-green-400", ring: "ring-green-500" },
  { peg: "bg-amber-500", hole: "bg-amber-500/30", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500" },
];

export function CribbageBoard({ players, targetScore }: CribbageBoardProps) {
  const holesPerRow = 30;
  const rows = 4;
  const totalHoles = holesPerRow * rows + 1;

  const getHolePosition = (score: number): { row: number; col: number; isStart: boolean; isFinish: boolean } => {
    if (score >= targetScore) {
      return { row: 3, col: holesPerRow, isStart: false, isFinish: true };
    }
    if (score <= 0) {
      return { row: -1, col: 0, isStart: true, isFinish: false };
    }
    const adjustedScore = score - 1;
    const row = Math.floor(adjustedScore / holesPerRow);
    const col = row % 2 === 0 
      ? adjustedScore % holesPerRow 
      : holesPerRow - 1 - (adjustedScore % holesPerRow);
    return { row, col, isStart: false, isFinish: false };
  };

  const isSkunkHole = (holeScore: number) => holeScore === SKUNK_LINE;
  const isDoubleSkunkHole = (holeScore: number) => holeScore === DOUBLE_SKUNK_LINE;

  const getHoleScore = (row: number, col: number): number => {
    const isReversed = row % 2 === 1;
    const actualCol = isReversed ? holesPerRow - 1 - col : col;
    return row * holesPerRow + actualCol + 1;
  };

  const playersAtStart = players.filter(p => getHolePosition(p.score).isStart);
  const playersAtFinish = players.filter(p => getHolePosition(p.score).isFinish);

  return (
    <div className="space-y-2">
      <div className="bg-gradient-to-br from-amber-800 to-amber-900 dark:from-amber-900 dark:to-amber-950 rounded-lg p-3 shadow-inner">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-amber-200/60">Start</span>
          <div className="flex gap-1">
            {playersAtStart.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "w-2.5 h-2.5 rounded-full shadow-md ring-1 ring-white/50",
                  PLAYER_COLORS[players.indexOf(p)]?.peg
                )}
                title={`${p.name}: ${p.score} pts`}
              />
            ))}
            {playersAtStart.length === 0 && (
              <div className="w-2.5 h-2.5 rounded-full bg-amber-950/60" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const isReversed = rowIndex % 2 === 1;
            
            return (
              <div key={rowIndex} className="flex items-center gap-0.5">
                <div className="w-6 text-[10px] text-amber-200/60 text-right pr-1">
                  {rowIndex * holesPerRow + 1}
                </div>
                
                <div className={cn(
                  "flex gap-[2px]",
                  isReversed && "flex-row-reverse"
                )}>
                  {Array.from({ length: holesPerRow }).map((_, colIndex) => {
                    const holeScore = getHoleScore(rowIndex, colIndex);
                    const isSkunk = isSkunkHole(holeScore);
                    const isDoubleSkunk = isDoubleSkunkHole(holeScore);
                    
                    const playersAtHole = players.filter(p => {
                      const pos = getHolePosition(p.score);
                      return !pos.isStart && !pos.isFinish && pos.row === rowIndex && pos.col === colIndex;
                    });

                    const isFifth = (colIndex + 1) % 5 === 0;

                    return (
                      <div
                        key={colIndex}
                        className={cn(
                          "relative w-2 h-2 rounded-full transition-all",
                          isFifth ? "mr-1" : "",
                          isSkunk 
                            ? "bg-amber-400/80 ring-1 ring-amber-300" 
                            : isDoubleSkunk 
                              ? "bg-red-400/80 ring-1 ring-red-300" 
                              : "bg-amber-950/60 dark:bg-amber-950/80"
                        )}
                        title={`Hole ${holeScore}`}
                      >
                        {playersAtHole.length > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {playersAtHole.length === 1 ? (
                              <div className={cn(
                                "w-2.5 h-2.5 rounded-full shadow-md ring-1 ring-white/50",
                                PLAYER_COLORS[players.indexOf(playersAtHole[0])]?.peg
                              )} />
                            ) : (
                              <div className="flex -space-x-1">
                                {playersAtHole.slice(0, 2).map((p, i) => (
                                  <div
                                    key={p.id}
                                    className={cn(
                                      "w-2 h-2 rounded-full shadow-md ring-1 ring-white/50",
                                      PLAYER_COLORS[players.indexOf(p)]?.peg
                                    )}
                                    style={{ zIndex: 10 - i }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="w-6 text-[10px] text-amber-200/60 text-left pl-1">
                  {(rowIndex + 1) * holesPerRow}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-end pr-6 mt-1 gap-2">
            <span className="text-[10px] text-amber-200/60">{targetScore}</span>
            <div className={cn(
              "w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 ring-2 ring-amber-300/50 shadow-lg",
              "flex items-center justify-center"
            )}>
              {playersAtFinish.length > 0 && (
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full shadow-md ring-1 ring-white/50",
                  PLAYER_COLORS[players.indexOf(playersAtFinish[0])]?.peg
                )} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {players.map((player, idx) => {
            const color = PLAYER_COLORS[idx];
            return (
              <div key={player.id} className="flex items-center gap-1.5">
                <div className={cn("h-2.5 w-2.5 rounded-full shadow-sm", color.peg)} />
                <span className={cn("font-medium", color.text)}>{player.name}</span>
                <span className="text-muted-foreground">({player.score})</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400/80" />
            <span>61</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400/80" />
            <span>91</span>
          </div>
        </div>
      </div>
    </div>
  );
}
