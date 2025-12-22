import { useState } from "react";
import type { Card, Suit, Rank } from "@shared/schema";
import { suits, ranks } from "@shared/schema";
import { SuitIcon } from "./suit-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface CardDisplayProps {
  card: Card;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export function CardDisplay({ card, size = "md", onClick, selected, className }: CardDisplayProps) {
  const sizeClasses = {
    sm: "w-8 h-11 text-xs",
    md: "w-12 h-16 text-sm",
    lg: "w-16 h-22 text-base",
  };

  const isRed = card.suit === "hearts" || card.suit === "diamonds";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      data-testid={`card-${card.rank}-${card.suit}`}
      className={cn(
        "rounded-md border-2 bg-card flex flex-col items-center justify-center font-bold transition-all",
        sizeClasses[size],
        isRed ? "text-red-500 dark:text-red-400" : "text-foreground",
        selected ? "border-primary ring-2 ring-primary/50" : "border-border",
        onClick && "hover-elevate active-elevate-2 cursor-pointer",
        !onClick && "cursor-default",
        className
      )}
    >
      <span>{card.rank}</span>
      <SuitIcon suit={card.suit} size="sm" />
    </button>
  );
}

interface CardSelectorProps {
  selectedCards: Card[];
  onCardsChange: (cards: Card[]) => void;
  maxCards: number;
  excludeCards?: Card[];
  label?: string;
}

export function CardSelector({ 
  selectedCards, 
  onCardsChange, 
  maxCards,
  excludeCards = [],
  label 
}: CardSelectorProps) {
  const [activeSuit, setActiveSuit] = useState<Suit>("spades");

  const isCardSelected = (card: Card) => 
    selectedCards.some(c => c.rank === card.rank && c.suit === card.suit);

  const isCardExcluded = (card: Card) =>
    excludeCards.some(c => c.rank === card.rank && c.suit === card.suit);

  const toggleCard = (card: Card) => {
    if (isCardSelected(card)) {
      onCardsChange(selectedCards.filter(c => !(c.rank === card.rank && c.suit === card.suit)));
    } else if (selectedCards.length < maxCards) {
      onCardsChange([...selectedCards, card]);
    }
  };

  const clearCards = () => {
    onCardsChange([]);
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">
            {selectedCards.length}/{maxCards} selected
          </span>
        </div>
      )}

      {selectedCards.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center p-2 bg-muted/50 rounded-md">
          {selectedCards.map((card, idx) => (
            <CardDisplay
              key={`${card.rank}-${card.suit}-${idx}`}
              card={card}
              size="md"
              onClick={() => toggleCard(card)}
              selected
            />
          ))}
          {selectedCards.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearCards}
              className="ml-auto"
              data-testid="button-clear-cards"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-1 justify-center">
        {suits.map((suit) => (
          <button
            key={suit}
            type="button"
            onClick={() => setActiveSuit(suit)}
            data-testid={`button-tab-${suit}`}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              activeSuit === suit
                ? "bg-primary text-primary-foreground"
                : "hover-elevate active-elevate-2"
            )}
          >
            <SuitIcon suit={suit} size="md" className={activeSuit === suit ? "text-primary-foreground" : undefined} />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {ranks.map((rank) => {
          const card: Card = { rank, suit: activeSuit };
          const selected = isCardSelected(card);
          const excluded = isCardExcluded(card);
          const disabled = excluded || (!selected && selectedCards.length >= maxCards);

          return (
            <button
              key={rank}
              type="button"
              onClick={() => !disabled && toggleCard(card)}
              disabled={disabled}
              data-testid={`button-card-${rank}-${activeSuit}`}
              className={cn(
                "h-10 rounded-md border-2 font-bold transition-all",
                selected && "border-primary bg-primary/10",
                !selected && !disabled && "border-border hover-elevate active-elevate-2",
                disabled && !selected && "border-border/50 opacity-40 cursor-not-allowed",
                (activeSuit === "hearts" || activeSuit === "diamonds") 
                  ? "text-red-500 dark:text-red-400" 
                  : "text-foreground"
              )}
            >
              {rank}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface StarterCardSelectorProps {
  value: Card | undefined;
  onChange: (card: Card | undefined) => void;
  excludeCards?: Card[];
}

export function StarterCardSelector({ value, onChange, excludeCards = [] }: StarterCardSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);

  if (value && !showPicker) {
    return (
      <div className="space-y-2">
        <span className="text-sm font-medium">Starter Card (Cut)</span>
        <div className="flex items-center gap-2">
          <CardDisplay card={value} size="lg" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(true)}
            data-testid="button-change-starter"
          >
            Change
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
            data-testid="button-clear-starter"
          >
            Clear
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <CardSelector
        selectedCards={value ? [value] : []}
        onCardsChange={(cards) => {
          if (cards.length > 0) {
            onChange(cards[0]);
            setShowPicker(false);
          } else {
            onChange(undefined);
          }
        }}
        maxCards={1}
        excludeCards={excludeCards}
        label="Starter Card (Cut)"
      />
    </div>
  );
}
