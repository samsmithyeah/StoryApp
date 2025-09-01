import { doc, getDoc } from "@react-native-firebase/firestore";
import { db } from "./config";
import { FirestoreUserData } from "../../types/firestore.types";
import { logger } from "../../utils/logger";

/**
 * Pure data fetching service for user data from Firestore
 * This service doesn't depend on any other auth services to avoid circular dependencies
 */
export const fetchUserData = async (
  uid: string,
  maxRetries: number = 3
): Promise<FirestoreUserData | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug("Fetching user data from Firestore", { uid, attempt });
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);

      const result = userDoc.exists()
        ? (userDoc.data() as FirestoreUserData)
        : null;

      if (attempt > 1) {
        logger.info("User data fetch succeeded after retry", { uid, attempt });
      }

      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      logger.warn("User data fetch failed", {
        uid,
        attempt,
        maxRetries,
        error: error instanceof Error ? error.message : String(error),
        isLastAttempt,
      });

      if (isLastAttempt) {
        logger.error("User data fetch failed after all retries", {
          uid,
          maxRetries,
          error,
        });
        throw error;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms
      const delayMs = Math.min(500 * Math.pow(2, attempt - 1), 2000);
      logger.debug("Retrying user data fetch after delay", {
        uid,
        attempt,
        delayMs,
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // This should never be reached due to the throw above, but TypeScript needs it
  throw new Error("Unexpected end of retry loop");
};
