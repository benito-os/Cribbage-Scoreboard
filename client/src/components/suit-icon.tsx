import type { Suit } from "@shared/schema";
import { cn } from "@/lib/utils";

interface SuitIconProps {
  suit: Suit;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const suitSymbols: Record<Suit, string> = {
  spades: "\u2660",
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
};

const suitColors: Record<Suit, string> = {
  spades: "text-foreground",
  hearts: "text-red-500 dark:text-red-400",
  diamonds: "text-red-500 dark:text-red-400",
  clubs: "text-foreground",
};

const suitSizes: Record<"sm" | "md" | "lg", string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
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
  selected: Suit | null;
  onSelect: (suit: Suit) => void;
}

export function SuitSelector({ selected, onSelect }: SuitSelectorProps) {
  const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {suits.map((suit) => (
        <button
          key={suit}
          type="button"
          onClick={() => onSelect(suit)}
          data-testid={`button-suit-${suit}`}
          className={cn(
            "w-10 h-10 rounded-md border-2 flex items-center justify-center transition-all",
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
