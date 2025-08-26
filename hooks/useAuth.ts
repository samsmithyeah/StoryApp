import { useEffect } from "react";
import {
  checkEmailVerified,
  configureGoogleSignIn,
  deleteAccount,
  resendVerificationEmail,
  resetPassword,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "../services/firebase/auth";
import { useAuthStore } from "../store/authStore";
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
    // Password reset errors
    case "auth/user-not-found":
      return "No account found with this email address.";
    default:
      // If it's a custom error message that's already user-friendly, return it
      if (
        error?.message &&
        !error.message.includes("auth/") &&
        !error.message.includes("Firebase")
      ) {
        return error.message;
      }
      // Generic fallback
      return "An error occurred. Please try again.";
  }
};

// Global initialization flag
let globalAuthInitialized = false;

export const useAuth = () => {
  const {
    user,
    loading,
    error,
    initialize,
    setError,
    signOut,
    authLoading,
    setAuthLoading,
    isInitialized,
  } = useAuthStore();

  useEffect(() => {
    // Only configure Google Sign-In once globally
    if (!globalAuthInitialized) {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (webClientId) {
        configureGoogleSignIn(webClientId);
        globalAuthInitialized = true;
      }
    }

    // Initialize auth state listener only if not already initialized
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

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
      console.log("[AUTH] Starting Google sign in");
      setAuthLoading(true);
      setError(null);
      await signInWithGoogle();
      console.log("[AUTH] Google sign in completed");
    } catch (error) {
      console.log("[AUTH] Google sign in error:", error);
      setError(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
      console.log("[AUTH] Google sign in finished (authLoading = false)");
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

  const deleteUserAccount = async () => {
    try {
      setAuthLoading(true);
      setError(null);
      await deleteAccount();

      // Add a delay to allow the cloud function to complete
      // console.log('[AUTH] Waiting for account deletion to complete...');
      // await new Promise(resolve => setTimeout(resolve, 2000));

      // // Check if user is still authenticated (shouldn't be after deletion)
      // const currentUser = authService.currentUser;
      // if (currentUser) {
      //   console.log('[AUTH] User still exists after deletion, manually signing out');
      //   await signOut();
      // } else {
      //   console.log('[AUTH] User successfully deleted');
      // }
    } catch (error) {
      setError(getAuthErrorMessage(error));
      throw error; // Re-throw so the UI can handle the error
    } finally {
      setAuthLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      setAuthLoading(true);
      setError(null);
      await resetPassword(email);
    } catch (error) {
      setError(getAuthErrorMessage(error));
      throw error;
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
    resendVerificationEmail,
    checkEmailVerified,
    deleteAccount: deleteUserAccount,
    sendPasswordReset,
  };
};
