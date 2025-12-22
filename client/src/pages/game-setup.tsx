import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useGame } from "@/lib/gameContext";
import { usePlayerProfiles } from "@/lib/playerProfilesContext";
import { getTargetScore } from "@shared/schema";
import { PlayerComboInput } from "@/components/player-combo-input";
import { Users, CircleDot, Play, History, UserCog, Calculator } from "lucide-react";

const SCORING_MODE_KEY = "cribbage-scoring-mode";

export function getScoringModePreference(): "calculated" | "manual" {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(SCORING_MODE_KEY);
    if (saved === "manual" || saved === "calculated") {
      return saved;
    }
  }
  return "calculated";
}

export function setScoringModePreference(mode: "calculated" | "manual") {
  localStorage.setItem(SCORING_MODE_KEY, mode);
}

export default function GameSetup() {
  const { createGame, gameState } = useGame();
  const { getOrCreateProfile, gameHistory } = usePlayerProfiles();
  const [, setLocation] = useLocation();

  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", ""]);
  const [dealerIndex, setDealerIndex] = useState<number>(0);
  const [scoringMode, setScoringMode] = useState<"calculated" | "manual">("calculated");

  useEffect(() => {
    setScoringMode(getScoringModePreference());
  }, []);

  const handleScoringModeChange = (useManual: boolean) => {
    const newMode = useManual ? "manual" : "calculated";
    setScoringMode(newMode);
    setScoringModePreference(newMode);
  };

  const hasExistingGame = gameState !== null && gameState.gamePhase !== "complete";

  const handlePlayerCountChange = (value: string) => {
    const count = parseInt(value) as 2 | 3 | 4;
    setPlayerCount(count);
    if (dealerIndex >= count) {
      setDealerIndex(0);
    }
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    const names = playerNames.slice(0, playerCount);
    const validNames = names.map((name, i) => name.trim() || `Player ${i + 1}`);
    
    const playerInputs = validNames.map(name => {
      const profile = getOrCreateProfile(name);
      return { name, profileId: profile.id };
    });
    
    createGame(playerCount, playerInputs, dealerIndex);
    setLocation("/game");
  };

  const handleResumeGame = () => {
    setLocation("/game");
  };

  const targetScore = getTargetScore();

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cribbage</h1>
            <p className="text-sm text-muted-foreground">Scorekeeper</p>
          </div>
          <div className="flex gap-2">
            <Link href="/players">
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="link-manage-players">
                <UserCog className="h-4 w-4" />
                Players
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="link-game-history">
                <History className="h-4 w-4" />
                {gameHistory.length > 0 ? gameHistory.length : ""}
              </Button>
            </Link>
          </div>
        </div>

        {hasExistingGame && (
          <Card className="p-4 mb-6 border-primary">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Game in Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Hand {gameState.hands.length + 1} • {gameState.playerCount} players
                </p>
              </div>
              <Button onClick={handleResumeGame} data-testid="button-resume-game">
                Resume
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">New Game Setup</h2>

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Number of Players
            </Label>
            <RadioGroup
              value={playerCount.toString()}
              onValueChange={handlePlayerCountChange}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="players-2" data-testid="radio-players-2" />
                <Label htmlFor="players-2" className="cursor-pointer">
                  2 Players
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="players-3" data-testid="radio-players-3" />
                <Label htmlFor="players-3" className="cursor-pointer">
                  3 Players
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="players-4" data-testid="radio-players-4" />
                <Label htmlFor="players-4" className="cursor-pointer">
                  4 Players
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base">Player Names</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Type a new name or select an existing player from the dropdown
            </p>
            <div className="space-y-2">
              {Array.from({ length: playerCount }).map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <PlayerComboInput
                    value={playerNames[index]}
                    onChange={(value) => handleNameChange(index, value)}
                    placeholder={`Player ${index + 1}`}
                    data-testid={`input-player-name-${index}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={dealerIndex === index ? "default" : "outline"}
                    size="icon"
                    onClick={() => setDealerIndex(index)}
                    title="Set as first dealer"
                    data-testid={`button-dealer-${index}`}
                  >
                    <CircleDot className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Click the circle icon to select the first dealer
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="scoring-mode" className="text-base cursor-pointer">
                Card Entry (Auto-calculate)
              </Label>
            </div>
            <Switch
              id="scoring-mode"
              checked={scoringMode === "calculated"}
              onCheckedChange={(checked) => handleScoringModeChange(!checked)}
              data-testid="switch-scoring-mode"
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target Score</span>
              <span className="font-medium">{targetScore} points</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Skunk Line</span>
              <span className="font-medium">91 points</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Double Skunk</span>
              <span className="font-medium">61 points</span>
            </div>
          </div>

          <Button
            onClick={handleStartGame}
            className="w-full h-12 text-lg gap-2"
            data-testid="button-start-game"
          >
            <Play className="h-5 w-5" />
            Start Game
          </Button>
        </Card>
      </div>
    </div>
  );
}
