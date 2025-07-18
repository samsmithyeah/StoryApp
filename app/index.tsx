import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { WelcomeOnboarding } from "@/components/onboarding/WelcomeOnboarding";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const {
    hasCompletedOnboarding,
    loading: onboardingLoading,
    completeOnboarding,
  } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completingOnboarding, setCompletingOnboarding] = useState(false);

  useEffect(() => {
    // Show onboarding if user is authenticated but hasn't completed onboarding
    if (user && hasCompletedOnboarding === false) {
      setShowOnboarding(true);
    } else if (user && hasCompletedOnboarding === true) {
      setShowOnboarding(false);
      setCompletingOnboarding(false);
    }
  }, [user, hasCompletedOnboarding]);

  const handleOnboardingComplete = async () => {
    setCompletingOnboarding(true);
    setShowOnboarding(false);
    await completeOnboarding();
  };

  if (authLoading || onboardingLoading) {
    return <LoadingScreen message="Setting up DreamWeaver..." />;
  }

  if (completingOnboarding) {
    return <LoadingScreen message="Completing setup..." />;
  }

  // Show onboarding modal if needed
  if (user && showOnboarding) {
    return (
      <WelcomeOnboarding visible={true} onComplete={handleOnboardingComplete} />
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}
