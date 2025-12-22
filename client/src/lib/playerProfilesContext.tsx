import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { PlayerProfile, CompletedGame } from "@shared/schema";

const PROFILES_STORAGE_KEY = "pepper-player-profiles";
const HISTORY_STORAGE_KEY = "pepper-game-history";

interface PlayerProfilesContextType {
  profiles: PlayerProfile[];
  gameHistory: CompletedGame[];
  createProfile: (name: string) => PlayerProfile;
  updateProfile: (id: string, updates: Partial<PlayerProfile>) => void;
  deleteProfile: (id: string) => void;
  mergeProfiles: (keepId: string, mergeId: string) => void;
  getProfileByName: (name: string) => PlayerProfile | undefined;
  getOrCreateProfile: (name: string) => PlayerProfile;
  addCompletedGame: (game: Omit<CompletedGame, "id" | "completedAt">) => void;
  updatePlayerStats: (profileId: string, roundData: {
    won: boolean;
    wasBidder: boolean;
    bidSuccess?: boolean;
    wasPepper?: boolean;
    tricksWon: number;
  }) => void;
  recordGameEnd: (profileId: string, won: boolean) => void;
}

const PlayerProfilesContext = createContext<PlayerProfilesContextType | null>(null);

export function usePlayerProfiles() {
  const context = useContext(PlayerProfilesContext);
  if (!context) {
    throw new Error("usePlayerProfiles must be used within a PlayerProfilesProvider");
  }
  return context;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function PlayerProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<PlayerProfile[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [gameHistory, setGameHistory] = useState<CompletedGame[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(gameHistory));
  }, [gameHistory]);

  const createProfile = useCallback((name: string): PlayerProfile => {
    const newProfile: PlayerProfile = {
      id: generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalRounds: 0,
        bidsWon: 0,
        bidsLost: 0,
        pepperAttempts: 0,
        pepperSuccesses: 0,
        totalTricksWon: 0,
      },
    };
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  }, []);

  const updateProfile = useCallback((id: string, updates: Partial<PlayerProfile>) => {
    setProfiles(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  }, []);

  const mergeProfiles = useCallback((keepId: string, mergeId: string) => {
    setProfiles(prev => {
      const keepProfile = prev.find(p => p.id === keepId);
      const mergeProfile = prev.find(p => p.id === mergeId);
      
      if (!keepProfile || !mergeProfile) return prev;

      const mergedStats = {
        gamesPlayed: (keepProfile.stats?.gamesPlayed ?? 0) + (mergeProfile.stats?.gamesPlayed ?? 0),
        gamesWon: (keepProfile.stats?.gamesWon ?? 0) + (mergeProfile.stats?.gamesWon ?? 0),
        totalRounds: (keepProfile.stats?.totalRounds ?? 0) + (mergeProfile.stats?.totalRounds ?? 0),
        bidsWon: (keepProfile.stats?.bidsWon ?? 0) + (mergeProfile.stats?.bidsWon ?? 0),
        bidsLost: (keepProfile.stats?.bidsLost ?? 0) + (mergeProfile.stats?.bidsLost ?? 0),
        pepperAttempts: (keepProfile.stats?.pepperAttempts ?? 0) + (mergeProfile.stats?.pepperAttempts ?? 0),
        pepperSuccesses: (keepProfile.stats?.pepperSuccesses ?? 0) + (mergeProfile.stats?.pepperSuccesses ?? 0),
        totalTricksWon: (keepProfile.stats?.totalTricksWon ?? 0) + (mergeProfile.stats?.totalTricksWon ?? 0),
      };

      return prev
        .filter(p => p.id !== mergeId)
        .map(p => p.id === keepId ? { ...p, stats: mergedStats } : p);
    });
  }, []);

  const getProfileByName = useCallback((name: string): PlayerProfile | undefined => {
    const normalizedName = name.trim().toLowerCase();
    return profiles.find(p => p.name.toLowerCase() === normalizedName);
  }, [profiles]);

  const getOrCreateProfile = useCallback((name: string): PlayerProfile => {
    const existing = getProfileByName(name);
    if (existing) return existing;
    return createProfile(name);
  }, [getProfileByName, createProfile]);

  const addCompletedGame = useCallback((game: Omit<CompletedGame, "id" | "completedAt">) => {
    const completedGame: CompletedGame = {
      ...game,
      id: generateId(),
      completedAt: new Date().toISOString(),
    };
    setGameHistory(prev => [...prev, completedGame]);
  }, []);

  const updatePlayerStats = useCallback((profileId: string, roundData: {
    won: boolean;
    wasBidder: boolean;
    bidSuccess?: boolean;
    wasPepper?: boolean;
    tricksWon: number;
  }) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      
      const stats = p.stats ?? {
        gamesPlayed: 0,
        gamesWon: 0,
        totalRounds: 0,
        bidsWon: 0,
        bidsLost: 0,
        pepperAttempts: 0,
        pepperSuccesses: 0,
        totalTricksWon: 0,
      };

      return {
        ...p,
        stats: {
          ...stats,
          totalRounds: stats.totalRounds + 1,
          totalTricksWon: stats.totalTricksWon + roundData.tricksWon,
          bidsWon: stats.bidsWon + (roundData.wasBidder && roundData.bidSuccess ? 1 : 0),
          bidsLost: stats.bidsLost + (roundData.wasBidder && !roundData.bidSuccess ? 1 : 0),
          pepperAttempts: stats.pepperAttempts + (roundData.wasPepper ? 1 : 0),
          pepperSuccesses: stats.pepperSuccesses + (roundData.wasPepper && roundData.bidSuccess ? 1 : 0),
        },
      };
    }));
  }, []);

  const recordGameEnd = useCallback((profileId: string, won: boolean) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      
      const stats = p.stats ?? {
        gamesPlayed: 0,
        gamesWon: 0,
        totalRounds: 0,
        bidsWon: 0,
        bidsLost: 0,
        pepperAttempts: 0,
        pepperSuccesses: 0,
        totalTricksWon: 0,
      };

      return {
        ...p,
        stats: {
          ...stats,
          gamesPlayed: stats.gamesPlayed + 1,
          gamesWon: stats.gamesWon + (won ? 1 : 0),
        },
      };
    }));
  }, []);

  return (
    <PlayerProfilesContext.Provider
      value={{
        profiles,
        gameHistory,
        createProfile,
        updateProfile,
        deleteProfile,
        mergeProfiles,
        getProfileByName,
        getOrCreateProfile,
        addCompletedGame,
        updatePlayerStats,
        recordGameEnd,
      }}
    >
      {children}
    </PlayerProfilesContext.Provider>
  );
}
