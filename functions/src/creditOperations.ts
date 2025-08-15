import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

const db = admin.firestore();

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

interface UseCreditRequest {
  amount: number;
  storyId?: string;
  description?: string;
}

interface UseCreditResponse {
  success: boolean;
  remainingBalance: number;
  error?: string;
}

/**
 * Retry utility with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === options.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;

      logger.warn(`Operation failed, retrying in ${totalDelay}ms`, {
        attempt: attempt + 1,
        maxRetries: options.maxRetries,
        error: lastError.message,
      });

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError!;
}

/**
 * Use credits with automatic retry logic
 * This provides a reliable way to deduct credits with proper error handling
 */
export const useCreditsReliable = onCall<
  UseCreditRequest,
  Promise<UseCreditResponse>
>(
  {
    region: "us-central1",
    enforceAppCheck: true,
  },
  async (request) => {
    try {
      const { data, auth } = request;

      if (!auth?.uid) {
        throw new Error("Authentication required");
      }

      const userId = auth.uid;
      const { amount, storyId, description } = data;

      if (!amount || amount <= 0) {
        throw new Error("Invalid credit amount");
      }

      logger.info("Using credits with retry", {
        userId,
        amount,
        storyId,
      });

      const result = await retryWithBackoff(async () => {
        return await db.runTransaction(async (transaction) => {
          const creditsRef = db.collection("userCredits").doc(userId);
          const creditsDoc = await transaction.get(creditsRef);

          if (!creditsDoc.exists) {
            throw new Error("User credits not found");
          }

          const creditsData = creditsDoc.data();
          if (!creditsData) {
            throw new Error("Invalid credits data");
          }

          const currentBalance = creditsData.balance || 0;

          if (currentBalance < amount) {
            throw new Error(
              `Insufficient credits. Need ${amount}, have ${currentBalance}`
            );
          }

          // Deduct credits
          transaction.update(creditsRef, {
            balance: FieldValue.increment(-amount),
            lifetimeUsed: FieldValue.increment(amount),
            lastUpdated: FieldValue.serverTimestamp(),
          });

          // Record transaction
          const transactionRef = db.collection("creditTransactions").doc();
          transaction.set(transactionRef, {
            userId,
            amount: -amount,
            type: "usage",
            description:
              description ||
              `Used ${amount} credit${amount > 1 ? "s" : ""} for story generation`,
            createdAt: FieldValue.serverTimestamp(),
            storyId,
            metadata: {
              previousBalance: currentBalance,
              newBalance: currentBalance - amount,
            },
          });

          return {
            success: true,
            remainingBalance: currentBalance - amount,
          };
        });
      });

      logger.info("Successfully used credits", {
        userId,
        amount,
        remainingBalance: result.remainingBalance,
      });

      return result;
    } catch (error) {
      logger.error("Error using credits", {
        error: error instanceof Error ? error.message : String(error),
        userId: request.auth?.uid,
        amount: request.data.amount,
      });

      return {
        success: false,
        remainingBalance: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

/**
 * Check if user has sufficient credits for a story generation
 */
export const checkCreditsAvailable = onCall<
  { amount: number },
  Promise<{ available: boolean; balance: number }>
>(
  {
    region: "us-central1",
    enforceAppCheck: true,
  },
  async (request) => {
    try {
      const { data, auth } = request;

      if (!auth?.uid) {
        throw new Error("Authentication required");
      }

      const userId = auth.uid;
      const { amount } = data;

      const creditsDoc = await db.collection("userCredits").doc(userId).get();

      if (!creditsDoc.exists) {
        return { available: false, balance: 0 };
      }

      const creditsData = creditsDoc.data();
      const balance = creditsData?.balance || 0;

      return {
        available: balance >= amount,
        balance,
      };
    } catch (error) {
      logger.error("Error checking credits", {
        error: error instanceof Error ? error.message : String(error),
        userId: request.auth?.uid,
      });

      return { available: false, balance: 0 };
    }
  }
);

/**
 * Repair any inconsistent credit states
 * This can be called manually or scheduled to fix any data integrity issues
 */
export const repairUserCredits = onCall<
  { userId?: string },
  Promise<{ success: boolean; message: string }>
>(
  {
    region: "us-central1",
    // Note: This should be restricted to admin users only
  },
  async (request) => {
    try {
      const { data } = request;
      const targetUserId = data.userId;

      logger.info("Repairing user credits", { targetUserId });

      // If no specific user, this could be expanded to repair all users
      if (!targetUserId) {
        return { success: false, message: "User ID required" };
      }

      await retryWithBackoff(async () => {
        return await db.runTransaction(async (transaction) => {
          // Recalculate balance from transaction history
          const transactionsQuery = db
            .collection("creditTransactions")
            .where("userId", "==", targetUserId);

          const transactions = await transactionsQuery.get();

          let calculatedBalance = 0;
          let lifetimeUsed = 0;

          transactions.docs.forEach((doc) => {
            const data = doc.data();
            const amount = data.amount || 0;

            if (amount > 0) {
              calculatedBalance += amount;
            } else {
              calculatedBalance += amount; // amount is negative for usage
              lifetimeUsed += Math.abs(amount);
            }
          });

          // Update user credits with calculated values
          const creditsRef = db.collection("userCredits").doc(targetUserId);
          transaction.set(
            creditsRef,
            {
              userId: targetUserId,
              balance: Math.max(0, calculatedBalance), // Ensure non-negative
              lifetimeUsed,
              subscriptionActive: false, // Would need to check RevenueCat for accuracy
              freeCreditsGranted: calculatedBalance > 0,
              lastUpdated: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        });
      });

      logger.info("Successfully repaired user credits", { targetUserId });

      return {
        success: true,
        message: `Successfully repaired credits for user ${targetUserId}`,
      };
    } catch (error) {
      logger.error("Error repairing user credits", {
        error: error instanceof Error ? error.message : String(error),
        userId: request.data.userId,
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
