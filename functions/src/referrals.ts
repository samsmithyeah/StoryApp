import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import { sendReferralNotification } from "./sendReferralNotification";

const db = admin.firestore();

// Referral configuration
const REFERRAL_CONFIG = {
  CODE_LENGTH: 8,
  CODE_PREFIX: "STORY",
  MAX_USAGE_PER_CODE: 1000,
  REFERRER_CREDITS: 10,
  REFEREE_CREDITS: 5,
};

interface CreateReferralCodeRequest {
  // No parameters needed - uses authenticated user ID
}

interface ValidateReferralCodeRequest {
  code: string;
}

interface RecordReferralRequest {
  referralCode: string;
}

/**
 * Generate a unique referral code
 */
function generateUniqueCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = REFERRAL_CONFIG.CODE_PREFIX;
  
  for (let i = 0; i < REFERRAL_CONFIG.CODE_LENGTH - REFERRAL_CONFIG.CODE_PREFIX.length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Create or get user's referral code
 */
export const getUserReferralCode = onCall<CreateReferralCodeRequest>(
  {
    region: "us-central1",
  },
  async (request) => {
    try {
      const { auth } = request;

      if (!auth?.uid) {
        throw new Error("Authentication required");
      }

      const userId = auth.uid;

      // Check if user already has a code
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (userData?.referralCode) {
        // Verify the code still exists and is valid
        const codeDoc = await db.collection("referralCodes").doc(userData.referralCode).get();
        if (codeDoc.exists && codeDoc.data()?.isActive) {
          return { referralCode: userData.referralCode };
        }
      }

      // Create new referral code
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        const code = generateUniqueCode();
        
        // Check if code already exists
        const existingDoc = await db.collection("referralCodes").doc(code).get();
        
        if (!existingDoc.exists) {
          // Create the referral code document
          await db.collection("referralCodes").doc(code).set({
            id: code,
            ownerId: userId,
            createdAt: FieldValue.serverTimestamp(),
            isActive: true,
            usageLimit: REFERRAL_CONFIG.MAX_USAGE_PER_CODE,
            timesUsed: 0,
          });

          // Update user document with the new code
          await db.collection("users").doc(userId).update({
            referralCode: code,
          });

          logger.info("Referral code created", { code, userId });
          return { referralCode: code };
        }
        
        attempts++;
      }
      
      throw new Error("Unable to generate unique referral code after multiple attempts");
    } catch (error) {
      logger.error("Error creating/getting referral code", error);
      throw error;
    }
  }
);

/**
 * Validate a referral code
 */
export const validateReferralCode = onCall<ValidateReferralCodeRequest>(
  {
    region: "us-central1",
  },
  async (request) => {
    try {
      const { data, auth } = request;
      const { code } = data;

      if (!auth?.uid) {
        throw new Error("Authentication required");
      }

      if (!code || code.length !== REFERRAL_CONFIG.CODE_LENGTH) {
        return {
          isValid: false,
          error: "Invalid code format",
        };
      }

      const codeDoc = await db.collection("referralCodes").doc(code.toUpperCase()).get();
      
      if (!codeDoc.exists) {
        return {
          isValid: false,
          error: "Referral code not found",
        };
      }

      const codeData = codeDoc.data()!;

      // Check if code is active
      if (!codeData.isActive) {
        return {
          isValid: false,
          error: "Referral code is no longer active",
        };
      }

      // Check if usage limit exceeded
      if (codeData.usageLimit && codeData.timesUsed >= codeData.usageLimit) {
        return {
          isValid: false,
          error: "Referral code usage limit exceeded",
        };
      }

      // Check if user is trying to refer themselves
      if (codeData.ownerId === auth.uid) {
        return {
          isValid: false,
          error: "You cannot use your own referral code",
        };
      }

      return {
        isValid: true,
        ownerId: codeData.ownerId,
      };
    } catch (error) {
      logger.error("Error validating referral code", error);
      return {
        isValid: false,
        error: "Error validating referral code",
      };
    }
  }
);

/**
 * Record a referral relationship during signup
 */
