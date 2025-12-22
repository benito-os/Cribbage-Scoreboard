import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlayerProfiles } from "@/lib/playerProfilesContext";
import { ArrowLeft, Users, Merge, Trash2, Plus, Trophy, Target, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ManagePlayers() {
  const [, setLocation] = useLocation();
  const { profiles, createProfile, deleteProfile, mergeProfiles } = usePlayerProfiles();
  
  const [newPlayerName, setNewPlayerName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [mergeStep, setMergeStep] = useState<"idle" | "select-keep" | "select-merge" | "confirm" | "double-confirm">("idle");
  const [keepProfileId, setKeepProfileId] = useState<string | null>(null);
  const [mergeProfileId, setMergeProfileId] = useState<string | null>(null);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      createProfile(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteProfile(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleMergeConfirm = () => {
    if (keepProfileId && mergeProfileId) {
      mergeProfiles(keepProfileId, mergeProfileId);
      resetMerge();
    }
  };

  const resetMerge = () => {
    setMergeStep("idle");
    setKeepProfileId(null);
    setMergeProfileId(null);
  };

  const keepProfile = profiles.find(p => p.id === keepProfileId);
  const mergeProfile = profiles.find(p => p.id === mergeProfileId);
  const deleteProfileData = profiles.find(p => p.id === deleteConfirmId);

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Players</h1>
            <p className="text-sm text-muted-foreground">
              {profiles.length} player{profiles.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add new player..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
                data-testid="input-new-player"
              />
              <Button onClick={handleAddPlayer} disabled={!newPlayerName.trim()} data-testid="button-add-player">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {profiles.length >= 2 && mergeStep === "idle" && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setMergeStep("select-keep")}
              data-testid="button-start-merge"
            >
              <Merge className="h-4 w-4" />
              Merge Duplicate Players
            </Button>
          )}

          {mergeStep !== "idle" && (
            <Card className="p-4 border-amber-500/50">
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {mergeStep === "select-keep" && "Step 1: Select the player to KEEP"}
                  {mergeStep === "select-merge" && "Step 2: Select the player to MERGE INTO the first"}
                  {mergeStep === "confirm" && "Confirm merge"}
                </p>
                
                {(mergeStep === "select-keep" || mergeStep === "select-merge") && (
                  <Select
                    value={mergeStep === "select-keep" ? keepProfileId ?? "" : mergeProfileId ?? ""}
                    onValueChange={(value) => {
                      if (mergeStep === "select-keep") {
                        setKeepProfileId(value);
                        setMergeStep("select-merge");
                      } else {
                        setMergeProfileId(value);
                        setMergeStep("confirm");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a player..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles
                        .filter(p => mergeStep === "select-keep" || p.id !== keepProfileId)
                        .map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}

                {mergeStep === "confirm" && keepProfile && mergeProfile && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                    <p>
                      <strong>{mergeProfile.name}</strong> will be merged into <strong>{keepProfile.name}</strong>
                    </p>
                    <p className="text-muted-foreground">
                      Stats will be combined. {mergeProfile.name} will be deleted.
                    </p>
                  </div>
                )}

                {mergeStep === "double-confirm" && keepProfile && mergeProfile && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm space-y-2">
                    <p className="font-semibold text-destructive">
                      Are you absolutely sure?
                    </p>
                    <p>
                      This will permanently delete <strong>{mergeProfile.name}</strong> and merge their stats into <strong>{keepProfile.name}</strong>.
                    </p>
                    <p className="text-destructive font-medium">
                      This action cannot be undone.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetMerge} className="flex-1">
                    Cancel
                  </Button>
                  {mergeStep === "confirm" && (
                    <Button 
                      variant="secondary" 
                      onClick={() => setMergeStep("double-confirm")}
                      className="flex-1"
                      data-testid="button-first-confirm-merge"
                    >
                      Continue
                    </Button>
                  )}
                  {mergeStep === "double-confirm" && (
                    <Button 
                      variant="destructive" 
                      onClick={handleMergeConfirm}
                      className="flex-1"
                      data-testid="button-confirm-merge"
                    >
                      Yes, Merge Players
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {profiles.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No players yet. Add players above or they'll be created automatically when you start a game.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {profiles.map(profile => {
                const winRate = profile.stats?.gamesPlayed 
                  ? Math.round((profile.stats.gamesWon / profile.stats.gamesPlayed) * 100)
                  : 0;
                const avgHandScore = profile.stats?.totalHands 
                  ? (profile.stats.totalPoints / profile.stats.totalHands).toFixed(1)
                  : "0";

                return (
                  <Card key={profile.id} className="p-4" data-testid={`card-player-${profile.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{profile.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="gap-1">
                            <Trophy className="h-3 w-3" />
                            {profile.stats?.gamesWon ?? 0} wins
                          </Badge>
                          <Badge variant="outline">
                            {profile.stats?.gamesPlayed ?? 0} games
                          </Badge>
                          {(profile.stats?.gamesPlayed ?? 0) > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Target className="h-3 w-3" />
                              {winRate}% win rate
                            </Badge>
                          )}
                        </div>
                        {(profile.stats?.totalHands ?? 0) > 0 && (
                          <div className="text-xs text-muted-foreground mt-2 space-x-3">
                            <span>{profile.stats?.totalHands} hands</span>
                            <span>Avg: {avgHandScore} pts/hand</span>
                            {(profile.stats?.highestHandScore ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="h-3 w-3" />
                                Best: {profile.stats?.highestHandScore}
                              </span>
                            )}
                            {(profile.stats?.perfectHands ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Zap className="h-3 w-3 text-amber-500" />
                                {profile.stats?.perfectHands} perfect 29s
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(profile.id)}
                        className="text-muted-foreground hover:text-destructive"
                        data-testid={`button-delete-${profile.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteProfileData?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this player and all their statistics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
