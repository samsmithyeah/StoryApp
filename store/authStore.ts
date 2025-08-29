import { create } from "zustand";
import {
  subscribeToAuthChanges,
  signOutUser,
  checkDeletionMarker,
} from "../services/firebase/auth";
import { clearStorageUrlCaches } from "../hooks/useStorageUrl";
import { logger } from "../utils/logger";
import {
  AuthState,
  AuthStatus,
  User,
  hasFirebaseMetadata,
} from "../types/auth.types";
import { isTestAccount } from "../constants/AuthConstants";
import { CacheConfig } from "../constants/CacheConfig";
import { getAuthErrorMessage } from "../utils/authErrorMessages";
import { AuthCacheService } from "../services/auth/authCacheService";
import { OnboardingService } from "../services/auth/onboardingService";
import {
  AuthOperationService,
  executeAuthOperation,
} from "../services/auth/authOperationService";
import {
  AuthCleanupService,
  createDebouncedFunction,
} from "../services/auth/authCleanupService";

// Strongly typed store state
interface AuthStoreState extends AuthState {
  // Additional auth loading state for operations
  authLoading: boolean;

  // Initialization flags
  isInitialized: boolean;
  isInitializing: boolean;

  // Computed status timeout for debouncing
  computeAuthStatusTimeoutId: ReturnType<typeof setTimeout> | null;
}

// Strongly typed store actions
interface AuthStoreActions {
  // Core actions
  initialize: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthStatus: (status: AuthStatus) => void;
  setOnboardingStatus: (status: boolean) => void;
  setHasSeenReferralEntry: (seen: boolean) => void;
  setJustAppliedReferral: (applied: boolean) => void;
  signOut: () => Promise<void>;

  // Advanced operations
  initializeAuthStatus: () => Promise<void>;
  computeAuthStatus: () => void;
  debouncedComputeAuthStatus: () => void;

  // Utility
  cleanup: () => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

// Create debounced auth status computation
const createDebouncedAuthStatusComputation = (store: {
  getState: () => AuthStore;
}) =>
  createDebouncedFunction(() => {
    store.getState().computeAuthStatus();
  }, CacheConfig.AUTH_DEBOUNCE_MS);

export const useAuthStore = create<AuthStore>((set, get) => {
  // Create debounced function for this store instance
  const debouncedComputeAuthStatus = createDebouncedAuthStatusComputation({
    getState: get,
  });

  return {
    // Initial state
    user: null,
    loading: true,
    error: null,
    authStatus: AuthStatus.INITIALIZING,
    hasCompletedOnboarding: null,
    authLoading: false,
    isInitialized: false,
    isInitializing: false,
    computeAuthStatusTimeoutId: null,

    // Basic setters
    setUser: (user: User | null) => {
      const currentState = get();
      // Clear error when successfully authenticated
      if (user && currentState.error) {
        set({ user, error: null });
      } else {
        set({ user });
      }
    },

    setLoading: (loading: boolean) => set({ loading }),
    setError: (error: string | null) => set({ error }),
    setAuthLoading: (authLoading: boolean) => set({ authLoading }),
    setAuthStatus: (authStatus: AuthStatus) => {
      const currentStatus = get().authStatus;
      if (currentStatus !== authStatus) {
        logger.debug("Auth status changed", {
          from: currentStatus,
          to: authStatus,
        });
        set({ authStatus });
      }
    },
    setOnboardingStatus: (hasCompletedOnboarding: boolean) => {
      set({ hasCompletedOnboarding });
    },

    setHasSeenReferralEntry: (seen: boolean) => {
      const currentUser = get().user;
      if (currentUser) {
        set({
          user: {
            ...currentUser,
            hasSeenReferralEntry: seen,
          },
        });
        // Recompute auth status after marking referral entry as seen
        get().debouncedComputeAuthStatus();
      }
    },

    setJustAppliedReferral: (applied: boolean) => {
      set({ justAppliedReferral: applied });
    },

    // Initialize auth system
    initialize: () => {
      const currentState = get();
      if (currentState.isInitialized || currentState.isInitializing) {
        logger.debug("Auth already initialized or initializing");
        return;
      }

      set({ isInitializing: true });
      logger.debug("Initializing auth system");

      try {
        // Set up Firebase auth listener
        const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
          executeAuthOperation(
            "firebase_auth_change",
            async () => {
              if (firebaseUser) {
                // Fetch Firestore user data to get admin status and other fields
                let firestoreUserData = null;
                try {
                  firestoreUserData = await AuthCacheService.getUserData(
                    firebaseUser.uid
                  );
                } catch (error) {
                  logger.warn(
                    "Failed to fetch Firestore user data during auth change",
                    error
                  );
                }

                // Safely handle Firebase user metadata
                const metadata = hasFirebaseMetadata(firebaseUser)
                  ? firebaseUser.metadata
                  : undefined;
                const creationTime = metadata?.creationTime;

                const user: User = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  emailVerified: firebaseUser.emailVerified,
                  createdAt: creationTime ? new Date(creationTime) : new Date(),
                  isAdmin: firestoreUserData?.isAdmin || false,
                };

                logger.debug("Firebase user authenticated", {
                  uid: user.uid,
                  email: user.email,
                  verified: user.emailVerified,
                  isAdmin: user.isAdmin,
                });

                set({ user, loading: false });

                get().initializeAuthStatus();
              } else {
                logger.debug("Firebase user signed out");
                set({
                  user: null,
                  loading: false,
                  hasCompletedOnboarding: null,
                  authStatus: AuthStatus.UNAUTHENTICATED,
                });
              }
            },
            undefined,
            (error) => {
              logger.error("Firebase auth state change error", error);
              set({ error: getAuthErrorMessage(error), loading: false });
            }
          );
        });

        // Register cleanup for auth listener
        AuthCleanupService.registerCleanupCallback(unsubscribe);

        set({ isInitialized: true, isInitializing: false });
        logger.debug("Auth system initialized");
      } catch (error) {
        logger.error("Failed to initialize auth system", error);
        set({
          error: getAuthErrorMessage(error),
          isInitializing: false,
          loading: false,
        });
      }
    },

