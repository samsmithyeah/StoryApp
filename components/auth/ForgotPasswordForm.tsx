import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useAuth } from "../../hooks/useAuth";
import { validateEmail } from "../../utils/validation";
import { logger } from "../../utils/logger";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const { sendPasswordReset, authLoading, error } = useAuth();

  const validateEmailInput = () => {
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setEmailError(validation.error || "Invalid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmailInput()) return;

    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (error) {
      // Error is already set in state by useAuth hook, but log for debugging
      logger.error("Password reset error", error, { email });
    }
  };

  if (resetSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Email sent!</Text>
          <Text style={styles.successMessage}>
            We've sent password reset instructions to{" "}
            <Text style={styles.emailText}>{email}</Text>. Please check your
            email and follow the link to reset your password.
          </Text>
          <Text style={styles.helpText}>
            Don't see the email? Check your spam folder or try again with a
            different email address.
          </Text>
          <Button
            title="Back to sign in"
            onPress={onBackToLogin}
            style={styles.backButton}
          />
          <Button
            title="Send another email"
            onPress={() => setResetSent(false)}
            variant="outline"
            style={styles.resendButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you instructions to reset your
        password.
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon="envelope.fill"
          error={emailError}
        />

        <Button
          title="Send reset email"
          onPress={handleSubmit}
          loading={authLoading}
          style={styles.submitButton}
        />

        <Button
          title="← Back to sign in"
          onPress={onBackToLogin}
          variant="secondary"
          style={styles.backToLoginButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  title: {
    fontSize: isTablet ? Typography.fontSize.h2 : Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.primary,
  },
  subtitle: {
    fontSize: isTablet ? Typography.fontSize.medium : Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: isTablet ? Spacing.xxxl : Spacing.xxl,
    lineHeight: isTablet ? 24 : 20,
    opacity: 0.9,
  },
  errorText: {
    fontSize: Typography.fontSize.small,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    overflow: "hidden",
  },
  form: {
    width: "100%",
    gap: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  backToLoginButton: {
    marginTop: Spacing.sm,
  },
  successContainer: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  successTitle: {
    fontSize: isTablet ? Typography.fontSize.h2 : Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success || Colors.primary,
    textAlign: "center",
    fontFamily: Typography.fontFamily.primary,
  },
  successMessage: {
    fontSize: isTablet ? Typography.fontSize.medium : Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: isTablet ? 24 : 20,
  },
  emailText: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  helpText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  backButton: {
    marginTop: Spacing.md,
  },
  resendButton: {
    marginTop: Spacing.sm,
  },
});
