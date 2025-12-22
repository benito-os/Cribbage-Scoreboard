import { z } from "zod";

// Card suits
export const suits = ["spades", "hearts", "diamonds", "clubs"] as const;
export type Suit = typeof suits[number];

// Card ranks (A=1, 2-10, J=11, Q=12, K=13)
export const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type Rank = typeof ranks[number];

// Card representation
export const cardSchema = z.object({
  rank: z.enum(ranks),
  suit: z.enum(suits),
});
export type Card = z.infer<typeof cardSchema>;

// Score breakdown item - explains each scoring component
export const scoreBreakdownItemSchema = z.object({
  type: z.enum(["fifteen", "pair", "threeOfKind", "fourOfKind", "run", "flush", "nobs"]),
  points: z.number(),
  cards: z.array(cardSchema),
  description: z.string(),
});
export type ScoreBreakdownItem = z.infer<typeof scoreBreakdownItemSchema>;

// Full score breakdown
export const scoreBreakdownSchema = z.object({
  items: z.array(scoreBreakdownItemSchema),
  total: z.number(),
});
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;

// Player schema
export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  score: z.number().default(0),
  isDealer: z.boolean().default(false),
  profileId: z.string().optional(),
});

export type Player = z.infer<typeof playerSchema>;
export type InsertPlayer = Omit<Player, "id" | "score" | "isDealer"> & { isDealer?: boolean; profileId?: string };

// Score entry for a hand or crib
export const scoreEntrySchema = z.object({
  playerId: z.string(),
  points: z.number(),
  entryMode: z.enum(["manual", "calculated"]),
  cards: z.array(cardSchema).optional(),
  starterCard: cardSchema.optional(),
  breakdown: scoreBreakdownSchema.optional(),
  wasEdited: z.boolean().default(false),
});
export type ScoreEntry = z.infer<typeof scoreEntrySchema>;

// Hand result - a complete hand (deal) in cribbage
export const handResultSchema = z.object({
  id: z.string(),
  handNumber: z.number(),
  dealerId: z.string(),
  starterCard: cardSchema.optional(),
  peggingScores: z.record(z.string(), z.number()), // Points earned during play phase
  handScores: z.array(scoreEntrySchema), // Each player's hand score
  cribScore: scoreEntrySchema.optional(), // Dealer's crib score
  hisHeelsPoints: z.number().optional(), // 2 points if starter was a Jack
  scoreChanges: z.record(z.string(), z.number()), // Total score change per player this hand
});
export type HandResult = z.infer<typeof handResultSchema>;

// Game phases for Cribbage
export const gamePhases = ["setup", "pegging", "counting", "complete"] as const;
export type GamePhase = typeof gamePhases[number];

// Game state schema
export const gameStateSchema = z.object({
  id: z.string(),
  playerCount: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  targetScore: z.number().default(121),
  players: z.array(playerSchema),
  hands: z.array(handResultSchema),
  currentDealerIndex: z.number().default(0),
  gamePhase: z.enum(gamePhases),
  currentHand: z.object({
    starterCard: cardSchema.optional(),
    peggingScores: z.record(z.string(), z.number()).optional(),
    handScores: z.array(scoreEntrySchema).optional(),
    cribScore: scoreEntrySchema.optional(),
    hisHeelsAwarded: z.boolean().optional(),
    hisHeelsPoints: z.number().optional(),
  }).optional(),
  winnerId: z.string().optional(),
});

export type GameState = z.infer<typeof gameStateSchema>;
export type InsertGameState = Omit<GameState, "id">;

// Helper functions
export function getTargetScore(): number {
  return 121;
}

export function getCardValue(rank: Rank): number {
  if (rank === "A") return 1;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return parseInt(rank);
}

export function getRankOrder(rank: Rank): number {
  return ranks.indexOf(rank) + 1;
}

export function cardToString(card: Card): string {
  return `${card.rank}${card.suit[0].toUpperCase()}`;
}

export function cardsToString(cards: Card[]): string {
  return cards.map(cardToString).join(", ");
}

