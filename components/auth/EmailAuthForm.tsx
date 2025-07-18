import React, { useState } from "react";
import { Alert, Dimensions, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "../../constants/Theme";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface EmailAuthFormProps {
  mode: "signin" | "signup";
  onToggleMode: () => void;
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({
  mode,
  onToggleMode,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { emailSignIn, emailSignUp, loading, error } = useAuth();

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }

    if (mode === "signup") {
      if (!displayName.trim()) {
        Alert.alert("Error", "Please enter your name");
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (mode === "signin") {
        await emailSignIn({ email, password });
      } else {
        await emailSignUp({ email, password, displayName });
      }
    } catch (err) {
      // Error is already handled in useAuth hook
      console.error("Auth error:", err);
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
            onChangeText={setDisplayName}
            leftIcon="person.fill"
            autoCapitalize="words"
          />
        )}

        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="envelope.fill"
        />

        <Input
          label="Password"
          placeholder={
            mode === "signin" ? "Enter your password" : "Create a password"
          }
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon="lock.fill"
        />

        {mode === "signup" && (
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon="lock.fill"
          />
        )}

        <Button
          title={mode === "signin" ? "Sign in" : "Create account"}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />

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
  },
  form: {
    width: "100%",
    gap: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
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
