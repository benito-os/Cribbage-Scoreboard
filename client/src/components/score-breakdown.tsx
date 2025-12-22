import type { ScoreBreakdown, ScoreBreakdownItem } from "@shared/schema";
import { CardDisplay } from "./card-selector";
import { cn } from "@/lib/utils";

interface ScoreBreakdownDisplayProps {
  breakdown: ScoreBreakdown;
  className?: string;
}

const typeLabels: Record<ScoreBreakdownItem["type"], string> = {
  fifteen: "Fifteen",
  pair: "Pair",
  threeOfKind: "Three of a Kind",
  fourOfKind: "Four of a Kind",
  run: "Run",
  flush: "Flush",
  nobs: "Nobs",
};

const typeColors: Record<ScoreBreakdownItem["type"], string> = {
  fifteen: "text-blue-600 dark:text-blue-400",
  pair: "text-purple-600 dark:text-purple-400",
  threeOfKind: "text-purple-600 dark:text-purple-400",
  fourOfKind: "text-purple-600 dark:text-purple-400",
  run: "text-green-600 dark:text-green-400",
  flush: "text-amber-600 dark:text-amber-400",
  nobs: "text-pink-600 dark:text-pink-400",
};

export function ScoreBreakdownDisplay({ breakdown, className }: ScoreBreakdownDisplayProps) {
  if (breakdown.items.length === 0) {
    return (
      <div className={cn("text-center py-4 text-muted-foreground", className)}>
        No scoring combinations found (0 points)
      </div>
    );
  }

  const groupedItems = breakdown.items.reduce((acc, item) => {
    const key = item.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ScoreBreakdownItem[]>);

  return (
    <div className={cn("space-y-3", className)}>
      {Object.entries(groupedItems).map(([type, items]) => (
        <div key={type} className="space-y-1">
          <div className={cn("text-sm font-medium", typeColors[type as ScoreBreakdownItem["type"]])}>
            {typeLabels[type as ScoreBreakdownItem["type"]]} ({items.reduce((sum, i) => sum + i.points, 0)} pts)
          </div>
          <div className="space-y-1 pl-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">+{item.points}</span>
                <div className="flex gap-0.5">
                  {item.cards.map((card, cardIdx) => (
                    <CardDisplay key={cardIdx} card={card} size="sm" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="pt-2 border-t flex items-center justify-between">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold">{breakdown.total} points</span>
      </div>
    </div>
  );
}
