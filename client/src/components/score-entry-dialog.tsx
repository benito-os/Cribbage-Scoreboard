import { useState, useEffect } from "react";
import type { Card, ScoreEntry, ScoreBreakdown } from "@shared/schema";
import { calculateHandScore } from "@shared/schema";
import { CardSelector, StarterCardSelector, CardDisplay } from "./card-selector";
import { ScoreBreakdownDisplay } from "./score-breakdown";
import { getScoringModePreference, setScoringModePreference } from "@/pages/game-setup";
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
      setMode(getScoringModePreference());
    }
  }, [open, initialStarter]);

  const handleModeChange = (newMode: "calculated" | "manual") => {
    setMode(newMode);
    setScoringModePreference(newMode);
  };

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

        <Tabs value={mode} onValueChange={(v) => handleModeChange(v as "calculated" | "manual")}>
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
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="text-4xl font-bold tabular-nums min-w-[4ch] text-center py-3 px-6 bg-muted/50 rounded-lg">
                  {manualScore || "0"}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const current = manualScore || "";
                      const newVal = current + num.toString();
                      const numVal = parseInt(newVal);
                      if (numVal <= 29) {
                        setManualScore(newVal);
                      }
                    }}
                    data-testid={`button-numpad-${num}`}
                    className="h-12 text-lg font-medium"
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setManualScore("")}
                  data-testid="button-numpad-clear"
                  className="h-12 text-sm font-medium"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const current = manualScore || "";
                    const newVal = current + "0";
                    const numVal = parseInt(newVal);
                    if (numVal <= 29 && current !== "") {
                      setManualScore(newVal);
                    } else if (current === "") {
                      setManualScore("0");
                    }
                  }}
                  data-testid="button-numpad-0"
                  className="h-12 text-lg font-medium"
                >
                  0
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setManualScore(manualScore.slice(0, -1))}
                  data-testid="button-numpad-backspace"
                  className="h-12 text-sm font-medium"
                >
                  Del
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Maximum hand score is 29 points
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

const PEGGING_PRESETS = [
  { label: "Go", points: 1, description: "Last card / Go" },
  { label: "15", points: 2, description: "Cards sum to 15" },
  { label: "Pair", points: 2, description: "Matching rank" },
  { label: "31", points: 2, description: "Exact 31" },
  { label: "Run 3", points: 3, description: "3-card run" },
  { label: "Run 4", points: 4, description: "4-card run" },
  { label: "Run 5", points: 5, description: "5-card run" },
  { label: "Trips", points: 6, description: "Three of a kind" },
  { label: "Run 6", points: 6, description: "6-card run" },
  { label: "Run 7", points: 7, description: "7-card run" },
  { label: "Quads", points: 12, description: "Four of a kind" },
];

export function PeggingScoreDialog({
  open,
  onOpenChange,
  players,
  onSubmit,
}: PeggingScoreDialogProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const initial: Record<string, number> = {};
      players.forEach(p => { initial[p.id] = 0; });
      setScores(initial);
      setActivePlayer(players[0]?.id ?? null);
      setLastAction(null);
    }
  }, [open, players]);

  const handleSubmit = () => {
    onSubmit(scores);
    onOpenChange(false);
  };

  const addPoints = (playerId: string, points: number, label: string) => {
    setScores(prev => ({
      ...prev,
      [playerId]: Math.min(31, (prev[playerId] ?? 0) + points)
    }));
    const player = players.find(p => p.id === playerId);
    setLastAction(`+${points} ${label} for ${player?.name}`);
  };

  const adjustScore = (playerId: string, delta: number) => {
    setScores(prev => {
      const newScore = Math.max(0, Math.min(31, (prev[playerId] ?? 0) + delta));
      return { ...prev, [playerId]: newScore };
    });
    setLastAction(null);
  };

  const activePlayerName = players.find(p => p.id === activePlayer)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pegging</DialogTitle>
          <DialogDescription>
            Tap a player, then tap what they scored
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className={cn(
            "grid gap-1.5",
            players.length === 2 ? "grid-cols-2" : 
            players.length === 3 ? "grid-cols-3" : "grid-cols-2"
          )}>
            {players.map((player) => (
              <Button
                key={player.id}
                type="button"
                variant={activePlayer === player.id ? "default" : "outline"}
                onClick={() => setActivePlayer(player.id)}
                className="flex flex-col items-center gap-0.5 h-auto py-2 px-2"
                data-testid={`button-select-player-${player.id}`}
              >
                <span className="text-xs truncate max-w-full">{player.name}</span>
                <span className="text-xl font-bold tabular-nums">{scores[player.id] ?? 0}</span>
              </Button>
            ))}
          </div>

          {activePlayer && (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {PEGGING_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    onClick={() => addPoints(activePlayer, preset.points, preset.label)}
                    className="flex flex-col items-center gap-0 h-auto py-2 px-1"
                    data-testid={`button-peg-${preset.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <span className="text-sm font-medium">{preset.label}</span>
                    <span className="text-xs text-muted-foreground">+{preset.points}</span>
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => adjustScore(activePlayer, -1)}
                  className="flex flex-col items-center gap-0 h-auto py-2 px-1"
                  data-testid="button-peg-minus"
                >
                  <span className="text-sm font-medium">Undo</span>
                  <span className="text-xs text-muted-foreground">-1</span>
                </Button>
              </div>

              {lastAction && (
                <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-md py-1.5">
                  {lastAction}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
            Done Pegging
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
