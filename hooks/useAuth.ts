import { useCallback, useEffect, useRef, useState } from "react";
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
import { logger } from "../utils/logger";
import { useAuthStore } from "../store/authStore";
import { OnboardingService } from "../services/auth/onboardingService";
import {
  AuthStatus,
  LoginCredentials,
  SignUpCredentials,
} from "../types/auth.types";
import { getAuthErrorMessage } from "../utils/authErrorMessages";

/**
 * Helper function to manually update auth state after successful auth operations
 * This eliminates the need for arbitrary delays by immediately updating the store
 */
const updateAuthStateFromFirebase = async () => {
  try {
    const { authService } = await import("@/services/firebase/config");
    const currentFirebaseUser = authService.currentUser;

    if (currentFirebaseUser) {
      logger.debug("Updating auth state from Firebase user", {
        userEmail: currentFirebaseUser.email,
        userVerified: currentFirebaseUser.emailVerified,
      });

      // Convert Firebase user to our User type
      const user = {
        uid: currentFirebaseUser.uid,
        email: currentFirebaseUser.email,
        displayName: currentFirebaseUser.displayName,
        emailVerified: currentFirebaseUser.emailVerified,
        photoURL: currentFirebaseUser.photoURL,
        createdAt: new Date(),
      };

      // Update store and trigger auth status computation
      const {
        setUser,
        setLoading,
        initializeAuthStatus,
        debouncedComputeAuthStatus,
      } = useAuthStore.getState();

      // Set both user and loading state
      setUser(user);
      setLoading(false);

      // Wait for initialization to complete, then compute status
      await initializeAuthStatus();
      debouncedComputeAuthStatus();

      return user;
    }

    return null;
  } catch (error) {
    logger.error("Error updating auth state from Firebase", error);
    throw error;
  }
};

// Initialization state management - more testable than global flags
class AuthInitializationManager {
  private static instance: AuthInitializationManager;
  private googleInitialized = false;
  private storeInitialized = false;

  static getInstance(): AuthInitializationManager {
    if (!this.instance) {
      this.instance = new AuthInitializationManager();
    }
    return this.instance;
  }

  // For testing purposes
  static resetInstance(): void {
    this.instance = new AuthInitializationManager();
  }

  isGoogleInitialized(): boolean {
    return this.googleInitialized;
  }

  setGoogleInitialized(): void {
    this.googleInitialized = true;
  }

  isStoreInitialized(): boolean {
    return this.storeInitialized;
  }

  setStoreInitialized(): void {
    this.storeInitialized = true;
  }
}

// Helper function to check if this is a test account
export const isTestAccount = (email: string | null | undefined): boolean => {
  if (!email || !__DEV__) return false;

  // Use the centralized, secure test account detection
  const {
    isTestAccount: centralIsTestAccount,
  } = require("../constants/AuthConstants");
  return centralIsTestAccount(email);
};

// Lightweight hook for root layout - only initializes, doesn't subscribe to loading
export const useAuthInitialization = () => {
  const initManager = AuthInitializationManager.getInstance();

  // Use a simple approach - always return false for loading after initialization
  useEffect(() => {
    // Only run once
    if (initManager.isStoreInitialized()) {
      return;
    }

    // Only configure Google Sign-In once globally
    if (!initManager.isGoogleInitialized()) {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      if (webClientId) {
        configureGoogleSignIn(webClientId);
        initManager.setGoogleInitialized();
      }
    }

    // Initialize auth state listener
    const { initialize, isInitialized } = useAuthStore.getState();
    if (!isInitialized) {
      initialize();
    }

    initManager.setStoreInitialized();
  }, []); // Empty deps - only run once

  // Always return false for loading - the auth status will handle loading states
  return { loading: false };
};

export const useAuth = () => {
  const {
    user,
    loading,
    error,
    authStatus,
    hasCompletedOnboarding,
    initialize,
    setError,
    signOut,
    authLoading,
    setAuthLoading,
    isInitialized,
    setOnboardingStatus,
  } = useAuthStore();

  // Removed circular dependency with children store
  // Onboarding status is now determined purely from Firestore data

  const emailSignIn = async (credentials: LoginCredentials) => {
    try {
      setAuthLoading(true);
      setError(null);
      await signInWithEmail(credentials);

      // Immediately update auth state from Firebase (no delays)
      logger.debug("Email sign-in completed, updating auth state");
      await updateAuthStateFromFirebase();
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

      // Immediately update auth state from Firebase (no delays)
      logger.debug("Email sign-up completed, updating auth state");
      await updateAuthStateFromFirebase();
    } catch (error) {
      setError(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const googleSignIn = async () => {
    try {
      logger.debug("Starting Google sign in");
      setAuthLoading(true);
      setError(null);
      await signInWithGoogle();

      // Immediately update auth state from Firebase (no delays)
      logger.debug("Google sign-in completed, updating auth state");
      await updateAuthStateFromFirebase();
    } catch (error) {
      logger.error("Google sign in error", error);
      setError(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
      logger.debug("Google sign in finished (authLoading = false)");
    }
  };

  const appleSignIn = async () => {
    try {
      setAuthLoading(true);
      setError(null);
      await signInWithApple();

      // Immediately update auth state from Firebase (no delays)
      logger.debug("Apple sign-in completed, updating auth state");
      await updateAuthStateFromFirebase();
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

  const completeOnboarding = async () => {
    if (!user?.uid) {
      throw new Error("No authenticated user to complete onboarding for");
    }

    try {
      // Set the in-memory status first for immediate UI feedback
      setOnboardingStatus(true);

      // Use the onboarding service to persist to Firestore
      await OnboardingService.completeOnboarding(user.uid);

      // Force recomputation of auth status to trigger redirect
      const { debouncedComputeAuthStatus } = useAuthStore.getState();
      debouncedComputeAuthStatus();

      logger.debug("Onboarding completed successfully", { uid: user.uid });
    } catch (error) {
      logger.error("Error completing onboarding", { uid: user.uid, error });

      // Revert the in-memory status on error
      setOnboardingStatus(false);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    authLoading,
    authStatus,
    hasCompletedOnboarding,
    emailSignIn,
    emailSignUp,
    googleSignIn,
    appleSignIn,
    signOut,
    resendVerificationEmail,
    checkEmailVerified,
    deleteAccount: deleteUserAccount,
    sendPasswordReset,
    completeOnboarding,

    // Computed values for backwards compatibility
    isReady: authStatus !== AuthStatus.INITIALIZING,
    isAuthenticated: authStatus === AuthStatus.AUTHENTICATED,
    needsVerification: authStatus === AuthStatus.UNVERIFIED,
    needsOnboarding: authStatus === AuthStatus.ONBOARDING,
    isUnauthenticated: authStatus === AuthStatus.UNAUTHENTICATED,
  };
};
