import { useState, useEffect } from "react";
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
  const { children } = useChildren();

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user has completed onboarding for this specific user
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      const hasOnboarded = await AsyncStorage.getItem(onboardingKey);

      if (hasOnboarded === "true") {
        setHasCompletedOnboarding(true);
      } else {
        // Check if they have any children profiles - if so, consider onboarded
        if (children.length > 0) {
          setHasCompletedOnboarding(true);
          // Save this state to avoid showing onboarding again
          await AsyncStorage.setItem(onboardingKey, "true");
        } else {
          setHasCompletedOnboarding(false);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // Default to showing onboarding if we can't check
      setHasCompletedOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

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
