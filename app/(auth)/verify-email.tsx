import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  ImageBackground,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
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

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function VerifyEmailScreen() {
  const { signOut } = useAuth();

  const handleVerified = () => {
    // Redirect to home after verification
    router.replace("/");
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  // Conditional wrapper component
  const WrapperComponent = Platform.OS === "ios" ? SafeAreaView : View;

  return (
    <>
      <ImageBackground
        source={require("../../assets/images/background-landscape.png")}
        resizeMode={isTablet ? "cover" : "none"}
        style={styles.container}
      >
        <LinearGradient
          colors={[
            Colors.backgroundGradientStart,
            Colors.backgroundGradientEnd,
          ]}
          style={StyleSheet.absoluteFill}
        />

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
            bounces={false}
          >
            <View style={styles.header}>
              <Text style={styles.appName}>DreamWeaver</Text>
            </View>

            <View style={styles.authContainer}>
              <EmailVerificationBanner onVerified={handleVerified} />
            </View>
          </ScrollView>

          <View style={styles.bottomActions}>
            <Button
              title="Sign out"
              onPress={handleSignOut}
              variant="danger"
              style={styles.signOutButton}
            />
          </View>
        </WrapperComponent>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: isTablet ? Spacing.massive : Spacing.xxxl,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: isTablet ? Spacing.massive : Spacing.huge,
  },
  appName: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: isTablet
      ? Typography.fontSize.h1Tablet
      : Typography.fontSize.h1Phone,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xl,
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
    padding: isTablet ? Spacing.xxxl : Spacing.xxl,
  },
  bottomActions: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Platform.OS === "ios" ? Spacing.xl : Spacing.massive,
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
});
