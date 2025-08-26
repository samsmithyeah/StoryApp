import { WelcomeOnboarding } from "@/components/onboarding/WelcomeOnboarding";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { AuthStatus } from "@/store/authStore";
import { logger } from "@/utils/logger";
import { Redirect } from "expo-router";

export default function Index() {
  const { authStatus, completeOnboarding } = useAuth();

  const handleOnboardingComplete = async () => {
    await completeOnboarding();
  };

  logger.debug("Index auth status", { authStatus });

  // Single switch statement based on centralized auth status
  switch (authStatus) {
    case AuthStatus.INITIALIZING:
      logger.debug("Showing loading screen - initializing");
      return <LoadingScreen message="Setting up DreamWeaver..." />;

    case AuthStatus.UNAUTHENTICATED:
      logger.debug("Redirecting to login (unauthenticated)");
      return <Redirect href="/(auth)/login" />;

    case AuthStatus.UNVERIFIED:
      logger.debug("Redirecting to verify-email");
      return <Redirect href="/(auth)/verify-email" />;

    case AuthStatus.ONBOARDING:
      logger.debug("Showing WelcomeOnboarding");
      return (
        <WelcomeOnboarding
          visible={true}
          onComplete={handleOnboardingComplete}
        />
      );

    case AuthStatus.AUTHENTICATED:
      logger.debug("Redirecting to tabs (authenticated)");
      return <Redirect href="/(tabs)" />;

    default:
      // Fallback for any unexpected state
      logger.warn("Unexpected auth status, showing loading screen", {
        authStatus,
      });
      return <LoadingScreen message="Setting up DreamWeaver..." />;
  }
}
