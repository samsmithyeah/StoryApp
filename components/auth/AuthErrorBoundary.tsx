import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { logger } from "@/utils/logger";
import { Colors, Typography, Spacing } from "@/constants/Theme";
import { useAuthStore, clearUserDataCache } from "@/store/authStore";
import { isFirebaseAuthError } from "@/types/auth.types";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  private mountedRef = { current: true };

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  componentWillUnmount() {
    this.mountedRef.current = false;
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error with context
    logger.error("Auth Error Boundary caught an error", error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: "AuthErrorBoundary",
    });
  }

  handleReset = async () => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: undefined });

    // Only reset auth state for auth-related errors, not general React errors
    const isAuthError =
      isFirebaseAuthError(this.state.error) ||
      this.state.error?.message?.toLowerCase().includes("auth") ||
      this.state.error?.name?.toLowerCase().includes("auth") ||
      this.state.error?.stack?.toLowerCase().includes("auth");

    if (isAuthError) {
      // Reset auth state to a safe state with comprehensive cleanup
      try {
        logger.debug(
          "AuthErrorBoundary: Starting auth reset for auth-related error"
        );

        // Clear user data cache
        clearUserDataCache();

        // Get auth store and attempt sign out with proper error handling
        const { signOut, initialize } = useAuthStore.getState();

        try {
          if (this.mountedRef.current) {
            await signOut();
            logger.debug("AuthErrorBoundary: Sign out completed successfully");
          }
        } catch (signOutError) {
          if (this.mountedRef.current) {
            logger.warn(
              "AuthErrorBoundary: Sign out failed, continuing with reset",
              signOutError
            );
          }
        }

        // Reinitialize auth system after cleanup
        try {
          if (this.mountedRef.current) {
            initialize();
            logger.debug("AuthErrorBoundary: Auth system reinitialized");
          }
        } catch (initError) {
          if (this.mountedRef.current) {
            logger.error(
              "AuthErrorBoundary: Failed to reinitialize auth system",
              initError
            );
          }
        }
      } catch (error) {
        if (this.mountedRef.current) {
          logger.error(
            "AuthErrorBoundary: Comprehensive auth reset failed",
            error
          );
        }
        // If all else fails, just continue - the app may still recover
      }
    } else {
      logger.debug(
        "AuthErrorBoundary: Non-auth error detected, skipping auth reset"
      );
      // For non-auth errors, just reset the boundary without signing out the user
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Authentication Error</Text>
            <Text style={styles.message}>
              Something went wrong with the authentication system. This is
              usually temporary and can be fixed by restarting.
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={styles.errorDetails}>
                Error: {this.state.error.message}
              </Text>
            )}
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Restart Authentication</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.screenPadding,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.lg,
    fontFamily: Typography.fontFamily.primary,
  },
  message: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
    fontFamily: Typography.fontFamily.primary,
  },
  errorDetails: {
    fontSize: Typography.fontSize.small,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
    fontFamily: Typography.fontFamily.secondary,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.text,
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
  },
});
