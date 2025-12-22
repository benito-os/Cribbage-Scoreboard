import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGame } from "@/lib/gameContext";
import { getTargetScore } from "@shared/schema";
import { Users, CircleDot, Play, Flame } from "lucide-react";

export default function GameSetup() {
  const { createGame, gameState } = useGame();
  const [, setLocation] = useLocation();

  const [playerCount, setPlayerCount] = useState<3 | 4>(4);
  const [playerNames, setPlayerNames] = useState<string[]>(["", "", "", ""]);
  const [dealerIndex, setDealerIndex] = useState<number>(0);

  // If there's an existing game, offer to resume
  const hasExistingGame = gameState !== null && gameState.gamePhase !== "complete";

  const handlePlayerCountChange = (value: string) => {
    const count = parseInt(value) as 3 | 4;
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
    createGame(playerCount, validNames, dealerIndex);
    setLocation("/game");
  };

  const handleResumeGame = () => {
    setLocation("/game");
  };

  const targetScore = getTargetScore(playerCount);
  const canStart = true; // Names default to "Player X" if empty

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Flame className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Pepper</h1>
          <p className="text-muted-foreground">
            The classic Midwestern trick-taking card game
          </p>
        </div>

        {/* Resume Existing Game */}
        {hasExistingGame && (
          <Card className="p-4 mb-6 border-primary">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Game in Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Round {gameState.rounds.length + 1} • {gameState.playerCount} players
                </p>
              </div>
              <Button onClick={handleResumeGame} data-testid="button-resume-game">
                Resume
              </Button>
            </div>
          </Card>
        )}

        {/* Setup Form */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">New Game Setup</h2>

          {/* Player Count */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Number of Players
            </Label>
            <RadioGroup
              value={playerCount.toString()}
              onValueChange={handlePlayerCountChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="players-3" data-testid="radio-players-3" />
                <Label htmlFor="players-3" className="cursor-pointer">
                  3 Players (32 pts)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="players-4" data-testid="radio-players-4" />
                <Label htmlFor="players-4" className="cursor-pointer">
                  4 Players (25 pts)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Player Names */}
          <div className="space-y-3">
            <Label className="text-base">Player Names</Label>
            <div className="space-y-2">
              {Array.from({ length: playerCount }).map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Player ${index + 1}`}
                    value={playerNames[index]}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    data-testid={`input-player-name-${index}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={dealerIndex === index ? "default" : "outline"}
                    size="icon"
                    onClick={() => setDealerIndex(index)}
                    title="Set as dealer"
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

          {/* Game Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target Score</span>
              <span className="font-medium">{targetScore} points</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max Bid</span>
              <span className="font-medium">{playerCount === 3 ? "8" : "6"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pepper Bid</span>
              <span className="font-medium">{playerCount === 3 ? "9" : "7"}</span>
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStartGame}
            disabled={!canStart}
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
