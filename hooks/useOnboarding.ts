import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { logger } from "../utils/logger";
import { useAuthStore } from "../store/authStore";

const ONBOARDING_KEY = "user_onboarded";

// Backward compatibility hook - now just proxies to centralized auth status

export const useOnboarding = () => {
  const { user, hasCompletedOnboarding, setOnboardingStatus, loading } =
    useAuthStore();

  // This hook is now just a compatibility layer
  // All onboarding logic is handled in the centralized auth store
  useEffect(() => {
    // The auth store handles all onboarding status computation
    // This hook just exists for backward compatibility
    logger.debug("useOnboarding hook called", {
      hasCompletedOnboarding,
      loading,
      userUid: user?.uid,
    });
  }, [hasCompletedOnboarding, loading, user?.uid]);

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      await AsyncStorage.setItem(onboardingKey, "true");
      setOnboardingStatus(true);
      logger.debug("Onboarding completed", { userUid: user.uid });
    } catch (error) {
      logger.error("Error saving onboarding completion", error);
      // Still mark as completed in state even if saving fails
      setOnboardingStatus(true);
    }
  };

  const resetOnboarding = async () => {
    if (!user) return;

    try {
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      await AsyncStorage.removeItem(onboardingKey);
      setOnboardingStatus(false);
      logger.debug("Onboarding reset", { userUid: user.uid });
    } catch (error) {
      logger.error("Error resetting onboarding", error);
    }
  };

  return {
    hasCompletedOnboarding,
    loading: loading || hasCompletedOnboarding === null,
    completeOnboarding,
    resetOnboarding,
  };
};
