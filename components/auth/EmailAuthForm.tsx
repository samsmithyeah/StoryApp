import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface EmailAuthFormProps {
  mode: "signin" | "signup";
  onToggleMode: () => void;
  onForgotPassword?: () => void;
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({
  mode,
  onToggleMode,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Validation error states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const { emailSignIn, emailSignUp, authLoading, error } = useAuth();

  // Clear errors when switching modes
  React.useEffect(() => {
    setEmailError("");
    setPasswordError("");
    setDisplayNameError("");
    setConfirmPasswordError("");
    // Clear form data when switching modes
    setEmail("");
    setPassword("");
    setDisplayName("");
    setConfirmPassword("");
  }, [mode]);

  // Clear global error when component mounts to avoid showing social sign-in errors
  React.useEffect(() => {
    const { setError } = useAuthStore.getState();
    setError(null);
  }, []);

  const validateForm = () => {
    let isValid = true;

    // Clear all errors first
    setEmailError("");
    setPasswordError("");
    setDisplayNameError("");
    setConfirmPasswordError("");

    if (!email.trim()) {
      setEmailError("Please enter your email address");
      isValid = false;
    } else if (!email.includes("@")) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Please enter your password");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      isValid = false;
    }

    if (mode === "signup") {
      if (!displayName.trim()) {
        setDisplayNameError("Please enter your name");
        isValid = false;
      }

      if (!confirmPassword.trim()) {
        setConfirmPasswordError("Please confirm your password");
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        isValid = false;
      }

      // Note: Referral code validation now happens server-side during signup
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (mode === "signin") {
      await emailSignIn({ email, password });
    } else {
      await emailSignUp({
        email,
        password,
        displayName,
      });
      // Success message will be handled by the redirect to verify-email screen
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        {mode === "signin"
          ? "Sign in to continue to DreamWeaver"
          : "Join DreamWeaver to start creating magical stories"}
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.form}>
        {mode === "signup" && (
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (displayNameError) setDisplayNameError("");
            }}
            leftIcon="person.fill"
            autoCapitalize="words"
            error={displayNameError}
          />
        )}

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

        <Input
          label="Password"
          placeholder={
            mode === "signin" ? "Enter your password" : "Create a password"
          }
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError("");
          }}
          secureTextEntry
          leftIcon="lock.fill"
          error={passwordError}
        />

        {mode === "signup" && (
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError("");
            }}
            secureTextEntry
            leftIcon="lock.fill"
            error={confirmPasswordError}
          />
        )}


        <View style={styles.submitButtonContainer}>
          <Button
            title={mode === "signin" ? "Sign in" : "Create account"}
            onPress={handleSubmit}
            loading={authLoading}
            style={styles.submitButton}
          />
          {mode === "signin" && onForgotPassword && (
            <Text style={styles.forgotPasswordLink} onPress={onForgotPassword}>
              Forgot password?
            </Text>
          )}
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {mode === "signin"
              ? "Don't have an account? "
              : "Already have an account? "}
          </Text>
          <Button
            title={mode === "signin" ? "Sign up" : "Sign in"}
            onPress={onToggleMode}
            variant="outline"
            size="small"
            style={styles.toggleButton}
          />
        </View>
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
  submitButtonContainer: {
    marginTop: Spacing.md,
    position: "relative",
  },
  submitButton: {
    width: "100%",
  },
  forgotPasswordLink: {
    fontSize: Typography.fontSize.small,
    color: Colors.primary,
    textDecorationLine: "underline",
    opacity: 0.8,
    position: "absolute",
    bottom: -Spacing.xxl,
    right: 0,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
    flexWrap: "wrap",
  },
  toggleText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  toggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minHeight: 32,
    marginBottom: Spacing.xs,
  },
});
