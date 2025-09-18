import {
  checkEmailVerified,
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
// Removed updateAuthStateFromFirebase function - auth state is now handled by authStore Firebase listener

export const useAuth = () => {
  const {
    user,
    loading,
    error,
    authStatus,
    hasCompletedOnboarding,
    setError,
    signOut,
    authLoading,
    setAuthLoading,
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
      logger.debug(
        "Email sign-in completed, auth state will be updated by Firebase listener"
      );
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
      logger.debug(
        "Email sign-up completed, auth state will be updated by Firebase listener"
      );
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

      // Auth state will be updated automatically by the Firebase auth listener in authStore
      logger.debug(
        "Google sign-in completed, auth state will be updated by Firebase listener"
      );
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

      // Auth state will be updated automatically by the Firebase auth listener in authStore
      logger.debug(
        "Apple sign-in completed, auth state will be updated by Firebase listener"
      );
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
    needsReferralEntry: authStatus === AuthStatus.REFERRAL_ENTRY,
    needsOnboarding: authStatus === AuthStatus.ONBOARDING,
    isUnauthenticated: authStatus === AuthStatus.UNAUTHENTICATED,
    setHasSeenReferralEntry: useAuthStore.getState().setHasSeenReferralEntry,
    setJustAppliedReferral: useAuthStore.getState().setJustAppliedReferral,
  };
};
