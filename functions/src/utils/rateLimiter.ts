import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "./logger";

const db = admin.firestore();

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  action: string;
}

/**
 * Check if user has exceeded rate limit for a specific action
 * @param userId User ID to check
 * @param config Rate limit configuration
 * @returns true if rate limit exceeded, false otherwise
 */
export async function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<boolean> {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === "test") {
    return false;
  }

  try {
    const rateLimitWindow = new Date(Date.now() - config.windowMs);
    const recentAttempts = await db
      .collection("rateLimits")
      .where("userId", "==", userId)
      .where("action", "==", config.action)
      .where("timestamp", ">", rateLimitWindow)
      .get();

    const isExceeded = recentAttempts.size >= config.maxAttempts;

    if (isExceeded) {
      logger.warn("Rate limit exceeded", {
        userId,
        action: config.action,
        attempts: recentAttempts.size,
        maxAttempts: config.maxAttempts,
      });
    }

    return isExceeded;
  } catch (error) {
    logger.error("Error checking rate limit", {
      userId,
      action: config.action,
      error,
    });
    // On error, don't block the user
    return false;
  }
}

/**
 * Record a rate limit attempt
 * @param userId User ID
 * @param action Action being performed
 */
export async function recordRateLimitAttempt(
  userId: string,
  action: string
): Promise<void> {
  // Skip recording in test environment
  if (process.env.NODE_ENV === "test") {
    return;
  }

  try {
    await db.collection("rateLimits").add({
      userId,
      action,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error("Error recording rate limit attempt", {
      userId,
      action,
      error,
    });
    // Don't throw - this is just tracking
  }
}
