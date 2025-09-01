import { WelcomeOnboarding } from "@/components/onboarding/WelcomeOnboarding";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Colors } from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { AuthStatus } from "@/types/auth.types";
import { logger } from "@/utils/logger";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ImageBackground, StyleSheet } from "react-native";

export default function Index() {
  const { user, authStatus, completeOnboarding, isReady, needsOnboarding } =
    useAuth();
  const justAppliedReferral = useAuthStore(
    (state) => state.justAppliedReferral
  );

  // Initialize auth when needed (including after signOut)
  useEffect(() => {
    const { initialize, isInitialized } = useAuthStore.getState();
    logger.debug("Index useEffect - checking auth initialization", {
      isInitialized,
    });

    if (!isInitialized) {
      logger.debug("Auth not initialized, initializing now");
      // Configure Google Sign-In once globally
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (webClientId) {
        import("@/services/firebase/auth").then(({ configureGoogleSignIn }) => {
          configureGoogleSignIn(webClientId);
        });
      }

      // Initialize auth state listener
      initialize();
    }
  }, []); // Only run once on mount

  // Also check if auth needs reinitialization when we have a user but status is wrong
  useEffect(() => {
    if (user && authStatus === AuthStatus.UNAUTHENTICATED) {
      const { isInitialized, initialize } = useAuthStore.getState();
      if (!isInitialized) {
        logger.debug("User exists but auth not initialized - reinitializing");
        initialize();
      }
    }
  }, [user, authStatus]); // Check when user or authStatus changes

  logger.debug("Index render", {
    userEmail: user?.email,
    userVerified: user?.emailVerified,
    authStatus,
    isReady,
    needsOnboarding,
  });

  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);

  const handleOnboardingComplete = async () => {
    try {
      logger.debug("Handling onboarding complete - skip for now clicked");
      setIsCompletingOnboarding(true);
      await completeOnboarding();
      logger.debug("Onboarding completion successful");
      // Keep loading state briefly to ensure smooth transition
      setTimeout(() => setIsCompletingOnboarding(false), 500);
    } catch (error) {
      logger.error("Failed to complete onboarding", error);
      setIsCompletingOnboarding(false);
    }
  };

  // Background container component to prevent white flashes
  const BackgroundContainer = ({ children }: { children: React.ReactNode }) => (
    <ImageBackground
      source={require("../assets/images/background-landscape.png")}
      resizeMode="cover"
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </ImageBackground>
  );

  // Prevent redirects when user exists but auth status is transitioning
  const isAuthStatusTransitioning =
    user && authStatus === AuthStatus.UNAUTHENTICATED;
  if (isAuthStatusTransitioning) {
    logger.debug("Auth status transitioning - showing loading");
    return (
      <BackgroundContainer>
        <LoadingScreen message="Signing in..." transparent />
      </BackgroundContainer>
    );
  }

  // Simple switch based on centralized auth status - no more race conditions!
  switch (authStatus) {
    case AuthStatus.INITIALIZING:
      logger.debug("Showing loading screen - initializing");
      return (
        <BackgroundContainer>
          <LoadingScreen message="Setting up DreamWeaver..." transparent />
        </BackgroundContainer>
      );

    case AuthStatus.UNAUTHENTICATED:
      logger.debug("Redirecting to login (unauthenticated)");
      return (
        <BackgroundContainer>
          <Redirect href="/(auth)/login" />
        </BackgroundContainer>
      );

    case AuthStatus.UNVERIFIED:
      logger.debug("Redirecting to verify-email (unverified)");
      return (
        <BackgroundContainer>
          <Redirect href="/(auth)/verify-email" />
        </BackgroundContainer>
      );

    case AuthStatus.REFERRAL_ENTRY:
      logger.debug(
        "Redirecting to referral-code-entry (referral entry needed)"
      );
      return (
        <BackgroundContainer>
          <Redirect href="/referral-code-entry" />
        </BackgroundContainer>
      );

    case AuthStatus.ONBOARDING:
      logger.debug("Showing WelcomeOnboarding (onboarding required)");
      if (isCompletingOnboarding) {
        return (
          <BackgroundContainer>
            <LoadingScreen message="Completing setup..." transparent />
          </BackgroundContainer>
        );
      }
      return (
        <BackgroundContainer>
          <WelcomeOnboarding
            visible={true}
            onComplete={handleOnboardingComplete}
            justAppliedReferral={justAppliedReferral}
          />
        </BackgroundContainer>
      );

    case AuthStatus.AUTHENTICATED:
      logger.debug("Redirecting to tabs (authenticated)");
      return (
        <BackgroundContainer>
          <Redirect href="/(tabs)" />
        </BackgroundContainer>
      );

    default:
      // Fallback for any edge cases - should never happen
      logger.warn("Unknown auth status, falling back to loading", {
        authStatus,
      });
      return (
        <BackgroundContainer>
          <LoadingScreen message="Loading..." transparent />
        </BackgroundContainer>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