// Calculate all combinations of cards that sum to 15
function findFifteens(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  const values = cards.map(c => getCardValue(c.rank));
  
  // Check all subsets of cards
  for (let mask = 1; mask < (1 << cards.length); mask++) {
    let sum = 0;
    const subset: Card[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (mask & (1 << i)) {
        sum += values[i];
        subset.push(cards[i]);
      }
    }
    if (sum === 15) {
      results.push(subset);
    }
  }
  return results;
}

// Find all pairs (same rank)
function findPairs(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].rank === cards[j].rank) {
        results.push([cards[i], cards[j]]);
      }
    }
  }
  return results;
}

// Find all runs of 3 or more consecutive cards
function findRuns(cards: Card[]): Card[][] {
  const results: Card[][] = [];
  
  // Get unique ranks with their cards
  const rankCards: Map<number, Card[]> = new Map();
  for (const card of cards) {
    const order = getRankOrder(card.rank);
    if (!rankCards.has(order)) {
      rankCards.set(order, []);
    }
    rankCards.get(order)!.push(card);
  }
  
  // Find all consecutive sequences
  const sortedRanks = Array.from(rankCards.keys()).sort((a, b) => a - b);
  
  // Find runs and account for duplicates
  function findConsecutiveRuns(startIdx: number): { length: number; endIdx: number } {
    let length = 1;
    let idx = startIdx;
    while (idx < sortedRanks.length - 1 && sortedRanks[idx + 1] === sortedRanks[idx] + 1) {
      length++;
      idx++;
    }
    return { length, endIdx: idx };
  }
  
  // Generate all combinations of runs considering duplicates
  function generateRunCombinations(rankSequence: number[]): Card[][] {
    if (rankSequence.length < 3) return [];
    
    const cardOptions = rankSequence.map(rank => rankCards.get(rank)!);
    const combinations: Card[][] = [];
    
    function combine(index: number, current: Card[]) {
      if (index === cardOptions.length) {
        combinations.push([...current]);
        return;
      }
      for (const card of cardOptions[index]) {
        current.push(card);
        combine(index + 1, current);
        current.pop();
      }
    }
    
    combine(0, []);
    return combinations;
  }
  
  // Find all valid runs
  for (let i = 0; i < sortedRanks.length; i++) {
    const { length, endIdx } = findConsecutiveRuns(i);
    if (length >= 3) {
      const rankSequence = sortedRanks.slice(i, endIdx + 1);
      const runCombinations = generateRunCombinations(rankSequence);
      results.push(...runCombinations);
      i = endIdx; // Skip past this run
    }
  }
  
  return results;
}

// Check for flush (all same suit)
function findFlush(handCards: Card[], starterCard?: Card, isCrib: boolean = false): Card[] | null {
  if (handCards.length < 4) return null;
  
  const suit = handCards[0].suit;
  const allHandSameSuit = handCards.every(c => c.suit === suit);
  
  if (!allHandSameSuit) return null;
  
  // For crib, must include starter to count
  if (isCrib) {
    if (starterCard && starterCard.suit === suit) {
      return [...handCards, starterCard];
    }
    return null;
  }
  
  // For regular hand, 4-card flush counts, 5 if starter matches
  if (starterCard && starterCard.suit === suit) {
    return [...handCards, starterCard];
  }
  
  return handCards;
}

// Check for nobs (Jack in hand matching starter suit)
function findNobs(handCards: Card[], starterCard?: Card): Card | null {
  if (!starterCard) return null;
  
  for (const card of handCards) {
    if (card.rank === "J" && card.suit === starterCard.suit) {
      return card;
    }
  }
  return null;
}

