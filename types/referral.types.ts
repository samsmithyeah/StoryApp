// Import shared configuration
import { REFERRAL_CONFIG } from "../functions/src/constants/ReferralConfig";

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
  ownerId?: string;
  error?: string;
}

export interface ReferralReward {
  referrerCredits: number;
  refereeCredits: number;
}

export { REFERRAL_CONFIG };

// Default rewards configuration (derived from shared config)
export const REFERRAL_REWARDS: ReferralReward = {
  referrerCredits: REFERRAL_CONFIG.REFERRER_CREDITS,
  refereeCredits: REFERRAL_CONFIG.REFEREE_CREDITS,
} as const;
