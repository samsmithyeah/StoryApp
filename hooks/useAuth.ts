import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
  configureGoogleSignIn,
} from "../services/firebase/auth";
import { LoginCredentials, SignUpCredentials } from "../types/auth.types";

// Map Firebase error codes to user-friendly messages
const getAuthErrorMessage = (error: any): string => {
  const errorCode = error?.code || error?.message || "";
  
  switch (errorCode) {
    // Email/Password errors
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "No account found with this email. Please check your email or sign up.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/email-already-in-use":
      return "An account already exists with this email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Please contact support.";
    case "auth/requires-recent-login":
      return "Please sign in again to complete this action.";
    case "auth/invalid-login-credentials":
      return "Invalid email or password. Please check your credentials and try again.";
    default:
      // If it's a custom error message that's already user-friendly, return it
      if (error?.message && !error.message.includes("auth/") && !error.message.includes("Firebase")) {
        return error.message;
      }
      // Generic fallback
      return "An error occurred. Please try again.";
  }
};

export const useAuth = () => {
  const { user, loading, error, initialize, setError, signOut, authLoading, setAuthLoading } =
    useAuthStore();

  useEffect(() => {
    // Configure Google Sign-In
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (webClientId) {
      configureGoogleSignIn(webClientId);
    }

    // Initialize auth state listener
    initialize();
  }, [initialize]);

  const emailSignIn = async (credentials: LoginCredentials) => {
    try {
      setAuthLoading(true);
      setError(null);
      await signInWithEmail(credentials);
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const emailSignUp = async (credentials: SignUpCredentials) => {
    try {
      setAuthLoading(true);
      setError(null);
      await signUpWithEmail(credentials);
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const googleSignIn = async () => {
    try {
      setAuthLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const appleSignIn = async () => {
    try {
      setAuthLoading(true);
      setError(null);
      await signInWithApple();
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    authLoading,
    emailSignIn,
    emailSignUp,
    googleSignIn,
    appleSignIn,
    signOut,
  };
};
