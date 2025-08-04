import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppleSignInButton } from "../../components/auth/AppleSignInButton";
import { EmailAuthForm } from "../../components/auth/EmailAuthForm";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function LoginScreen() {
  const { googleSignIn, appleSignIn, loading, error, user } = useAuth();
  
  // Don't auto-show email form on social sign-in errors
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailAuthMode, setEmailAuthMode] = useState<"signin" | "signup">(
    "signin"
  );

  // Clear error when component mounts or when switching auth methods
  useEffect(() => {
    const { setError } = useAuthStore.getState();
    setError(null);
  }, []);

  // Redirect to main app if user is already authenticated
  if (user) {
    return <Redirect href="/" />;
  }

  const handleGoogleSignIn = async () => {
    // Clear any existing errors before attempting sign in
    const { setError } = useAuthStore.getState();
    setError(null);
    
    try {
      await googleSignIn();
    } catch (error) {
      Alert.alert(
        "Sign In Failed",
        "There was an error signing in with Google. Please try again."
      );
    }
  };

  const handleAppleSignIn = async () => {
    // Clear any existing errors before attempting sign in
    const { setError } = useAuthStore.getState();
    setError(null);
    
    try {
      await appleSignIn();
    } catch (error) {
      Alert.alert(
        "Sign In Failed",
        "There was an error signing in with Apple. Please try again."
      );
    }
  };

  const handleEmailToggle = () => {
    setShowEmailForm(!showEmailForm);
    // Clear error when toggling away from email form
    if (showEmailForm && error) {
      const { setError } = useAuthStore.getState();
      setError(null);
    }
  };

  const handleEmailModeToggle = () => {
    setEmailAuthMode(emailAuthMode === "signin" ? "signup" : "signin");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/background-landscape.png")}
      resizeMode={isTablet ? "cover" : "none"}
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.header}>
              <Text style={styles.appName}>DreamWeaver</Text>
              <Text style={styles.tagline}>
                Magical bedtime stories, created just for your little ones
              </Text>
            </View>

            <View style={styles.authContainer}>
              {!showEmailForm ? (
                <>
                  <View style={styles.socialButtons}>
                    <GoogleSignInButton
                      onPress={handleGoogleSignIn}
                      loading={loading}
                    />

                    <AppleSignInButton
                      onPress={handleAppleSignIn}
                      loading={loading}
                    />
                  </View>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.emailButton}>
                    <Text
                      style={styles.emailButtonText}
                      onPress={handleEmailToggle}
                    >
                      Continue with email
                    </Text>
                  </View>
                </>
              ) : (
                <EmailAuthForm
                  mode={emailAuthMode}
                  onToggleMode={handleEmailModeToggle}
                />
              )}

              {showEmailForm && (
                <View style={styles.backButton}>
                  <Text
                    style={styles.backButtonText}
                    onPress={handleEmailToggle}
                  >
                    ← Back to other options
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: isTablet ? Spacing.massive : Spacing.xxxl,
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
    marginBottom: Spacing.md,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: isTablet ? Typography.fontSize.large : Typography.fontSize.medium,
    color: Colors.text,
    textAlign: "center",
    lineHeight: isTablet ? 28 : 24,
    maxWidth: isTablet ? 400 : 300,
    opacity: 0.9,
  },
  authContainer: {
    width: "100%",
    maxWidth: isTablet ? 500 : 400,
    alignSelf: "center",
    backgroundColor: Platform.select({
      ios: "rgba(255, 255, 255, 0.03)",
      android: "rgba(26, 27, 58, 0.8)", // More opaque background for Android elevation
    }),
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    padding: isTablet ? Spacing.xxxl : Spacing.xxl,
  },
  welcomeText: {
    fontSize: isTablet ? Typography.fontSize.h2 : Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textAlign: "center",
    marginBottom: isTablet ? Spacing.xxxl : Spacing.xxl,
    fontFamily: Typography.fontFamily.primary,
  },
  socialButtons: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
  },
  dividerText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.lg,
    fontWeight: Typography.fontWeight.medium,
  },
  emailButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    ...Shadows.glow,
  },
  emailButtonText: {
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  backButton: {
    alignItems: "center",
    marginTop: Spacing.xxl,
  },
  backButtonText: {
    fontSize: Typography.fontSize.small,
    color: Colors.primary,
    textDecorationLine: "underline",
    opacity: 0.8,
  },
  footer: {
    marginTop: isTablet ? Spacing.massive : Spacing.huge,
    alignItems: "center",
  },
  footerText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: isTablet ? 400 : 300,
  },
});
