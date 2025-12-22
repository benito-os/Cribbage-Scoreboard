import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { PlayerProfile, CompletedGame } from "@shared/schema";

const PROFILES_STORAGE_KEY = "cribbage-player-profiles";
const HISTORY_STORAGE_KEY = "cribbage-game-history";

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
  updatePlayerStats: (profileId: string, handData: {
    handScore: number;
    wasDealer: boolean;
  }) => void;
  recordGameEnd: (profileId: string, won: boolean, wasSkunk?: boolean, wasDoubleSkunk?: boolean) => void;
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
        totalHands: 0,
        totalPoints: 0,
        highestHandScore: 0,
        skunksDealt: 0,
        skunksReceived: 0,
        perfectHands: 0,
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
        totalHands: (keepProfile.stats?.totalHands ?? 0) + (mergeProfile.stats?.totalHands ?? 0),
        totalPoints: (keepProfile.stats?.totalPoints ?? 0) + (mergeProfile.stats?.totalPoints ?? 0),
        highestHandScore: Math.max(
          keepProfile.stats?.highestHandScore ?? 0,
          mergeProfile.stats?.highestHandScore ?? 0
        ),
        skunksDealt: (keepProfile.stats?.skunksDealt ?? 0) + (mergeProfile.stats?.skunksDealt ?? 0),
        skunksReceived: (keepProfile.stats?.skunksReceived ?? 0) + (mergeProfile.stats?.skunksReceived ?? 0),
        perfectHands: (keepProfile.stats?.perfectHands ?? 0) + (mergeProfile.stats?.perfectHands ?? 0),
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

  const updatePlayerStats = useCallback((profileId: string, handData: {
    handScore: number;
    wasDealer: boolean;
  }) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      
      const stats = p.stats ?? {
        gamesPlayed: 0,
        gamesWon: 0,
        totalHands: 0,
        totalPoints: 0,
        highestHandScore: 0,
        skunksDealt: 0,
        skunksReceived: 0,
        perfectHands: 0,
      };

      return {
        ...p,
        stats: {
          ...stats,
          totalHands: stats.totalHands + 1,
          totalPoints: stats.totalPoints + handData.handScore,
          highestHandScore: Math.max(stats.highestHandScore, handData.handScore),
          perfectHands: stats.perfectHands + (handData.handScore === 29 ? 1 : 0),
        },
      };
    }));
  }, []);

  const recordGameEnd = useCallback((profileId: string, won: boolean, wasSkunk?: boolean, wasDoubleSkunk?: boolean) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      
      const stats = p.stats ?? {
        gamesPlayed: 0,
        gamesWon: 0,
        totalHands: 0,
        totalPoints: 0,
        highestHandScore: 0,
        skunksDealt: 0,
        skunksReceived: 0,
        perfectHands: 0,
      };

      return {
        ...p,
        stats: {
          ...stats,
          gamesPlayed: stats.gamesPlayed + 1,
          gamesWon: stats.gamesWon + (won ? 1 : 0),
          skunksDealt: stats.skunksDealt + (won && (wasSkunk || wasDoubleSkunk) ? 1 : 0),
          skunksReceived: stats.skunksReceived + (!won && (wasSkunk || wasDoubleSkunk) ? 1 : 0),
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
