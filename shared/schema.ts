import { z } from "zod";

// Trump suit options
export const trumpSuits = ["spades", "hearts", "diamonds", "clubs", "none"] as const;
export type TrumpSuit = typeof trumpSuits[number];

// Bid types (pepperNo removed - any bid can be no trump now)
export const bidTypes = ["standard", "pepper"] as const;
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

// Player participation status - maps playerId to play/fold
export const playerParticipationSchema = z.record(z.string(), z.enum(["play", "fold"]));
export type PlayerParticipation = z.infer<typeof playerParticipationSchema>;

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
  playerParticipation: playerParticipationSchema.optional(), // play/fold status for each player
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
// Helpers (play with bidder): +1 per trick, OR -bid if 0 tricks
// Folders: 0 points (neutral, sat out)
// No Trump special rule: All players must participate - folding not allowed
export function calculateAllScoreChanges(
  bidderId: string,
  bidAmount: number,
  bidType: BidType,
  playerTricks: PlayerTricks,
  playerCount: 3 | 4,
  trumpSuit?: TrumpSuit,
  playerParticipation?: PlayerParticipation
): { success: boolean; scoreChanges: ScoreChanges } {
  // For Pepper bids, must take ALL tricks (maxTricks), not getPepperBid
  // The bid value (7 or 9) is the scoring amount, not the trick requirement
  const requiredTricks = bidType === "standard" ? bidAmount : getMaxTricks(playerCount);
  const effectiveBid = bidType === "standard" ? bidAmount : getPepperBid(playerCount);
  
  const bidderTricks = playerTricks[bidderId] ?? 0;
  const success = bidderTricks >= requiredTricks;
  
  const isNoTrump = trumpSuit === "none";
  
  const scoreChanges: ScoreChanges = {};
  
  // Legacy data check: if no participation data provided, use old scoring rules
  // (no fold penalty system - just +1 per trick for defenders)
  const hasParticipationData = playerParticipation && Object.keys(playerParticipation).length > 0;
  
  for (const [playerId, tricks] of Object.entries(playerTricks)) {
    if (playerId === bidderId) {
      // Bidder always gets +/- bid amount
      scoreChanges[playerId] = success ? effectiveBid : -effectiveBid;
    } else {
      // Check participation status
      const participation = playerParticipation?.[playerId] ?? "play";
      
      if (participation === "fold") {
        // Folded players get 0 points (neutral)
        scoreChanges[playerId] = 0;
      } else if (isNoTrump && tricks === 0) {
        // No Trump: 0 tricks = lose bid value (everyone must participate)
        scoreChanges[playerId] = -effectiveBid;
      } else if (!isNoTrump && tricks === 0 && hasParticipationData) {
        // With Trump + new rules: participating players with 0 tricks = lose bid value
        // Only apply this penalty when participation data is explicitly provided
        scoreChanges[playerId] = -effectiveBid;
      } else {
        // Normal: +1 per trick (or legacy mode without participation data)
        scoreChanges[playerId] = tricks;
      }
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
