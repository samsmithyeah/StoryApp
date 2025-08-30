import { httpsCallable } from "@react-native-firebase/functions";
import type {
  ReferralRedemption,
  ReferralStats,
  ValidateReferralCodeResponse,
} from "../../types/referral.types";
import { logger } from "../../utils/logger";
import {
  CacheKeys,
  referralCache,
} from "../../functions/src/cache/referralCache";
import { functionsService } from "./config";

/**
 * Safely convert Firestore timestamp to Date object
 */
const safeTimestampToDate = (timestamp: any): Date | undefined => {
  if (!timestamp) {
    return undefined;
  }

  // Check if it's a Firestore Timestamp with toDate method
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    try {
      return timestamp.toDate();
    } catch (error) {
      logger.warn("Failed to convert Firestore timestamp", error);
      return undefined;
    }
  }

  // Handle raw Firestore timestamp format with _seconds and _nanoseconds
  if (
    timestamp._seconds !== undefined &&
    timestamp._nanoseconds !== undefined
  ) {
    try {
      // Convert Firestore timestamp to JavaScript Date
      const date = new Date(
        timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000
      );
      return date;
    } catch (error) {
      logger.warn("Failed to convert raw Firestore timestamp", error);
      return undefined;
    }
  }

  // Check if it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // Check if it's a valid date string or number
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Log warning for unrecognized timestamp format
  logger.warn("Unrecognized timestamp format", {
    timestamp,
    type: typeof timestamp,
  });
  return undefined;
};

export const referralService = {
  /**
   * Get user's referral code, creating one if it doesn't exist
   */
  async getUserReferralCode(): Promise<string> {
    try {
      const getUserReferralCodeFunction = httpsCallable(
        functionsService,
        "getUserReferralCode"
      );

      const result = await getUserReferralCodeFunction({});
      const referralCode = (result.data as { referralCode: string })
        .referralCode;

      // Refresh auth store to ensure UI picks up the new referral code
      const { useAuthStore } = await import("../../store/authStore");

      try {
        await useAuthStore.getState().refreshUserData();
        logger.debug("Auth store refreshed after referral code generation");
      } catch (refreshError) {
        logger.warn(
          "Failed to refresh auth store after referral code generation",
          refreshError
        );
      }

      return referralCode;
    } catch (error) {
      logger.error("Error getting user referral code", error);
      throw error;
    }
  },

  /**
   * Validate a referral code
   */
  async validateReferralCode(
    code: string
  ): Promise<ValidateReferralCodeResponse> {
    try {
      const validateReferralCodeFunction = httpsCallable(
        functionsService,
        "validateReferralCode"
      );

      const result = await validateReferralCodeFunction({ code });
      return result.data as ValidateReferralCodeResponse;
    } catch (error) {
      logger.error("Error validating referral code", error);
      return {
        isValid: false,
        error: "Error validating referral code",
      };
    }
  },

  /**
   * Record a referral relationship during signup
   */
  async recordReferral(refereeId: string, referralCode: string): Promise<void> {
    try {
      const recordReferralFunction = httpsCallable(
        functionsService,
        "recordReferral"
      );

      await recordReferralFunction({ referralCode });

      // Invalidate caches that might be affected
      referralCache.delete(CacheKeys.referralStats("current_user"));
      referralCache.delete(CacheKeys.referralHistory("current_user", 10));

      logger.debug("Referral recorded successfully", {
        refereeId,
        referralCode,
      });
    } catch (error) {
      logger.error("Error recording referral", error);
      throw error;
    }
  },

  /**
   * Complete a referral and award credits when referee verifies email
   */
  async completeReferral(refereeId: string): Promise<void> {
    try {
      const completeReferralFunction = httpsCallable(
        functionsService,
        "completeReferral"
      );

      const result = await completeReferralFunction({ userId: refereeId });

      if ((result.data as { success: boolean }).success) {
        // Invalidate caches for both referrer and referee
        referralCache.delete(CacheKeys.referralStats("current_user"));
        referralCache.delete(CacheKeys.referralHistory("current_user", 10));

        logger.debug("Referral completed successfully", { refereeId });
      } else {
        logger.debug("No pending referral found", { refereeId });
      }
    } catch (error) {
      logger.error("Error completing referral", error);
      throw error;
    }
  },

  /**
   * Get referral stats for a user (cached)
   */
  async getReferralStats(userId?: string): Promise<ReferralStats> {
    try {
      // Use provided userId or get from auth context
      const cacheKey = CacheKeys.referralStats(userId || "current_user");

      // Check cache first
      const cachedStats = referralCache.get<ReferralStats>(cacheKey);
      if (cachedStats) {
        logger.debug("Returning cached referral stats", { userId });
        return cachedStats;
      }

      const getReferralStatsFunction = httpsCallable(
        functionsService,
        "getReferralStats"
      );

      const result = await getReferralStatsFunction({});
      const stats = (result.data as { stats: ReferralStats }).stats;

      // Cache the result for 2 minutes
      referralCache.set(cacheKey, stats, 2 * 60 * 1000);

      return stats;
    } catch (error) {
      logger.error("Error getting referral stats", error);
      return {
        totalReferred: 0,
        creditsEarned: 0,
        pendingReferrals: 0,
      };
    }
  },

  /**
   * Get referral history for a user (cached)
   */
  async getReferralHistory(
    limitCount: number = 10,
    userId?: string
  ): Promise<ReferralRedemption[]> {
    try {
      const cacheKey = CacheKeys.referralHistory(
        userId || "current_user",
        limitCount
      );

      // Check cache first
      const cachedHistory = referralCache.get<ReferralRedemption[]>(cacheKey);
      if (cachedHistory) {
        logger.debug("Returning cached referral history", {
          userId,
          limitCount,
        });
        return cachedHistory;
      }

      const getReferralHistoryFunction = httpsCallable(
        functionsService,
        "getReferralHistory"
      );

      const result = await getReferralHistoryFunction({ limit: limitCount });
      const history = (result.data as { history: any[] }).history;

      // Convert Firestore timestamps to Date objects safely
      const processedHistory = history.map((item: any) => ({
        ...item,
        redeemedAt: safeTimestampToDate(item.redeemedAt) || new Date(),
        completedAt: safeTimestampToDate(item.completedAt),
      })) as ReferralRedemption[];

      // Cache the result for 1 minute
      referralCache.set(cacheKey, processedHistory, 1 * 60 * 1000);

      return processedHistory;
    } catch (error) {
      logger.error("Error getting referral history", error);
      return [];
    }
  },

  /**
   * Check if user was referred by someone
   */
  async getUserReferredBy(userId: string): Promise<string | null> {
    // This data is stored in the user document, so we can read it directly
    // The security rules allow users to read their own data
    try {
      const { getFirestore, doc, getDoc } = await import(
        "@react-native-firebase/firestore"
      );
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();

      return userData?.referredBy || null;
    } catch (error) {
      logger.error("Error getting user referral info", error);
      return null;
    }
  },
};