    // Initialize auth status based on current user
    initializeAuthStatus: async () => {
      const currentState = get();
      const startingUser = currentState.user;

      if (!startingUser) {
        set({ hasCompletedOnboarding: false });
        get().debouncedComputeAuthStatus();
        return;
      }

      logger.debug("Initializing auth status", { uid: startingUser.uid });

      await executeAuthOperation(
        "initialize_auth_status",
        async () => {
          const result =
            await OnboardingService.checkOnboardingWithErrorHandling(
              startingUser,
              currentState.hasCompletedOnboarding
            );

          // Only update if operation is still current
          const finalState = get();
          if (finalState.user?.uid === startingUser.uid) {
            set({ hasCompletedOnboarding: result.hasCompletedOnboarding });
            logger.debug("Auth status initialized", {
              uid: startingUser.uid,
              hasCompletedOnboarding: result.hasCompletedOnboarding,
              reason: result.reason,
            });
          }

          return result;
        },
        undefined,
        (error) => {
          logger.error("Failed to initialize auth status", {
            uid: startingUser.uid,
            error,
          });
          // Don't set error state for initialization failures - just keep status as null
        }
      );

      // Always trigger computation to ensure we don't get stuck
      get().debouncedComputeAuthStatus();
    },

    // Compute current auth status based on state
    computeAuthStatus: () => {
      const { user, loading, hasCompletedOnboarding, setAuthStatus } = get();

      logger.debug("Computing auth status", {
        hasUser: !!user,
        loading,
        emailVerified: user?.emailVerified,
        hasCompletedOnboarding,
        hasSeenReferralEntry: user?.hasSeenReferralEntry,
        userEmail: user?.email,
      });

      if (loading || hasCompletedOnboarding === null) {
        setAuthStatus(AuthStatus.INITIALIZING);
        return;
      }

      if (!user) {
        setAuthStatus(AuthStatus.UNAUTHENTICATED);
        return;
      }

      const isCurrentUserTestAccount =
        __DEV__ && user.email?.includes("@test.dreamweaver");

      if (
        !user.emailVerified &&
        !isTestAccount(user.email) &&
        !isCurrentUserTestAccount
      ) {
        setAuthStatus(AuthStatus.UNVERIFIED);
        return;
      }

      // Check if user needs to see referral entry screen
      // For all verified signups (email, Google, Apple) and test accounts
      const isVerifiedOrTestUser =
        user.emailVerified || isCurrentUserTestAccount;

      if (
        isVerifiedOrTestUser &&
        !user.hasSeenReferralEntry &&
        !hasCompletedOnboarding
      ) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isRecentSignup =
          user.createdAt && user.createdAt > fiveMinutesAgo;

        // Show referral entry for all recent signups (email, Google, Apple) or test accounts
        if (isRecentSignup || isCurrentUserTestAccount) {
          // Check if user has a deletion marker (returning user)
          if (user.email) {
            checkDeletionMarker(user.email)
              .then((hasMarker) => {
                if (hasMarker) {
                  logger.debug(
                    "User has deletion marker - skipping referral entry",
                    {
                      userId: user.uid,
                    }
                  );
                  // Mark as seen and skip to onboarding
                  const currentState = get();
                  if (currentState.user?.uid === user.uid) {
                    set({
                      user: {
                        ...currentState.user,
                        hasSeenReferralEntry: true,
                      },
                    });
                    // Recompute auth status after updating the user
                    currentState.computeAuthStatus();
                  }
                } else {
                  // No deletion marker - show referral entry
                  const currentState = get();
                  if (currentState.user?.uid === user.uid) {
                    setAuthStatus(AuthStatus.REFERRAL_ENTRY);
                  }
                }
              })
              .catch((error) => {
                logger.error(
                  "Error checking deletion marker during auth status computation",
                  error
                );
                // On error, show referral entry as fallback
                const currentState = get();
                if (currentState.user?.uid === user.uid) {
                  setAuthStatus(AuthStatus.REFERRAL_ENTRY);
                }
              });
            return;
          } else {
            // No email available - show referral entry as fallback
            setAuthStatus(AuthStatus.REFERRAL_ENTRY);
            return;
          }
        }
      }

