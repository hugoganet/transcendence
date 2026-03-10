export const AchievementType = {
  MODULE_COMPLETION: "MODULE_COMPLETION",
  TOKEN_THRESHOLD: "TOKEN_THRESHOLD",
  STREAK_TARGET: "STREAK_TARGET",
} as const;

export type AchievementType =
  (typeof AchievementType)[keyof typeof AchievementType];

export interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  type: AchievementType;
  threshold: number;
}

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  // MODULE_COMPLETION — threshold = category index (1-6)
  {
    code: "BLOCKCHAIN_BEGINNER",
    title: "Blockchain Beginner",
    description: "Complete Category 1: Blockchain Foundations",
    type: AchievementType.MODULE_COMPLETION,
    threshold: 1,
  },
  {
    code: "CRYPTO_CURIOUS",
    title: "Crypto Curious",
    description: "Complete Category 2: Crypto & Tokens",
    type: AchievementType.MODULE_COMPLETION,
    threshold: 2,
  },
  {
    code: "WALLET_WIZARD",
    title: "Wallet Wizard",
    description: "Complete Category 3: Wallets & Gas",
    type: AchievementType.MODULE_COMPLETION,
    threshold: 3,
  },
  {
    code: "SMART_COOKIE",
    title: "Smart Cookie",
    description: "Complete Category 4: Smart Contracts",
    type: AchievementType.MODULE_COMPLETION,
    threshold: 4,
  },
  {
    code: "NFT_NATIVE",
    title: "NFT Native",
    description: "Complete Category 5: NFTs & Digital Ownership",
    type: AchievementType.MODULE_COMPLETION,
    threshold: 5,
  },
  {
    code: "DEFI_EXPLORER",
    title: "DeFi Explorer",
    description: "Complete Category 6: DeFi & Beyond",
    type: AchievementType.MODULE_COMPLETION,
    threshold: 6,
  },

  // TOKEN_THRESHOLD — threshold = minimum tokenBalance
  {
    code: "FIRST_TOKENS",
    title: "First Tokens",
    description: "Earn 10 Knowledge Tokens",
    type: AchievementType.TOKEN_THRESHOLD,
    threshold: 10,
  },
  {
    code: "TOKEN_COLLECTOR",
    title: "Token Collector",
    description: "Earn 50 Knowledge Tokens",
    type: AchievementType.TOKEN_THRESHOLD,
    threshold: 50,
  },
  {
    code: "TOKEN_RICH",
    title: "Token Rich",
    description: "Earn 100 Knowledge Tokens",
    type: AchievementType.TOKEN_THRESHOLD,
    threshold: 100,
  },

  // STREAK_TARGET — threshold = minimum currentStreak
  {
    code: "GETTING_STARTED",
    title: "Getting Started",
    description: "Achieve a 3-day learning streak",
    type: AchievementType.STREAK_TARGET,
    threshold: 3,
  },
  {
    code: "WEEK_WARRIOR",
    title: "Week Warrior",
    description: "Achieve a 7-day learning streak",
    type: AchievementType.STREAK_TARGET,
    threshold: 7,
  },
  {
    code: "DEDICATED_LEARNER",
    title: "Dedicated Learner",
    description: "Achieve a 14-day learning streak",
    type: AchievementType.STREAK_TARGET,
    threshold: 14,
  },
  {
    code: "MONTHLY_MASTER",
    title: "Monthly Master",
    description: "Achieve a 30-day learning streak",
    type: AchievementType.STREAK_TARGET,
    threshold: 30,
  },
] as const;
