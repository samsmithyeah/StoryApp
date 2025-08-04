import { WelcomeOnboarding } from "@/components/onboarding/WelcomeOnboarding";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const {
    hasCompletedOnboarding,
    loading: onboardingLoading,
    completeOnboarding,
  } = useOnboarding();

  // State to ensure we only render/redirect once everything is confirmed ready.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only when both hooks are done loading, mark the app as ready to proceed.
    if (!authLoading && !onboardingLoading) {
      setIsReady(true);
    }
  }, [authLoading, onboardingLoading]);

  const handleOnboardingComplete = async () => {
    // The hook update will trigger a re-render, and the logic below will handle redirection.
    await completeOnboarding();
  };

  // While waiting for hooks to resolve, show a loading screen.
  // This is our primary defense against the race condition.
  if (!isReady) {
    return <LoadingScreen message="Setting up DreamWeaver..." />;
  }

  // Once ready, we can safely check the state and render the correct screen.
  if (user) {
    // Check if email verification is required
    if (user.email && !user.emailVerified) {
      // User needs to verify email
      return <Redirect href="/(auth)/verify-email" />;
    }
    
    if (hasCompletedOnboarding) {
      // User is logged in and fully onboarded.
      return <Redirect href="/(tabs)" />;
    } else {
      // User is logged in but needs onboarding.
      return (
        <WelcomeOnboarding
          visible={true}
          onComplete={handleOnboardingComplete}
        />
      );
    }
  } else {
    // No user, show the login screen.
    return <Redirect href="/(auth)/login" />;
  }
}
