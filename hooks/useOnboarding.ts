import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { logger } from "../utils/logger";
import { useAuth } from "./useAuth";
import { useChildren } from "./useChildren";

const ONBOARDING_KEY = "user_onboarded";

export const useOnboarding = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { children, loading: childrenLoading } = useChildren();

  // Check onboarding status when user or children data changes
  useEffect(() => {
    async function checkOnboardingStatus() {
      // If there's no user, they haven't completed onboarding
      if (!user) {
        setHasCompletedOnboarding(false);
        setLoading(false);
        return;
      }

      // Wait for children data to load
      if (childrenLoading) {
        return;
      }

      try {
        // If user has children, they've completed onboarding
        if (children.length > 0) {
          setHasCompletedOnboarding(true);
          // Update storage for consistency
          const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
          await AsyncStorage.setItem(onboardingKey, "true");
        } else {
          // Check if onboarding was completed but no children added yet
          const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
          const hasOnboardedFlag = await AsyncStorage.getItem(onboardingKey);
          setHasCompletedOnboarding(hasOnboardedFlag === "true");
        }
      } catch (error) {
        logger.error("Error checking onboarding status", error);
        setHasCompletedOnboarding(false);
      } finally {
        setLoading(false);
      }
    }

    checkOnboardingStatus();
  }, [user?.uid, children.length, childrenLoading]);

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      await AsyncStorage.setItem(onboardingKey, "true");
      setHasCompletedOnboarding(true);
    } catch (error) {
      logger.error("Error saving onboarding completion", error);
      // Still mark as completed in state even if saving fails
      setHasCompletedOnboarding(true);
    }
  };

  const resetOnboarding = async () => {
    if (!user) return;

    try {
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      await AsyncStorage.removeItem(onboardingKey);
      setHasCompletedOnboarding(false);
    } catch (error) {
      logger.error("Error resetting onboarding", error);
    }
  };

  return {
    hasCompletedOnboarding,
    loading,
    completeOnboarding,
    resetOnboarding,
  };
};
