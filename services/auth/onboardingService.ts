import { logger } from "../../utils/logger";
import { FirestoreUserData } from "../../types/firestore.types";
import { User } from "../../types/auth.types";
import { updateUserOnboardingStatus } from "../firebase/auth";
import { AuthCacheService } from "./authCacheService";
import { ErrorNotificationService } from "./errorNotificationService";
import { AUTH_TIMEOUTS } from "../../constants/AuthConstants";

interface OnboardingResult {
  hasCompletedOnboarding: boolean;
  reason:
    | "firestore_flag"
    | "has_children"
    | "default_false"
    | "error_preserved"
    | "error_new_user";
}

export class OnboardingService {
  /**
   * Determines onboarding status with clear reasoning
   */
  static async checkOnboardingStatus(
    user: User,
    userData: FirestoreUserData | null
  ): Promise<OnboardingResult> {
    // Check explicit onboarding flag first
    if (userData?.hasCompletedOnboarding === true) {
      logger.debug("User has completed onboarding (Firestore flag)", {
        uid: user.uid,
      });
      return {
        hasCompletedOnboarding: true,
        reason: "firestore_flag",
      };
    }

    if (userData?.hasCompletedOnboarding === false) {
      logger.debug("User has not completed onboarding (Firestore flag)", {
        uid: user.uid,
      });
      return {
        hasCompletedOnboarding: false,
        reason: "firestore_flag",
      };
    }

    // Check if user has children (implicit onboarding completion)
    if (
      userData?.children &&
      Array.isArray(userData.children) &&
      userData.children.length > 0
    ) {
      logger.debug("User has children, marking onboarding as complete", {
        uid: user.uid,
        childrenCount: userData.children.length,
      });

      // Update Firestore for consistency (fire and forget)
      this.updateOnboardingStatusAsync(user.uid, true).catch((error) => {
        logger.warn("Failed to update onboarding status in Firestore", {
          uid: user.uid,
          error,
        });
      });

      return {
        hasCompletedOnboarding: true,
        reason: "has_children",
      };
    }

    // Default for users without explicit status
    logger.debug(
      "No onboarding indicators found, defaulting to not completed",
      { uid: user.uid }
    );
    return {
      hasCompletedOnboarding: false,
      reason: "default_false",
    };
  }

  /**
   * Handles onboarding check with error recovery
   */
  static async checkOnboardingWithErrorHandling(
    user: User,
    currentStatus: boolean | null
  ): Promise<OnboardingResult> {
    try {
      const userData = await AuthCacheService.getUserData(user.uid);
      return await this.checkOnboardingStatus(user, userData);
    } catch (error) {
      logger.error("Error checking onboarding status", {
        uid: user.uid,
        error,
      });

      // Surface onboarding errors to user for non-network issues
      if (currentStatus === null) {
        ErrorNotificationService.addOnboardingError(
          "Unable to determine if you've completed account setup"
        );
      }

      return this.handleOnboardingError(user, currentStatus, error);
    }
  }

  /**
   * Smart error handling for onboarding status
   */
  private static handleOnboardingError(
    user: User,
    currentStatus: boolean | null,
    error: unknown
  ): OnboardingResult {
    if (currentStatus !== null) {
      // Preserve existing status if we have one
      logger.debug("Preserving existing onboarding status due to error", {
        uid: user.uid,
        currentStatus,
      });
      return {
        hasCompletedOnboarding: currentStatus,
        reason: "error_preserved",
      };
    }

    // For new users (created recently), assume not onboarded
    const isRecentUser =
      user.createdAt &&
      Date.now() - user.createdAt.getTime() <
        AUTH_TIMEOUTS.NEW_USER_THRESHOLD_MS;

    if (isRecentUser) {
      logger.debug("New user detected, defaulting onboarding to false", {
        uid: user.uid,
      });
      return {
        hasCompletedOnboarding: false,
        reason: "error_new_user",
      };
    }

    // For existing users, we can't determine status - this will trigger a retry
    throw error;
  }

  /**
   * Async update of onboarding status (fire and forget)
   */
  private static async updateOnboardingStatusAsync(
    uid: string,
    completed: boolean
  ): Promise<void> {
    try {
      await updateUserOnboardingStatus(uid, completed);

      // Invalidate cache to ensure fresh data
      AuthCacheService.invalidateUser(uid);

      logger.debug("Updated onboarding status in Firestore", {
        uid,
        completed,
      });
    } catch (error) {
      // Don't throw - this is fire and forget
      logger.warn("Failed to update onboarding status", {
        uid,
        completed,
        error,
      });
    }
  }

  /**
   * Mark onboarding as completed
   */
  static async completeOnboarding(uid: string): Promise<void> {
    try {
      await updateUserOnboardingStatus(uid, true);

      // Invalidate cache to ensure fresh data on next read
      AuthCacheService.invalidateUser(uid);

      logger.debug("Onboarding completion saved to Firestore", { uid });
    } catch (error) {
      logger.error("Error saving onboarding completion", { uid, error });
      throw error;
    }
  }
}
