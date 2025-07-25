import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
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
    // If there's no user, we can't check onboarding status
    if (!user) {
      setHasCompletedOnboarding(false);
      setLoading(false);
      return;
    }

    // Wait until children data is loaded
    if (childrenLoading) {
      return;
    }

    try {
      if (children.length > 0) {
        setHasCompletedOnboarding(true);
        // We'll also ensure the flag is set correctly in storage for consistency.
        const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
        await AsyncStorage.setItem(onboardingKey, "true");
        setLoading(false);
        return;
      }

      // If we reach this point, the user has NO children.
      // Now, we fall back to checking the stored flag for users who may have
      // completed onboarding but haven't added a child yet.
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      const hasOnboardedFlag = await AsyncStorage.getItem(onboardingKey);

      // They are only considered onboarded if the flag is explicitly 'true'.
      // If the flag is null, 'false', or anything else, they need onboarding.
      setHasCompletedOnboarding(hasOnboardedFlag === "true");
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // Default to showing onboarding if we encounter an error
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
