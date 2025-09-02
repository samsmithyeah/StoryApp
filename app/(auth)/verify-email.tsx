import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { EmailVerificationBanner } from "../../components/auth/EmailVerificationBanner";
import { Button } from "../../components/ui/Button";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useAuth } from "../../hooks/useAuth";
import { AuthStatus } from "../../types/auth.types";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;
const isVerySmallScreen = height < 700;

export default function VerifyEmailScreen() {
  const { signOut, authStatus } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Watch for auth status changes after verification
  useEffect(() => {
    if (authStatus !== AuthStatus.UNVERIFIED) {
      // Auth status has changed from UNVERIFIED - redirect to index to let it handle routing
      router.replace("/");
    }
  }, [authStatus]);

  const handleVerified = () => {
    // Show loading state during transition
    setIsTransitioning(true);
    // Don't redirect immediately - let the auth status change trigger the redirect
    // This allows the async deletion marker check to complete first
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  // Conditional wrapper component
  const WrapperComponent = Platform.OS === "ios" ? SafeAreaView : View;

  return (
    <WrapperComponent style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === "android" && {
            paddingTop: (RNStatusBar.currentHeight || 0) + Spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={styles.appName}>DreamWeaver</Text>
        </View>

        <View style={styles.authContainer}>
          {isTransitioning ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>
                Email verified! Redirecting...
              </Text>
            </View>
          ) : (
            <EmailVerificationBanner onVerified={handleVerified} />
          )}
        </View>

        <View style={styles.bottomActions}>
          <Button
            title="Sign out"
            onPress={handleSignOut}
            variant="danger"
            style={styles.signOutButton}
          />
        </View>
      </ScrollView>
    </WrapperComponent>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: isTablet
      ? Spacing.massive
      : isVerySmallScreen
        ? Spacing.xl
        : Spacing.xxxl,
    paddingBottom: Platform.OS === "ios" ? Spacing.xl : Spacing.massive,
  },
  header: {
    alignItems: "center",
    marginBottom: isTablet
      ? Spacing.massive
      : isVerySmallScreen
        ? Spacing.xl
        : Spacing.huge,
  },
  appName: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: isTablet
      ? Typography.fontSize.h1Tablet
      : isVerySmallScreen
        ? Typography.fontSize.h2
        : Typography.fontSize.h1Phone,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: isVerySmallScreen ? Spacing.lg : Spacing.xl,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: isTablet ? Typography.fontSize.h2 : Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: isTablet ? Typography.fontSize.medium : Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: isTablet ? 24 : 20,
  },
  authContainer: {
    width: "100%",
    maxWidth: isTablet ? 500 : 400,
    alignSelf: "center",
    backgroundColor: Platform.select({
      ios: "rgba(255, 255, 255, 0.03)",
      android: "rgba(26, 27, 58, 0.8)",
    }),
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    padding: isTablet
      ? Spacing.xxxl
      : isVerySmallScreen
        ? Spacing.lg
        : Spacing.xxl,
  },
  bottomActions: {
    paddingHorizontal: 0,
    paddingTop: isVerySmallScreen ? Spacing.md : Spacing.xl,
    paddingBottom: Spacing.sm,
    maxWidth: isTablet ? 500 : 400,
    width: "100%",
    alignSelf: "center",
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  infoTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  signOutButton: {
    width: "100%",
    borderColor: Colors.error,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: "center",
    fontFamily: Typography.fontFamily.primary,
  },
});
