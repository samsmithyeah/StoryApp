import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { openInbox } from "react-native-email-link";
import {
  BorderRadius,
  Colors,
  isSmallScreen,
  isVerySmallScreen,
  Spacing,
  Typography,
} from "../../constants/Theme";
import {
  checkEmailVerified,
  resendVerificationEmail,
} from "../../services/firebase/auth";
import { useAuthStore } from "../../store/authStore";
import { logger } from "../../utils/logger";
import { IconSymbol } from "../ui/IconSymbol";

interface EmailVerificationBannerProps {
  onVerified?: () => void;
}

export const EmailVerificationBanner: React.FC<
  EmailVerificationBannerProps
> = ({ onVerified }) => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const { user, setUser, computeAuthStatus } = useAuthStore();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<string>(AppState.currentState);

  // Auto-check verification status
  const autoCheckVerification = useCallback(async () => {
    if (!user || user.emailVerified) return;

    try {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        logger.debug(
          "Email verification detected, updating user and auth status"
        );
        // Update user in store with verified status
        setUser({ ...user, emailVerified: true });
        // CRITICAL: Trigger immediate auth status recomputation for user-facing verification
        // Don't use debounced version here - user is waiting for feedback
        computeAuthStatus();
        setMessage("Email verified successfully! ✓");
        onVerified?.();
        // Clear any intervals
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      }
    } catch (error) {
      logger.debug("Auto-check verification failed", {
        error,
        userId: user?.uid,
      });
    }
  }, [user, setUser, onVerified, computeAuthStatus]);

  // Set up automatic checking
  useEffect(() => {
    if (!user || user.emailVerified) return;

    // Check immediately
    autoCheckVerification();

    // Set up periodic checking every 5 seconds
    checkIntervalRef.current = setInterval(() => {
      autoCheckVerification();
    }, 5000) as any;

    // Listen for app state changes (when user returns from email app)
    const handleAppStateChange = (nextAppState: string) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground, check verification
        autoCheckVerification();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      subscription?.remove();
    };
  }, [user, autoCheckVerification]);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    try {
      setSending(true);
      setMessage("");
      await resendVerificationEmail();
      setMessage("Verification email sent! Check your inbox.");
    } catch (error) {
      setMessage("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleOpenEmailApp = async () => {
    try {
      await openInbox();
    } catch (error) {
      setMessage("Unable to open email app. Please check your email manually.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <IconSymbol name="envelope.badge" size={28} color={Colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.description}>
          We've sent a verification email to {user.email}. Please check your
          inbox and click the verification link.
        </Text>

        <View style={styles.spamNotice}>
          <IconSymbol
            name="exclamationmark.triangle.fill"
            size={18}
            color={Colors.warning}
          />
          <Text style={styles.spamText}>
            Check your spam/junk folder if you don't see the email
          </Text>
        </View>

        {message ? (
          <Text
            style={[
              styles.message,
              message.includes("sent") ? styles.success : styles.error,
            ]}
          >
            {message}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={handleOpenEmailApp}>
            <IconSymbol name="envelope.fill" size={18} color={Colors.primary} />
            <Text style={styles.buttonText}>Open email app</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleResend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <>
                <IconSymbol
                  name="envelope"
                  size={18}
                  color={Colors.textSecondary}
                />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Resend email
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Using centralized responsive utilities from Theme.ts

const styles = StyleSheet.create({
  container: {
    paddingVertical: isVerySmallScreen()
      ? Spacing.sm
      : isSmallScreen()
        ? Spacing.lg
        : Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: isVerySmallScreen() ? 40 : isSmallScreen() ? 48 : 56,
    height: isVerySmallScreen() ? 40 : isSmallScreen() ? 48 : 56,
    borderRadius: isVerySmallScreen() ? 20 : isSmallScreen() ? 24 : 28,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: isVerySmallScreen()
      ? Spacing.md
      : isSmallScreen()
        ? Spacing.lg
        : Spacing.xl,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.large
      : isSmallScreen()
        ? Typography.fontSize.h4
        : Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: isVerySmallScreen() ? Spacing.xs : Spacing.sm,
    textAlign: "center",
  },
  description: {
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.tiny
      : isSmallScreen()
        ? Typography.fontSize.small
        : Typography.fontSize.medium,
    color: Colors.textSecondary,
    marginBottom: isVerySmallScreen()
      ? Spacing.md
      : isSmallScreen()
        ? Spacing.lg
        : Spacing.xl,
    lineHeight: isVerySmallScreen() ? 18 : isSmallScreen() ? 20 : 24,
    textAlign: "center",
  },
  autoCheckNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  autoCheckText: {
    fontSize: Typography.fontSize.small,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  spamNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: BorderRadius.medium,
    padding: isVerySmallScreen()
      ? Spacing.xs
      : isSmallScreen()
        ? Spacing.sm
        : Spacing.md,
    marginBottom: isVerySmallScreen()
      ? Spacing.md
      : isSmallScreen()
        ? Spacing.lg
        : Spacing.xl,
    gap: isVerySmallScreen() ? Spacing.xs : Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  spamText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.warning,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    lineHeight: 16,
  },
  message: {
    fontSize: Typography.fontSize.medium,
    marginBottom: Spacing.lg,
    textAlign: "center",
    fontWeight: Typography.fontWeight.medium,
  },
  success: {
    color: Colors.success,
  },
  error: {
    color: Colors.error,
  },
  actions: {
    width: "100%",
    gap: isVerySmallScreen()
      ? Spacing.xs
      : isSmallScreen()
        ? Spacing.sm
        : Spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: isVerySmallScreen()
      ? Spacing.sm
      : isSmallScreen()
        ? Spacing.md
        : Spacing.buttonPadding.horizontal,
    paddingVertical: isVerySmallScreen()
      ? Spacing.xs
      : isSmallScreen()
        ? Spacing.sm
        : Spacing.buttonPadding.vertical + 2,
    borderRadius: BorderRadius.medium,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: isVerySmallScreen() ? Spacing.xs : Spacing.sm,
    minHeight: isVerySmallScreen() ? 40 : isSmallScreen() ? 44 : 48,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(184, 184, 184, 0.3)",
  },
  buttonText: {
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.tiny
      : isSmallScreen()
        ? Typography.fontSize.small
        : Typography.fontSize.button,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
  },
});
