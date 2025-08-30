import { useCallback, useEffect, useState } from "react";
import { referralService } from "../services/firebase/referrals";
import type {
  ReferralRedemption,
  ValidateReferralCodeResponse,
} from "../types/referral.types";
import { logger } from "../utils/logger";
import { useAuth } from "./useAuth";

export const useReferrals = () => {
  const { user } = useAuth();
  const [referralHistory, setReferralHistory] = useState<ReferralRedemption[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  // Get referral code and stats directly from user document
  const referralCode = user?.referralCode || null;
  const referralStats = user?.referralStats || null;

  // Debug user changes
  useEffect(() => {
    logger.debug("useReferrals - user changed", {
      hasUser: !!user,
      uid: user?.uid,
      hasReferralCode: !!user?.referralCode,
      referralCode: user?.referralCode,
      hasReferralStats: !!user?.referralStats,
      referralStats: user?.referralStats,
    });
  }, [user]);

  // Set up real-time listener for referral history (only if needed for detailed view)
  useEffect(() => {
    if (!user?.uid) return;

    // For now, we'll load history on demand rather than real-time
    // This saves resources and aligns with the cached stats approach
    setReferralHistory([]);
    setError(null);
  }, [user?.uid]);

  // Clear data when user logs out or email not verified
  useEffect(() => {
    if (!user?.uid || !user?.emailVerified) {
      setReferralHistory([]);
    }
  }, [user?.uid, user?.emailVerified]);

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

  // Load referral history on demand
  const loadReferralHistory = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const history = await referralService.getReferralHistory(10, user.uid);
      setReferralHistory(history);
    } catch (err) {
      logger.error("Error loading referral history", err);
      setError("Failed to load referral history");
    }
  }, [user?.uid]);

  // Refresh function for manual refresh
  const loadReferralData = useCallback(async () => {
    // Stats come from user document (cached)
    // History loaded on demand
    await loadReferralHistory();
  }, [loadReferralHistory]);

  return {
    // Data
    referralCode,
    referralStats,
    referralHistory,
    error,

    // Actions
    loadReferralData,
    loadReferralHistory,
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
