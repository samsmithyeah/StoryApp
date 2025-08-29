import { useCallback, useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "@react-native-firebase/firestore";
import { db } from "../services/firebase/config";
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
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(
    null
  );
  const [referralHistory, setReferralHistory] = useState<ReferralRedemption[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  // Get referral code directly from user document
  const referralCode = user?.referralCode || null;

  // Set up real-time listener for referral stats and history
  useEffect(() => {
    if (!user?.uid) return;

    logger.debug("Setting up real-time referral listeners", {
      userId: user.uid,
    });

    // Listen to referral redemptions for this user (as referrer)
    const redemptionsQuery = query(
      collection(db, "referralRedemptions"),
      where("referrerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      redemptionsQuery,
      (snapshot) => {
        const redemptions: ReferralRedemption[] = [];
        let totalCredits = 0;
        let pendingCount = 0;

        snapshot.forEach((doc: any) => {
          const data = doc.data();
          const redemption: ReferralRedemption = {
            id: doc.id,
            referralCodeId: data.referralCodeId,
            referralCode: data.referralCode,
            referrerId: data.referrerId,
            refereeId: data.refereeId,
            redeemedAt: data.redeemedAt?.toDate() || new Date(),
            referrerCreditsAwarded: data.referrerCreditsAwarded || 0,
            refereeCreditsAwarded: data.refereeCreditsAwarded || 0,
            status: data.status,
            completedAt: data.completedAt?.toDate(),
          };

          redemptions.push(redemption);

          if (redemption.status === "completed") {
            totalCredits += redemption.referrerCreditsAwarded;
          } else if (redemption.status === "pending") {
            pendingCount++;
          }
        });

        // Update stats based on real-time data
        const stats: ReferralStats = {
          totalReferred: redemptions.length,
          creditsEarned: totalCredits,
          pendingReferrals: pendingCount,
          lastReferralAt:
            redemptions.length > 0
              ? redemptions.sort(
                  (a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime()
                )[0].redeemedAt
              : undefined,
        };

        setReferralStats(stats);
        setReferralHistory(redemptions);

        logger.debug("Referral data updated via real-time listener", {
          totalReferred: stats.totalReferred,
          creditsEarned: stats.creditsEarned,
          pendingReferrals: stats.pendingReferrals,
        });
      },
      (error) => {
        logger.error("Error in referral stats listener", error);
        setError("Failed to load referral stats");
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // Clear data when user logs out or email not verified
  useEffect(() => {
    if (!user?.uid || !user?.emailVerified) {
      setReferralStats(null);
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

  // Refresh function for manual refresh (though real-time listeners make this less needed)
  const loadReferralData = useCallback(async () => {
    // Stats and history are automatically updated via real-time listeners
    // Referral code comes from user document, no need to reload
  }, []);

  return {
    // Data
    referralCode,
    referralStats,
    referralHistory,
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
