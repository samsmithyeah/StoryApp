import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Wait for children to finish loading before making onboarding decision
    if (childrenLoading) {
      return;
    }

    try {
      // Check if user has completed onboarding for this specific user
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      const hasOnboarded = await AsyncStorage.getItem(onboardingKey);

      if (hasOnboarded === "true") {
        setHasCompletedOnboarding(true);
      } else if (hasOnboarded === "false") {
        // Explicitly set to false, don't auto-complete
        setHasCompletedOnboarding(false);
      } else {
        // No onboarding status stored - check if they have children (legacy users)
        if (children.length > 0) {
          setHasCompletedOnboarding(true);
          // Save this state to avoid showing onboarding again
          await AsyncStorage.setItem(onboardingKey, "true");
        } else {
          setHasCompletedOnboarding(false);
          // Store false explicitly to prevent auto-completion during onboarding
          await AsyncStorage.setItem(onboardingKey, "false");
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // Default to showing onboarding if we can't check
      setHasCompletedOnboarding(false);
    } finally {
      setLoading(false);
    }
  }, [user, children, childrenLoading]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      await AsyncStorage.setItem(onboardingKey, "true");
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error("Error saving onboarding completion:", error);
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
      console.error("Error resetting onboarding:", error);
    }
  };

  return {
    hasCompletedOnboarding,
    loading,
    completeOnboarding,
    resetOnboarding,
  };
};
