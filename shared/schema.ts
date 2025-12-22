import { z } from "zod";

// Trump suit options
export const trumpSuits = ["spades", "hearts", "diamonds", "clubs", "none"] as const;
export type TrumpSuit = typeof trumpSuits[number];

// Bid types
export const bidTypes = ["standard", "pepper", "pepperNo"] as const;
export type BidType = typeof bidTypes[number];

// Player schema
export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  score: z.number().default(0),
  isDealer: z.boolean().default(false),
});

export type Player = z.infer<typeof playerSchema>;
export type InsertPlayer = Omit<Player, "id" | "score" | "isDealer"> & { isDealer?: boolean };

// Round result schema
export const roundSchema = z.object({
  id: z.string(),
  roundNumber: z.number(),
  dealerId: z.string(),
  bidderId: z.string(),
  bidAmount: z.number(),
  bidType: z.enum(bidTypes),
  trumpSuit: z.enum(trumpSuits),
  tricksWon: z.number(),
  bidSuccess: z.boolean(),
  scoreChange: z.number(),
});

export type Round = z.infer<typeof roundSchema>;
export type InsertRound = Omit<Round, "id">;

// Game state schema
export const gameStateSchema = z.object({
  id: z.string(),
  playerCount: z.union([z.literal(3), z.literal(4)]),
  targetScore: z.number(),
  players: z.array(playerSchema),
  rounds: z.array(roundSchema),
  currentDealerIndex: z.number().default(0),
  gamePhase: z.enum(["setup", "bidding", "playing", "scoring", "complete"]),
  currentBid: z.object({
    bidderId: z.string().optional(),
    amount: z.number().optional(),
    type: z.enum(bidTypes).optional(),
    trumpSuit: z.enum(trumpSuits).optional(),
  }).optional(),
  winnerId: z.string().optional(),
});

export type GameState = z.infer<typeof gameStateSchema>;
export type InsertGameState = Omit<GameState, "id">;

// Helper functions
export function getMaxBid(playerCount: 3 | 4): number {
  return playerCount === 3 ? 8 : 6;
}

export function getPepperBid(playerCount: 3 | 4): number {
  return playerCount === 3 ? 9 : 7;
}

export function getTargetScore(playerCount: 3 | 4): number {
  return playerCount === 3 ? 32 : 25;
}

// Calculate score change for a round
export function calculateScoreChange(
  bidAmount: number,
  bidType: BidType,
  tricksWon: number,
  playerCount: 3 | 4
): { success: boolean; scoreChange: number } {
  const requiredTricks = bidType === "standard" ? bidAmount : getPepperBid(playerCount);
  const effectiveBid = bidType === "standard" ? bidAmount : getPepperBid(playerCount);
  
  const success = tricksWon >= requiredTricks;
  const scoreChange = success ? effectiveBid : -effectiveBid;
  
  return { success, scoreChange };
}

// Legacy User types for compatibility
export const users = {} as any;
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
