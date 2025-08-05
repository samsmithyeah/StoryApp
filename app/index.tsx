import { WelcomeOnboarding } from "@/components/onboarding/WelcomeOnboarding";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
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
    console.log("[INDEX] State change:", {
      user: user ? `${user.email} (verified: ${user.emailVerified})` : "null",
      loading,
      onboardingLoading,
      hasCompletedOnboarding,
      isReady,
    });

    // Only when both hooks are done loading, mark the app as ready to proceed.
    // Add condition to prevent setting isReady multiple times
    if (!loading && !onboardingLoading && !isReady) {
      console.log("[INDEX] Setting isReady to true");
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
    console.log("[INDEX] Showing loading screen - not ready yet");
    return <LoadingScreen message="Setting up DreamWeaver..." />;
  }

  // Once ready, we can safely check the state and render the correct screen.
  if (user) {
    // Check if email verification is required (skip for test accounts in dev)
    const isTestAccount = __DEV__ && user.email?.endsWith("@test.dreamweaver");
    if (user.email && !user.emailVerified && !isTestAccount) {
      console.log("[INDEX] Redirecting to verify-email");
      return <Redirect href="/(auth)/verify-email" />;
    }

    if (hasCompletedOnboarding) {
      console.log("[INDEX] Redirecting to tabs (onboarding complete)");
      return <Redirect href="/(tabs)" />;
    } else {
      console.log("[INDEX] Showing WelcomeOnboarding");
      return (
        <WelcomeOnboarding
          visible={true}
          onComplete={handleOnboardingComplete}
        />
      );
    }
  } else {
    console.log("[INDEX] Redirecting to login (no user)");
    return <Redirect href="/(auth)/login" />;
  }
}