      if (!hasCompletedOnboarding) {
        setAuthStatus(AuthStatus.ONBOARDING);
        return;
      }

      setAuthStatus(AuthStatus.AUTHENTICATED);
    },

    // Debounced version of computeAuthStatus
    debouncedComputeAuthStatus,

    // Sign out user
    signOut: async () => {
      logger.debug("Starting sign out process");

      const success = await executeAuthOperation(
        "sign_out",
        async () => {
          // Clear all caches and URLs first
          clearStorageUrlCaches();
          AuthCacheService.clearAll();

          // Sign out from Firebase
          await signOutUser();

          // Reset state
          set({
            user: null,
            loading: false,
            error: null,
            authStatus: AuthStatus.UNAUTHENTICATED,
            hasCompletedOnboarding: null,
          });

          logger.debug("Sign out completed");
          return true;
        },
        undefined,
        (error) => {
          logger.error("Sign out failed", error);
          set({ error: getAuthErrorMessage(error) });
        }
      );

      if (!success) {
        throw new Error("Sign out failed");
      }
    },

    // Complete cleanup
    cleanup: () => {
      logger.debug("Cleaning up auth store");

      // Cancel any pending debounced operations
      debouncedComputeAuthStatus.cancel();

      // Clear current operation
      AuthOperationService.clearCurrentOperation();

      // Clean up all managed resources
      AuthCleanupService.cleanupAll();

      // Clear caches
      AuthCacheService.clearAll();

      // Reset state
      set({
        user: null,
        loading: true,
        error: null,
        authStatus: AuthStatus.INITIALIZING,
        hasCompletedOnboarding: null,
        authLoading: false,
        isInitialized: false,
        isInitializing: false,
        computeAuthStatusTimeoutId: null,
      });

      logger.debug("Auth store cleanup completed");
    },
  };
});

// Export cache clearing function for external use
export const clearUserDataCache = (uid?: string) => {
  if (uid) {
    AuthCacheService.invalidateUser(uid);
  } else {
    AuthCacheService.clearAll();
  }
};
