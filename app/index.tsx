import { WelcomeOnboarding } from "@/components/onboarding/WelcomeOnboarding";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { logger } from "@/utils/logger";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
  const { user, loading } = useAuth();
  const {
    hasCompletedOnboarding,
    loading: onboardingLoading,
    completeOnboarding,
  } = useOnboarding();

  // State to ensure we only render/redirect once everything is confirmed ready.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    logger.debug("Index state change", {
      userEmail: user?.email,
      userVerified: user?.emailVerified,
      loading,
      onboardingLoading,
      hasCompletedOnboarding,
      isReady,
    });

    // Only when both hooks are done loading, mark the app as ready to proceed.
    // Add condition to prevent setting isReady multiple times
    if (!loading && !onboardingLoading && !isReady) {
      logger.debug("Setting isReady to true");
      setIsReady(true);
    }
  }, [loading, onboardingLoading, isReady, user, hasCompletedOnboarding]);

  const handleOnboardingComplete = async () => {
    // The hook update will trigger a re-render, and the logic below will handle redirection.
    await completeOnboarding();
  };

  // While waiting for hooks to resolve, show a loading screen.
  // This is our primary defense against the race condition.
  if (!isReady) {
    logger.debug("Showing loading screen - not ready yet");
    return <LoadingScreen message="Setting up DreamWeaver..." />;
  }

  // Once ready, we can safely check the state and render the correct screen.
  if (user) {
    // Check if email verification is required (skip for test accounts in dev)
    const isTestAccount =
      __DEV__ &&
      (user.email?.endsWith("@test.dreamweaver") ||
        user.email?.includes("test@example.com"));
    if (user.email && !user.emailVerified && !isTestAccount) {
      logger.debug("Redirecting to verify-email");
      return <Redirect href="/(auth)/verify-email" />;
    }

    if (hasCompletedOnboarding) {
      logger.debug("Redirecting to tabs (onboarding complete)");
      return <Redirect href="/(tabs)" />;
    } else {
      logger.debug("Showing WelcomeOnboarding");
      return (
        <WelcomeOnboarding
          visible={true}
          onComplete={handleOnboardingComplete}
        />
      );
    }
  } else {
    logger.debug("Redirecting to login (no user)");
    return <Redirect href="/(auth)/login" />;
  }
}