export const recordReferral = onCall<RecordReferralRequest>(
  {
    region: "us-central1",
  },
  async (request) => {
    try {
      const { data, auth } = request;
      const { referralCode } = data;

      if (!auth?.uid) {
        throw new Error("Authentication required");
      }

      const userId = auth.uid;

      // Validate referral code first
      const codeDoc = await db.collection("referralCodes").doc(referralCode.toUpperCase()).get();
      
      if (!codeDoc.exists) {
        throw new Error("Referral code not found");
      }

      const codeData = codeDoc.data()!;

      // Check if code is active
      if (!codeData.isActive) {
        throw new Error("Referral code is no longer active");
      }

      // Check if usage limit exceeded
      if (codeData.usageLimit && codeData.timesUsed >= codeData.usageLimit) {
        throw new Error("Referral code usage limit exceeded");
      }

      // Check if user is trying to refer themselves
      if (codeData.ownerId === userId) {
        throw new Error("You cannot use your own referral code");
      }

      const redemptionId = `${referralCode}_${userId}`;

      await db.runTransaction(async (transaction) => {
        // Check if referral already exists
        const existingRedemption = await transaction.get(
          db.collection("referralRedemptions").doc(redemptionId)
        );
        
        if (existingRedemption.exists) {
          throw new Error("Referral already recorded for this user");
        }

        // Create referral redemption record
        transaction.set(db.collection("referralRedemptions").doc(redemptionId), {
          referralCodeId: referralCode,
          referralCode: referralCode,
          referrerId: codeData.ownerId,
          refereeId: userId,
          redeemedAt: FieldValue.serverTimestamp(),
          referrerCreditsAwarded: REFERRAL_CONFIG.REFERRER_CREDITS,
          refereeCreditsAwarded: REFERRAL_CONFIG.REFEREE_CREDITS,
          status: 'pending',
        });

        // Update referral code usage count
        transaction.update(db.collection("referralCodes").doc(referralCode), {
          timesUsed: FieldValue.increment(1),
        });

        // Update user document with referral info
        transaction.update(db.collection("users").doc(userId), {
          referredBy: referralCode,
        });
      });

      logger.info("Referral recorded successfully", {
        refereeId: userId,
        referralCode,
        referrerId: codeData.ownerId,
      });

      return { success: true };
    } catch (error) {
      logger.error("Error recording referral", error);
      throw error;
    }
  }
);

/**
 * Complete a referral and award credits when referee verifies email
 * This is called automatically when a user's email verification status changes
 */
