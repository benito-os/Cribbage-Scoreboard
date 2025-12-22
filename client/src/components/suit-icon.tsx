import type { TrumpSuit } from "@shared/schema";
import { cn } from "@/lib/utils";

interface SuitIconProps {
  suit: TrumpSuit;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const suitSymbols: Record<TrumpSuit, string> = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
  none: "N",
};

const suitColors: Record<TrumpSuit, string> = {
  spades: "text-foreground",
  hearts: "text-red-500 dark:text-red-400",
  diamonds: "text-red-500 dark:text-red-400",
  clubs: "text-foreground",
  none: "text-muted-foreground",
};

const suitSizes: Record<"sm" | "md" | "lg", string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function SuitIcon({ suit, size = "md", className }: SuitIconProps) {
  return (
    <span
      className={cn(
        "font-bold select-none",
        suitColors[suit],
        suitSizes[size],
        className
      )}
      aria-label={suit}
    >
      {suitSymbols[suit]}
    </span>
  );
}

interface SuitSelectorProps {
  selected: TrumpSuit | null;
  onSelect: (suit: TrumpSuit) => void;
  showNoTrump?: boolean;
}

export function SuitSelector({ selected, onSelect, showNoTrump = false }: SuitSelectorProps) {
  const suits: TrumpSuit[] = showNoTrump 
    ? ["spades", "hearts", "diamonds", "clubs", "none"]
    : ["spades", "hearts", "diamonds", "clubs"];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {suits.map((suit) => (
        <button
          key={suit}
          type="button"
          onClick={() => onSelect(suit)}
          data-testid={`button-suit-${suit}`}
          className={cn(
            "w-14 h-14 rounded-md border-2 flex items-center justify-center transition-all",
            selected === suit
              ? "border-primary bg-primary/10"
              : "border-border hover-elevate active-elevate-2"
          )}
        >
          <SuitIcon suit={suit} size="lg" />
        </button>
      ))}
    </div>
  );
}
