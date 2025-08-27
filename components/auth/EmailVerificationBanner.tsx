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

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  description: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
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
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  spamText: {
    fontSize: Typography.fontSize.small,
    color: Colors.warning,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    lineHeight: 20,
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
    gap: Spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.buttonPadding.horizontal,
    paddingVertical: Spacing.buttonPadding.vertical + 2,
    borderRadius: BorderRadius.medium,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: Spacing.sm,
    minHeight: 48,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(184, 184, 184, 0.3)",
  },
  buttonText: {
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
  },
});
