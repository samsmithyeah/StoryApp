// Import shared configuration
import { REFERRAL_CONFIG } from "../functions/src/constants/ReferralConfig";

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

export interface ValidateReferralCodeResponse {
  isValid: boolean;
  ownerId?: string;
  error?: string;
}

export { REFERRAL_CONFIG };
