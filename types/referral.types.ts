export interface ReferralCode {
  id: string; // Auto-generated unique code (8-10 chars)
  ownerId: string; // User who owns this code
  createdAt: Date;
  isActive: boolean;
  usageLimit?: number; // Optional usage limit
  timesUsed: number;
  expiresAt?: Date; // Optional expiration
}

export interface ReferralRedemption {
  id: string;
  referralCodeId: string;
  referralCode: string; // For easy querying
  referrerId: string; // User who referred
  refereeId: string; // User who was referred
  redeemedAt: Date;
  referrerCreditsAwarded: number;
  refereeCreditsAwarded: number;
  status: "pending" | "completed" | "cancelled";
  completedAt?: Date; // When referee completed verification
}

export interface ReferralStats {
  totalReferred: number;
  creditsEarned: number;
  pendingReferrals: number;
  lastReferralAt?: Date;
}

export interface CreateReferralCodeRequest {
  ownerId: string;
  usageLimit?: number;
  expiresAt?: Date;
}

export interface ValidateReferralCodeResponse {
  isValid: boolean;
  code?: ReferralCode;
  error?: string;
}

export interface ReferralReward {
  referrerCredits: number;
  refereeCredits: number;
}

// Default rewards configuration
export const REFERRAL_REWARDS: ReferralReward = {
  referrerCredits: 10,
  refereeCredits: 5,
} as const;

// Referral code configuration
// Note: Main config is in functions/src/referrals.ts - this is a client-side subset
export const REFERRAL_CONFIG = {
  CODE_LENGTH: 5, // Keep in sync with server - all random chars
  MAX_USAGE_PER_CODE: 1000, // Keep in sync with server
  DEFAULT_EXPIRY_DAYS: 365,
} as const;
