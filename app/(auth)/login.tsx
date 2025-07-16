import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import { AppleSignInButton } from "../../components/auth/AppleSignInButton";
import { EmailAuthForm } from "../../components/auth/EmailAuthForm";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailAuthMode, setEmailAuthMode] = useState<"signin" | "signup">(
    "signin"
  );

  const { googleSignIn, appleSignIn, loading } = useAuth();

  const handleGoogleSignIn = async () => {
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
  };

  const handleEmailModeToggle = () => {
    setEmailAuthMode(emailAuthMode === "signin" ? "signup" : "signin");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
              <Text style={styles.welcomeText}>Welcome to DreamWeaver</Text>

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
                  Continue with Email
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
              <Text style={styles.backButtonText} onPress={handleEmailToggle}>
                ← Back to other options
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEFEFE",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#6366F1",
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
  authContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 32,
  },
  socialButtons: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginHorizontal: 16,
  },
  emailButton: {
    borderWidth: 2,
    borderColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366F1",
  },
  backButton: {
    alignItems: "center",
    marginTop: 24,
  },
  backButtonText: {
    fontSize: 14,
    color: "#6366F1",
    textDecorationLine: "underline",
  },
  footer: {
    marginTop: 48,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
});
