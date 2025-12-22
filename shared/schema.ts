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

// Player tricks for a round - maps playerId to tricks won
export const playerTricksSchema = z.record(z.string(), z.number());
export type PlayerTricks = z.infer<typeof playerTricksSchema>;

// Score changes for a round - maps playerId to score change
export const scoreChangesSchema = z.record(z.string(), z.number());
export type ScoreChanges = z.infer<typeof scoreChangesSchema>;

// Round result schema
export const roundSchema = z.object({
  id: z.string(),
  roundNumber: z.number(),
  dealerId: z.string(),
  bidderId: z.string(),
  bidAmount: z.number(),
  bidType: z.enum(bidTypes),
  trumpSuit: z.enum(trumpSuits),
  playerTricks: playerTricksSchema, // Tricks won by each player
  bidSuccess: z.boolean(),
  scoreChanges: scoreChangesSchema, // Score change for each player
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

export function getMaxTricks(playerCount: 3 | 4): number {
  return playerCount === 3 ? 8 : 6;
}

export function getTargetScore(playerCount: 3 | 4): number {
  return playerCount === 3 ? 32 : 25;
}

// Calculate score changes for all players in a round
// Bidder: +bid if successful, -bid if failed
// Defenders: +1 per trick won
// Note: For Pepper bids, player must take ALL tricks (6 or 8) to succeed
// The bid VALUE is higher (7 or 9) but required tricks = max tricks
export function calculateAllScoreChanges(
  bidderId: string,
  bidAmount: number,
  bidType: BidType,
  playerTricks: PlayerTricks,
  playerCount: 3 | 4
): { success: boolean; scoreChanges: ScoreChanges } {
  // For Pepper bids, must take ALL tricks (maxTricks), not getPepperBid
  // The bid value (7 or 9) is the scoring amount, not the trick requirement
  const requiredTricks = bidType === "standard" ? bidAmount : getMaxTricks(playerCount);
  const effectiveBid = bidType === "standard" ? bidAmount : getPepperBid(playerCount);
  
  const bidderTricks = playerTricks[bidderId] ?? 0;
  const success = bidderTricks >= requiredTricks;
  
  const scoreChanges: ScoreChanges = {};
  
  for (const [playerId, tricks] of Object.entries(playerTricks)) {
    if (playerId === bidderId) {
      // Bidder gets +/- bid amount
      scoreChanges[playerId] = success ? effectiveBid : -effectiveBid;
    } else {
      // Defenders get +1 per trick
      scoreChanges[playerId] = tricks;
    }
  }
  
  return { success, scoreChanges };
}

// Legacy function for backward compatibility
export function calculateScoreChange(
  bidAmount: number,
  bidType: BidType,
  tricksWon: number,
  playerCount: 3 | 4
): { success: boolean; scoreChange: number } {
  // For Pepper bids, must take ALL tricks (maxTricks)
  const requiredTricks = bidType === "standard" ? bidAmount : getMaxTricks(playerCount);
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
