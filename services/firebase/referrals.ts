import { httpsCallable } from "@react-native-firebase/functions";
import { logger } from "../../utils/logger";
import type {
  ReferralRedemption,
  ReferralStats,
  ValidateReferralCodeResponse,
} from "../../types/referral.types";
import { functionsService } from "./config";

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
      return (result.data as { referralCode: string }).referralCode;
    } catch (error) {
      logger.error("Error getting user referral code", error);
      throw error;
    }
  },

  /**
   * Validate a referral code
   */
  async validateReferralCode(code: string): Promise<ValidateReferralCodeResponse> {
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
   * Get referral stats for a user
   */
  async getReferralStats(): Promise<ReferralStats> {
    try {
      const getReferralStatsFunction = httpsCallable(
        functionsService,
        "getReferralStats"
      );

      const result = await getReferralStatsFunction({});
      return (result.data as { stats: ReferralStats }).stats;
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
   * Get referral history for a user
   */
  async getReferralHistory(limitCount: number = 10): Promise<ReferralRedemption[]> {
    try {
      const getReferralHistoryFunction = httpsCallable(
        functionsService,
        "getReferralHistory"
      );

      const result = await getReferralHistoryFunction({ limit: limitCount });
      const history = (result.data as { history: any[] }).history;

      // Convert Firestore timestamps to Date objects
      return history.map((item: any) => ({
        ...item,
        redeemedAt: item.redeemedAt?.toDate ? item.redeemedAt.toDate() : new Date(item.redeemedAt),
        completedAt: item.completedAt?.toDate ? item.completedAt.toDate() : item.completedAt ? new Date(item.completedAt) : undefined,
      })) as ReferralRedemption[];
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
      const { getFirestore, doc, getDoc } = await import("@react-native-firebase/firestore");
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