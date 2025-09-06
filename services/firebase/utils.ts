import { logger } from "../../utils/logger";

/**
 * Helper function to handle auth state mismatch in Firebase operations
 * Detects permission-denied errors that indicate auth state inconsistency
 * and forces a sign-out to restore proper authentication state
 */
export const handleAuthStateMismatch = async (
  error: any,
  operation: string
): Promise<never> => {
  if (error.code === "firestore/permission-denied") {
    logger.error(`Authentication state mismatch detected during ${operation}`, {
      errorCode: error.code,
      errorMessage: error.message,
    });

    // Import signOut dynamically to avoid circular dependency
    try {
      const { useAuthStore } = await import("../../store/authStore");
      const { signOut } = useAuthStore.getState();
      logger.warn(
        `Forcing sign out due to auth state mismatch in ${operation}`
      );
      await signOut();
    } catch (signOutError) {
      logger.error(
        "Failed to sign out during auth state mismatch recovery",
        signOutError
      );
    }

    // Re-throw with a more user-friendly message
    throw new Error("Authentication session expired. Please sign in again.");
  }
  throw error;
};

/**
 * Convert Firestore timestamps back to Date objects
 * Handles both Firestore Timestamps and string/number dates
 */
export const convertFirestoreTimestamp = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    logger.warn("Encountered an invalid timestamp value", { timestamp });
    return undefined;
  }
  return date;
};