// Calculate the score breakdown for a hand
export function calculateHandScore(
  handCards: Card[],
  starterCard?: Card,
  isCrib: boolean = false
): ScoreBreakdown {
  const items: ScoreBreakdownItem[] = [];
  const allCards = starterCard ? [...handCards, starterCard] : [...handCards];
  
  // Fifteens (2 points each)
  const fifteens = findFifteens(allCards);
  for (const cards of fifteens) {
    items.push({
      type: "fifteen",
      points: 2,
      cards,
      description: `Fifteen for 2 (${cardsToString(cards)})`,
    });
  }
  
  // Pairs, three of a kind, four of a kind
  const pairs = findPairs(allCards);
  
  // Group pairs by rank to detect three/four of a kind
  const pairsByRank: Map<Rank, Card[][]> = new Map();
  for (const pair of pairs) {
    const rank = pair[0].rank;
    if (!pairsByRank.has(rank)) {
      pairsByRank.set(rank, []);
    }
    pairsByRank.get(rank)!.push(pair);
  }
  
  pairsByRank.forEach((rankPairs, rank) => {
    if (rankPairs.length === 6) {
      // Four of a kind (6 pairs = 12 points)
      const uniqueCards = Array.from(new Set(rankPairs.flat()));
      items.push({
        type: "fourOfKind",
        points: 12,
        cards: uniqueCards,
        description: `Four ${rank}s for 12`,
      });
    } else if (rankPairs.length === 3) {
      // Three of a kind (3 pairs = 6 points)
      const uniqueCards = Array.from(new Set(rankPairs.flat()));
      items.push({
        type: "threeOfKind",
        points: 6,
        cards: uniqueCards,
        description: `Three ${rank}s for 6`,
      });
    } else {
      // Regular pairs (2 points each)
      for (const pair of rankPairs) {
        items.push({
          type: "pair",
          points: 2,
          cards: pair,
          description: `Pair of ${rank}s for 2`,
        });
      }
    }
  });
  
  // Runs (1 point per card)
  const runs = findRuns(allCards);
  for (const run of runs) {
    items.push({
      type: "run",
      points: run.length,
      cards: run,
      description: `Run of ${run.length} for ${run.length} (${cardsToString(run)})`,
    });
  }
  
  // Flush
  const flush = findFlush(handCards, starterCard, isCrib);
  if (flush) {
    items.push({
      type: "flush",
      points: flush.length,
      cards: flush,
      description: `Flush of ${flush.length} for ${flush.length}`,
    });
  }
  
  // Nobs
  const nobs = findNobs(handCards, starterCard);
  if (nobs) {
    items.push({
      type: "nobs",
      points: 1,
      cards: [nobs],
      description: `Nobs (Jack of ${starterCard!.suit}) for 1`,
    });
  }
  
  const total = items.reduce((sum, item) => sum + item.points, 0);
  
  return { items, total };
}

// Check for His Heels (Jack as starter = 2 points for dealer)
export function checkHisHeels(starterCard: Card): boolean {
  return starterCard.rank === "J";
}

// Calculate skunk status
export function getSkunkStatus(winnerScore: number, loserScore: number): "none" | "skunk" | "doubleSkunk" {
  if (loserScore < 61) return "doubleSkunk";
  if (loserScore < 91) return "skunk";
  return "none";
}

// Player Profile schema - persistent player identity with stats
export const playerProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  createdAt: z.string(),
  stats: z.object({
    gamesPlayed: z.number().default(0),
    gamesWon: z.number().default(0),
    totalHands: z.number().default(0),
    totalPoints: z.number().default(0),
    highestHandScore: z.number().default(0),
    skunksDealt: z.number().default(0),
    skunksReceived: z.number().default(0),
    perfectHands: z.number().default(0), // 29-point hands
  }).default({}),
});

export type PlayerProfile = z.infer<typeof playerProfileSchema>;
export type InsertPlayerProfile = Omit<PlayerProfile, "id" | "createdAt" | "stats">;

// Completed game record for history
export const completedGameSchema = z.object({
  id: z.string(),
  completedAt: z.string(),
  playerCount: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  targetScore: z.number(),
  players: z.array(z.object({
    profileId: z.string().optional(),
    name: z.string(),
    finalScore: z.number(),
  })),
  winnerId: z.string().optional(),
  winnerName: z.string(),
  totalHands: z.number(),
  skunkStatus: z.enum(["none", "skunk", "doubleSkunk"]).optional(),
  hands: z.array(handResultSchema),
});

export type CompletedGame = z.infer<typeof completedGameSchema>;

// Legacy User types for compatibility
export const users = {} as any;
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