export const completeReferral = onCall<{ userId?: string }>(
  {
    region: "us-central1",
  },
  async (request) => {
    try {
      const { data, auth } = request;
      const targetUserId = data?.userId || auth?.uid;

      if (!targetUserId) {
        throw new Error("User ID required");
      }

      // Find pending referral for this user
      const redemptionsQuery = db.collection("referralRedemptions")
        .where("refereeId", "==", targetUserId)
        .where("status", "==", "pending")
        .limit(1);

      const querySnapshot = await redemptionsQuery.get();
      
      if (querySnapshot.empty) {
        logger.debug("No pending referral found for user", { userId: targetUserId });
        return { success: false, message: "No pending referral found" };
      }

      const redemptionDoc = querySnapshot.docs[0];
      const redemption = redemptionDoc.data();

      await db.runTransaction(async (transaction) => {
        // DO ALL READS FIRST (Firestore requirement)
        const referrerRef = db.collection("users").doc(redemption.referrerId);
        const referrerDoc = await transaction.get(referrerRef);
        const referrerData = referrerDoc.data() || {};
        const currentStats = referrerData.referralStats || {
          totalReferred: 0,
          creditsEarned: 0,
          pendingReferrals: 0,
        };

        // NOW DO ALL WRITES
        
        // Award credits to referrer
        const referrerCreditsRef = db.collection("userCredits").doc(redemption.referrerId);
        transaction.update(referrerCreditsRef, {
          balance: FieldValue.increment(redemption.referrerCreditsAwarded),
          lastUpdated: FieldValue.serverTimestamp(),
        });

        // Record referrer transaction
        const referrerTransactionRef = db.collection("creditTransactions").doc();
        transaction.set(referrerTransactionRef, {
          userId: redemption.referrerId,
          amount: redemption.referrerCreditsAwarded,
          type: "bonus",
          description: `Referral bonus: friend joined via your code ${redemption.referralCode}`,
          createdAt: FieldValue.serverTimestamp(),
          metadata: {
            referralCode: redemption.referralCode,
            refereeId: redemption.refereeId,
          },
        });

        // Award bonus credits to referee
        const refereeCreditsRef = db.collection("userCredits").doc(redemption.refereeId);
        transaction.update(refereeCreditsRef, {
          balance: FieldValue.increment(redemption.refereeCreditsAwarded),
          lastUpdated: FieldValue.serverTimestamp(),
        });

        // Record referee transaction
        const refereeTransactionRef = db.collection("creditTransactions").doc();
        transaction.set(refereeTransactionRef, {
          userId: redemption.refereeId,
          amount: redemption.refereeCreditsAwarded,
          type: "bonus",
          description: `Welcome bonus: joined via referral code ${redemption.referralCode}`,
          createdAt: FieldValue.serverTimestamp(),
          metadata: {
            referralCode: redemption.referralCode,
            referrerId: redemption.referrerId,
          },
        });

        // Update redemption status
        transaction.update(db.collection("referralRedemptions").doc(redemptionDoc.id), {
          status: 'completed',
          completedAt: FieldValue.serverTimestamp(),
        });

        // Update referrer's stats
        transaction.update(referrerRef, {
          referralStats: {
            totalReferred: currentStats.totalReferred + 1,
            creditsEarned: currentStats.creditsEarned + redemption.referrerCreditsAwarded,
            pendingReferrals: Math.max(0, currentStats.pendingReferrals - 1),
            lastReferralAt: FieldValue.serverTimestamp(),
          },
        });
      });

      logger.info("Referral completed successfully", {
        refereeId: redemption.refereeId,
        referrerId: redemption.referrerId,
        referrerCredits: redemption.referrerCreditsAwarded,
        refereeCredits: redemption.refereeCreditsAwarded,
      });

      // Send push notification to referrer
      await sendReferralNotification(redemption.referrerId, {
        referralCode: redemption.referralCode,
        refereeId: redemption.refereeId,
        creditsEarned: redemption.referrerCreditsAwarded,
      });

      return { success: true };
    } catch (error) {
      logger.error("Error completing referral", error);
      throw error;
    }
  }
);

/**
 * Get user's referral stats
 */
export const getReferralStats = onCall<{}>(
  {
    region: "us-central1",
  },
  async (request) => {
    try {
      const { auth } = request;

      if (!auth?.uid) {
        throw new Error("Authentication required");
      }

      const userDoc = await db.collection("users").doc(auth.uid).get();
      const userData = userDoc.data();
      
      const stats = userData?.referralStats || {
        totalReferred: 0,
        creditsEarned: 0,
        pendingReferrals: 0,
      };

      return { stats };
    } catch (error) {
      logger.error("Error getting referral stats", error);
      throw error;
    }
  }
);

/**
 * Get user's referral history
 */
export const getReferralHistory = onCall<{ limit?: number }>(
  {
    region: "us-central1",
  },
  async (request) => {
    try {
      const { data, auth } = request;

      if (!auth?.uid) {
        throw new Error("Authentication required");
      }

      const limitCount = data?.limit || 10;

      const querySnapshot = await db.collection("referralRedemptions")
        .where("referrerId", "==", auth.uid)
        .orderBy("redeemedAt", "desc")
        .limit(limitCount)
        .get();

      const history = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { history };
    } catch (error) {
      logger.error("Error getting referral history", error);
      throw error;
    }
  }
);

/**
 * Database trigger: Automatically complete referrals when user email is verified
 */
// Note: onUserEmailVerified trigger removed - will call completeReferral manually when needed