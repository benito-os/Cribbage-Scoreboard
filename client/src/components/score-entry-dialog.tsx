import { useState, useEffect } from "react";
import type { Card, ScoreEntry, ScoreBreakdown } from "@shared/schema";
import { calculateHandScore } from "@shared/schema";
import { CardSelector, StarterCardSelector, CardDisplay } from "./card-selector";
import { ScoreBreakdownDisplay } from "./score-breakdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Pencil, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  playerId: string;
  isCrib?: boolean;
  starterCard?: Card;
  onSubmit: (entry: ScoreEntry) => void;
  existingHandCards?: Card[];
}

export function ScoreEntryDialog({
  open,
  onOpenChange,
  playerName,
  playerId,
  isCrib = false,
  starterCard: initialStarter,
  onSubmit,
  existingHandCards = [],
}: ScoreEntryDialogProps) {
  const [mode, setMode] = useState<"calculated" | "manual">("calculated");
  const [handCards, setHandCards] = useState<Card[]>([]);
  const [starterCard, setStarterCard] = useState<Card | undefined>(initialStarter);
  const [manualScore, setManualScore] = useState("");
  const [editedScore, setEditedScore] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open) {
      setHandCards([]);
      setStarterCard(initialStarter);
      setManualScore("");
      setEditedScore(null);
      setIsEditing(false);
      setMode("calculated");
    }
  }, [open, initialStarter]);

  const breakdown: ScoreBreakdown | null = 
    handCards.length === 4 
      ? calculateHandScore(handCards, starterCard, isCrib)
      : null;

  const calculatedScore = breakdown?.total ?? 0;
  const displayScore = editedScore !== null ? editedScore : calculatedScore;
  const wasEdited = editedScore !== null && editedScore !== calculatedScore;

  const handleSubmit = () => {
    if (mode === "calculated" && handCards.length === 4) {
      const entry: ScoreEntry = {
        playerId,
        points: displayScore,
        entryMode: "calculated",
        cards: handCards,
        starterCard,
        breakdown: breakdown ?? undefined,
        wasEdited,
      };
      onSubmit(entry);
      onOpenChange(false);
    } else if (mode === "manual") {
      const score = parseInt(manualScore) || 0;
      const entry: ScoreEntry = {
        playerId,
        points: score,
        entryMode: "manual",
        wasEdited: false,
      };
      onSubmit(entry);
      onOpenChange(false);
    }
  };

  const canSubmitCalculated = handCards.length === 4;
  const canSubmitManual = manualScore !== "" && !isNaN(parseInt(manualScore));
  const canSubmit = mode === "calculated" ? canSubmitCalculated : canSubmitManual;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCrib ? `${playerName}'s Crib` : `${playerName}'s Hand`}
          </DialogTitle>
          <DialogDescription>
            Enter the score for this {isCrib ? "crib" : "hand"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "calculated" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calculated" className="gap-2" data-testid="tab-calculated">
              <Calculator className="h-4 w-4" />
              Card Entry
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2" data-testid="tab-manual">
              <Pencil className="h-4 w-4" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculated" className="space-y-4 mt-4">
            {!initialStarter && (
              <StarterCardSelector
                value={starterCard}
                onChange={setStarterCard}
                excludeCards={handCards}
              />
            )}
            
            {initialStarter && (
              <div className="space-y-1">
                <span className="text-sm font-medium">Starter Card</span>
                <div className="flex items-center gap-2">
                  <CardDisplay card={initialStarter} size="md" />
                </div>
              </div>
            )}

            <CardSelector
              selectedCards={handCards}
              onCardsChange={setHandCards}
              maxCards={4}
              excludeCards={starterCard ? [starterCard, ...existingHandCards] : existingHandCards}
              label={isCrib ? "Crib Cards" : "Hand Cards"}
            />

            {breakdown && (
              <div className="border rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Score Breakdown</span>
                  {!isEditing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-edit-score"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit Score
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editedScore ?? calculatedScore}
                        onChange={(e) => setEditedScore(parseInt(e.target.value) || 0)}
                        className="w-20 h-8"
                        data-testid="input-edited-score"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(false)}
                        data-testid="button-confirm-edit"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <ScoreBreakdownDisplay breakdown={breakdown} />

                {wasEdited && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Score adjusted from {calculatedScore} to {editedScore}
                    </span>
                  </div>
                )}
              </div>
            )}

            {handCards.length > 0 && handCards.length < 4 && (
              <div className="text-sm text-muted-foreground text-center">
                Select {4 - handCards.length} more card{4 - handCards.length !== 1 ? "s" : ""}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="manual-score">Points</Label>
              <Input
                id="manual-score"
                type="number"
                min="0"
                max="29"
                placeholder="Enter score (0-29)"
                value={manualScore}
                onChange={(e) => setManualScore(e.target.value)}
                data-testid="input-manual-score"
              />
              <p className="text-sm text-muted-foreground">
                Enter the total points for this {isCrib ? "crib" : "hand"}.
                Maximum possible is 29 points.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="button-submit-score"
          >
            Submit {mode === "calculated" && canSubmitCalculated ? `(${displayScore} pts)` : "Score"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PeggingScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: { id: string; name: string }[];
  onSubmit: (scores: Record<string, number>) => void;
}

export function PeggingScoreDialog({
  open,
  onOpenChange,
  players,
  onSubmit,
}: PeggingScoreDialogProps) {
  const [scores, setScores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      players.forEach(p => { initial[p.id] = "0"; });
      setScores(initial);
    }
  }, [open, players]);

  const handleSubmit = () => {
    const numericScores: Record<string, number> = {};
    for (const [id, score] of Object.entries(scores)) {
      numericScores[id] = parseInt(score) || 0;
    }
    onSubmit(numericScores);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pegging Scores</DialogTitle>
          <DialogDescription>
            Enter points earned during the play phase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between gap-4">
              <Label htmlFor={`peg-${player.id}`} className="flex-1">
                {player.name}
              </Label>
              <Input
                id={`peg-${player.id}`}
                type="number"
                min="0"
                className="w-20"
                value={scores[player.id] ?? "0"}
                onChange={(e) => setScores({ ...scores, [player.id]: e.target.value })}
                data-testid={`input-pegging-${player.id}`}
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-pegging"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            data-testid="button-submit-pegging"
          >
            Continue to Counting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
