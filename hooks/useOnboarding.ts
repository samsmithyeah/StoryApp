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
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { children, loading: childrenLoading } = useChildren();

  const checkOnboardingStatus = useCallback(async () => {
    console.log('[ONBOARDING] checkOnboardingStatus called', {
      user: user ? user.email : 'null',
      childrenLoading,
      childrenCount: children.length,
      isProcessing,
      hasCompletedOnboarding
    });
    
    // If there's no user, we can't check onboarding status
    if (!user) {
      console.log('[ONBOARDING] No user, setting not onboarded');
      setHasCompletedOnboarding(false);
      setLoading(false);
      return;
    }

    // Prevent concurrent processing
    if (isProcessing) {
      console.log('[ONBOARDING] Already processing, skipping...');
      return;
    }

    // If we already have an onboarding status, don't recheck unless necessary
    if (hasCompletedOnboarding !== null && !childrenLoading) {
      console.log('[ONBOARDING] Already have onboarding status, setting loading to false');
      setLoading(false);
      return;
    }

    // Wait until children data is loaded for the first check
    if (childrenLoading && hasCompletedOnboarding === null) {
      console.log('[ONBOARDING] Still waiting for children to load (first time)...');
      return;
    }
    
    console.log('[ONBOARDING] Proceeding with onboarding check');
    setIsProcessing(true);

    try {
      if (children.length > 0) {
        console.log('[ONBOARDING] User has children, marking as onboarded');
        setHasCompletedOnboarding(true);
        // We'll also ensure the flag is set correctly in storage for consistency.
        const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
        await AsyncStorage.setItem(onboardingKey, "true");
        // Don't return early - let the finally block run
      } else {

        // If we reach this point, the user has NO children.
        // Now, we fall back to checking the stored flag for users who may have
        // completed onboarding but haven't added a child yet.
        console.log('[ONBOARDING] No children, checking AsyncStorage flag');
        const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
        const hasOnboardedFlag = await AsyncStorage.getItem(onboardingKey);
        console.log('[ONBOARDING] AsyncStorage flag:', hasOnboardedFlag);

        // They are only considered onboarded if the flag is explicitly 'true'.
        // If the flag is null, 'false', or anything else, they need onboarding.
        setHasCompletedOnboarding(hasOnboardedFlag === "true");
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // Default to showing onboarding if we encounter an error
      setHasCompletedOnboarding(false);
    } finally {
      console.log('[ONBOARDING] Setting loading to false');
      setLoading(false);
      setIsProcessing(false);
    }
  }, [user?.uid, children.length, childrenLoading]);

  useEffect(() => {
    // Only run the check if we don't have an onboarding status yet
    if (hasCompletedOnboarding === null) {
      checkOnboardingStatus();
    }
  }, [checkOnboardingStatus, hasCompletedOnboarding]);

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
