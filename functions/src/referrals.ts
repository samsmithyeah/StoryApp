import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { sendReferralNotification } from "./sendReferralNotification";
import { checkRateLimit, recordRateLimitAttempt } from "./utils/rateLimiter";

const db = admin.firestore();

// Import shared configuration
import {
  REFERRAL_CONFIG,
  REFERRAL_SERVER_CONFIG,
} from "./constants/ReferralConfig";

// Combined config for server use
const SERVER_CONFIG = {
  ...REFERRAL_CONFIG,
  ...REFERRAL_SERVER_CONFIG,
} as const;

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
  let result = "";

  for (let i = 0; i < SERVER_CONFIG.CODE_LENGTH; i++) {
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

      // Rate limiting check
      const rateLimitExceeded = await checkRateLimit(userId, {
        windowMs: SERVER_CONFIG.RATE_LIMIT_WINDOW_MS,
        maxAttempts: 5, // Allow 5 code generations per minute
        action: "getUserReferralCode",
      });

      if (rateLimitExceeded) {
        throw new Error("Too many requests. Please try again later.");
      }

      // Record the attempt
      await recordRateLimitAttempt(userId, "getUserReferralCode");

      // Check if user already has a code
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (userData?.referralCode) {
        // Verify the code still exists and is valid
        const codeDoc = await db
          .collection("referralCodes")
          .doc(userData.referralCode)
          .get();
        if (codeDoc.exists && codeDoc.data()?.isActive) {
          return { referralCode: userData.referralCode };
        }
      }

      // Create new referral code
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const code = generateUniqueCode();
        const referralCodeRef = db.collection("referralCodes").doc(code);

        try {
          // Use create() to atomically check existence and create
          await referralCodeRef.create({
            id: code,
            ownerId: userId,
            createdAt: FieldValue.serverTimestamp(),
            isActive: true,
            usageLimit: SERVER_CONFIG.MAX_USAGE_PER_CODE,
            timesUsed: 0,
          });

          // Update user document with the new code
          await db.collection("users").doc(userId).update({
            referralCode: code,
          });

          logger.info("Referral code created", { code, userId });
          return { referralCode: code };
        } catch (error: any) {
          // If document already exists, create() will throw an error
          if (error?.code === "already-exists") {
            attempts++;
            continue;
          }
          // Re-throw any other error
          throw error;
        }
      }

      logger.error(
        "CRITICAL: Unable to generate unique referral code after multiple attempts",
        {
          userId,
          attempts,
          codeLength: SERVER_CONFIG.CODE_LENGTH,
          totalPossibleCodes: Math.pow(36, SERVER_CONFIG.CODE_LENGTH),
        }
      );
      throw new Error(
        "Unable to generate unique referral code after multiple attempts"
      );
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
      logger.debug("FUNCTION CALLED - Request received");
      const { data, auth } = request;
      logger.debug("FUNCTION CALLED - Destructured data:", data);
      const { code } = data;

      logger.info("validateReferralCode called", {
        code: code,
        userId: auth?.uid,
        codeType: typeof code,
      });

      if (!auth?.uid) {
        throw new Error("Authentication required");
      }

      // Input validation
      if (!code || typeof code !== "string") {
        return {
          isValid: false,
          error: "Invalid code format",
        };
      }

      const trimmedCode = code.trim();

      // Check code length
      if (trimmedCode.length !== SERVER_CONFIG.CODE_LENGTH) {
        logger.info("Code length validation failed", {
          providedCode: trimmedCode,
          providedLength: trimmedCode.length,
          expectedLength: SERVER_CONFIG.CODE_LENGTH,
          userId: auth.uid,
        });
        return {
          isValid: false,
          error: "Invalid code format",
        };
      }

      // Check if code contains only allowed characters (alphanumeric)
      const upperCode = trimmedCode.toUpperCase();
      if (!/^[A-Z0-9]+$/.test(upperCode)) {
        logger.info("Code format validation failed", {
          providedCode: trimmedCode,
          upperCode,
          userId: auth.uid,
        });
        return {
          isValid: false,
          error: "Invalid code format",
        };
      }

      // Rate limiting in production (skip in test environment and emulator)
      if (process.env.NODE_ENV !== "test" && !process.env.FUNCTIONS_EMULATOR) {
        const rateLimitWindow = new Date(
          Date.now() - SERVER_CONFIG.RATE_LIMIT_WINDOW_MS
        );
        const recentValidations = await db
          .collection("referralValidations")
          .where("userId", "==", auth.uid)
          .where("timestamp", ">", rateLimitWindow)
          .get();

        if (recentValidations.size >= SERVER_CONFIG.RATE_LIMIT_MAX_ATTEMPTS) {
          return {
            isValid: false,
            error: "Too many validation attempts. Please try again later.",
          };
        }

        // Record this validation attempt
        await db.collection("referralValidations").add({
          userId: auth.uid,
          code: trimmedCode.toUpperCase(),
          timestamp: FieldValue.serverTimestamp(),
        });
      }

      const codeDoc = await db
        .collection("referralCodes")
        .doc(trimmedCode.toUpperCase())
        .get();

      logger.info("Database lookup result", {
        code: trimmedCode.toUpperCase(),
        exists: codeDoc.exists,
        userId: auth.uid,
      });

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
        error: "Error validating referral code - EXCEPTION CAUGHT",
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

      // Rate limiting check
      const rateLimitExceeded = await checkRateLimit(userId, {
        windowMs: SERVER_CONFIG.RATE_LIMIT_WINDOW_MS,
        maxAttempts: 3, // Allow 3 referral records per minute
        action: "recordReferral",
      });

      if (rateLimitExceeded) {
        throw new Error("Too many requests. Please try again later.");
      }

      // Record the attempt
      await recordRateLimitAttempt(userId, "recordReferral");

      // Validate referral code first
      const codeDoc = await db
        .collection("referralCodes")
        .doc(referralCode.toUpperCase())
        .get();

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
        transaction.set(
          db.collection("referralRedemptions").doc(redemptionId),
          {
            referralCodeId: referralCode,
            referralCode: referralCode,
            referrerId: codeData.ownerId,
            refereeId: userId,
            redeemedAt: FieldValue.serverTimestamp(),
            referrerCreditsAwarded: SERVER_CONFIG.REFERRER_CREDITS,
            refereeCreditsAwarded: SERVER_CONFIG.REFEREE_CREDITS,
            status: "pending",
          }
        );

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
      const redemptionsQuery = db
        .collection("referralRedemptions")
        .where("refereeId", "==", targetUserId)
        .where("status", "==", "pending")
        .limit(1);

      const querySnapshot = await redemptionsQuery.get();

      if (querySnapshot.empty) {
        logger.debug("No pending referral found for user", {
          userId: targetUserId,
        });
        return { success: false, message: "No pending referral found" };
      }

      const redemptionDoc = querySnapshot.docs[0];
      const redemption = redemptionDoc.data();

      await db.runTransaction(async (transaction) => {
        // DO ALL READS FIRST (Firestore requirement)

        // Read referrer data
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
        const referrerCreditsRef = db
          .collection("userCredits")
          .doc(redemption.referrerId);
        transaction.update(referrerCreditsRef, {
          balance: FieldValue.increment(redemption.referrerCreditsAwarded),
          lastUpdated: FieldValue.serverTimestamp(),
        });

        // Record referrer transaction
        const referrerTransactionRef = db
          .collection("creditTransactions")
          .doc();
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
        const refereeCreditsRef = db
          .collection("userCredits")
          .doc(redemption.refereeId);
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
        transaction.update(
          db.collection("referralRedemptions").doc(redemptionDoc.id),
          {
            status: "completed",
            completedAt: FieldValue.serverTimestamp(),
          }
        );

        // Update referrer's stats
        transaction.update(referrerRef, {
          referralStats: {
            totalReferred: currentStats.totalReferred + 1,
            creditsEarned:
              currentStats.creditsEarned + redemption.referrerCreditsAwarded,
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

      // Send push notification to referrer (optional, don't fail if it doesn't work)
      try {
        await sendReferralNotification(redemption.referrerId, {
          referralCode: redemption.referralCode,
          refereeId: redemption.refereeId,
          creditsEarned: redemption.referrerCreditsAwarded,
        });
      } catch (notificationError) {
        logger.warn(
          "Failed to send referral notification, but referral completed successfully",
          {
            referrerId: redemption.referrerId,
            error: notificationError,
          }
        );
      }

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

      const querySnapshot = await db
        .collection("referralRedemptions")
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

/**
 * Cleanup expired referral validation attempts and old data
 * Runs daily at midnight UTC
 */
export const cleanupReferralData = onSchedule(
  {
    schedule: "0 0 * * *", // Daily at midnight UTC
    region: "us-central1",
  },
  async () => {
    try {
      logger.info("Starting referral data cleanup");

      const now = new Date();
      const validationCutoff = new Date(
        now.getTime() -
          SERVER_CONFIG.VALIDATION_RETENTION_DAYS * 24 * 60 * 60 * 1000
      );

      // Clean up old referral validation attempts
      const oldValidations = await db
        .collection("referralValidations")
        .where("timestamp", "<", validationCutoff)
        .limit(500) // Process in batches
        .get();

      if (!oldValidations.empty) {
        const batch = db.batch();
        oldValidations.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        logger.info("Cleaned up old referral validation attempts", {
          count: oldValidations.size,
          retentionDays: SERVER_CONFIG.VALIDATION_RETENTION_DAYS,
        });
      }

      // Clean up inactive referral codes with no usage
      const inactiveCodeCutoff = new Date(
        now.getTime() -
          SERVER_CONFIG.INACTIVE_CODE_RETENTION_YEARS *
            365 *
            24 *
            60 *
            60 *
            1000
      );
      const inactiveCodes = await db
        .collection("referralCodes")
        .where("isActive", "==", false)
        .where("createdAt", "<", inactiveCodeCutoff)
        .where("timesUsed", "==", 0)
        .limit(100) // Process in smaller batches for inactive codes
        .get();

      if (!inactiveCodes.empty) {
        const batch = db.batch();
        inactiveCodes.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        logger.info("Cleaned up old inactive referral codes", {
          count: inactiveCodes.size,
          retentionYears: SERVER_CONFIG.INACTIVE_CODE_RETENTION_YEARS,
        });
      }

      // Clean up old rate limit records
      const rateLimitCutoff = new Date(
        now.getTime() - 24 * 60 * 60 * 1000 // 24 hours
      );
      const oldRateLimits = await db
        .collection("rateLimits")
        .where("timestamp", "<", rateLimitCutoff)
        .limit(1000) // Rate limits can be numerous
        .get();

      if (!oldRateLimits.empty) {
        const batch = db.batch();
        oldRateLimits.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        logger.info("Cleaned up old rate limit records", {
          count: oldRateLimits.size,
          retentionHours: 24,
        });
      }

      // Clean up expired/cancelled referral redemptions older than 90 days
      const expiredRedemptionsCutoff = new Date(
        now.getTime() - 90 * 24 * 60 * 60 * 1000 // 90 days
      );
      const expiredRedemptions = await db
        .collection("referralRedemptions")
        .where("status", "==", "cancelled")
        .where("redeemedAt", "<", expiredRedemptionsCutoff)
        .limit(200)
        .get();

      if (!expiredRedemptions.empty) {
        const batch = db.batch();
        expiredRedemptions.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        logger.info("Cleaned up old cancelled referral redemptions", {
          count: expiredRedemptions.size,
          retentionDays: 90,
        });
      }

      logger.info("Referral data cleanup completed", {
        validationsDeleted: oldValidations.size || 0,
        inactiveCodesDeleted: inactiveCodes.size || 0,
        rateLimitsDeleted: oldRateLimits.size || 0,
        redemptionsDeleted: expiredRedemptions.size || 0,
      });
    } catch (error) {
      logger.error("Error during referral data cleanup", error);
    }
  }
);
