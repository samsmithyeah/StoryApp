import { useCallback, useEffect, useState } from "react";
import { referralService } from "../services/firebase/referrals";
import type {
  ReferralRedemption,
  ReferralStats,
  ValidateReferralCodeResponse,
} from "../types/referral.types";
import { logger } from "../utils/logger";
import { useAuth } from "./useAuth";

export const useReferrals = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(
    null
  );
  const [referralHistory, setReferralHistory] = useState<ReferralRedemption[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's referral code
  const loadReferralCode = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const code = await referralService.getUserReferralCode();
      setReferralCode(code);
    } catch (err) {
      logger.error("Error loading referral code", err);
      setError("Failed to load referral code");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Load referral stats
  const loadReferralStats = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const stats = await referralService.getReferralStats();
      setReferralStats(stats);
    } catch (err) {
      logger.error("Error loading referral stats", err);
    }
  }, [user?.uid]);

  // Load referral history
  const loadReferralHistory = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const history = await referralService.getReferralHistory();
      setReferralHistory(history);
    } catch (err) {
      logger.error("Error loading referral history", err);
    }
  }, [user?.uid]);

  // Load all referral data
  const loadReferralData = useCallback(async () => {
    await Promise.all([
      loadReferralCode(),
      loadReferralStats(),
      loadReferralHistory(),
    ]);
  }, [loadReferralCode, loadReferralStats, loadReferralHistory]);

  // Validate a referral code
  const validateReferralCode = useCallback(
    async (code: string): Promise<ValidateReferralCodeResponse> => {
      try {
        return await referralService.validateReferralCode(code);
      } catch (err) {
        logger.error("Error validating referral code", err);
        return {
          isValid: false,
          error: "Error validating referral code",
        };
      }
    },
    []
  );

  // Generate sharing text for referral code
  const generateShareText = useCallback(
    (code?: string) => {
      const codeToUse = code || referralCode;
      if (!codeToUse) return "";

      return `🌟 I've been creating magical bedtime stories with the DreamWeaver app and my kids absolutely love them! This AI-powered app creates personalised stories featuring your child as the hero. Each story is unique, beautifully illustrated, and perfectly tailored to your little one's interests and age.

Transform bedtime into an adventure! Use my referral code ${codeToUse} when you sign up to get free extra bonus credits for your first stories. Your kids will be asking for "just one more story" every night! ✨📚🌙

📱 Download DreamWeaver:
App Store: https://apps.apple.com/app/dreamweaver-bedtime-stories
Google Play: https://play.google.com/store/apps/details?id=com.dreamweaver.app`;
    },
    [referralCode]
  );

  // Generate sharing URL (placeholder - no deep linking set up yet)
  const generateShareURL = useCallback((_code?: string) => {
    // Deep linking not implemented yet
    return "";
  }, []);

  // Initialize data when user changes
  useEffect(() => {
    if (user?.uid && user?.emailVerified) {
      loadReferralData();
    } else {
      // Clear data when user logs out or email not verified
      setReferralCode(null);
      setReferralStats(null);
      setReferralHistory([]);
    }
  }, [user?.uid, user?.emailVerified, loadReferralData]);

  return {
    // Data
    referralCode,
    referralStats,
    referralHistory,
    loading,
    error,

    // Actions
    loadReferralData,
    validateReferralCode,
    generateShareText,
    generateShareURL,

    // Computed values
    hasReferralCode: !!referralCode,
    totalReferred: referralStats?.totalReferred || 0,
    creditsEarned: referralStats?.creditsEarned || 0,
    pendingReferrals: referralStats?.pendingReferrals || 0,
  };
};
