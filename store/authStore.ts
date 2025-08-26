import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { subscribeToAuthChanges } from "../services/firebase/auth";
import { logger } from "../utils/logger";
import { AuthState, User } from "../types/auth.types";

const ONBOARDING_KEY = "user_onboarded";

export enum AuthStatus {
  INITIALIZING = "initializing",
  UNAUTHENTICATED = "unauthenticated",
  UNVERIFIED = "unverified",
  ONBOARDING = "onboarding",
  AUTHENTICATED = "authenticated",
}

interface AuthStore extends AuthState {
  initialize: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => Promise<void>;
  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;
  validateAuthState: () => boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  unsubscribe: (() => void) | null;
  authStatus: AuthStatus;
  onboardingLoading: boolean;
  hasCompletedOnboarding: boolean | null;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  updateAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  authLoading: false,
  isInitialized: false,
  isInitializing: false,
  unsubscribe: null,
  authStatus: AuthStatus.INITIALIZING,
  onboardingLoading: true,
  hasCompletedOnboarding: null,

  initialize: () => {
    // Prevent concurrent initialization
    if (get().isInitializing || get().isInitialized) {
      return;
    }

    // Mark as initializing
    set({ isInitializing: true });

    // Clean up any existing subscription
    const existingUnsubscribe = get().unsubscribe;
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    const unsubscribe = subscribeToAuthChanges(async (user) => {
      const currentState = get();
      const { validateAuthState, updateAuthStatus } = get();

      // Validate auth state before updating
      if (!validateAuthState()) {
        logger.warn("Auth state validation failed, resetting to safe state");
        set({
          user: null,
          loading: false,
          error: "Authentication state corrupted",
          authStatus: AuthStatus.UNAUTHENTICATED,
        });
        return;
      }

      logger.debug("Received user from auth service", {
        displayName: user?.displayName,
        email: user?.email,
        uid: user?.uid,
      });

      // Update user and loading state
      if (user && currentState.error) {
        set({ user, loading: false, error: null });
      } else {
        set({ user, loading: false });
      }

      // Update centralized auth status
      await updateAuthStatus();
    });

    // Store the unsubscribe function for cleanup and mark as initialized
    set({ unsubscribe, isInitialized: true, isInitializing: false });
  },

  setUser: (user) => set({ user }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setAuthLoading: (loading) => set({ authLoading: loading }),

  signOut: async () => {
    try {
      logger.debug("Starting sign out process");
      set({ loading: true, error: null });
      const { signOutUser } = await import("../services/firebase/auth");
      await signOutUser();
      logger.debug("Sign out completed, clearing user state");
      set({
        user: null,
        loading: false,
        authLoading: false,
        authStatus: AuthStatus.UNAUTHENTICATED,
        hasCompletedOnboarding: null,
        onboardingLoading: false,
      });
    } catch (error) {
      logger.error("Sign out error", error);
      set({
        error: error instanceof Error ? error.message : "Sign out failed",
        loading: false,
        authLoading: false,
      });
    }
  },

  validateAuthState: () => {
    const state = get();

    // Check for invalid state combinations and potential corruption
    if (state.user && state.loading) {
      // User is authenticated but still loading - suspicious
      logger.warn("Invalid state: user authenticated but still loading");
      return false;
    }

    if (state.user && !state.user.uid) {
      // User object exists but missing required uid
      logger.warn("Invalid state: user object missing uid");
      return false;
    }

    if (state.user && (!state.user.email || !state.user.email.includes("@"))) {
      // User object exists but has invalid email
      logger.warn("Invalid state: user object has invalid email");
      return false;
    }

    // Check for memory corruption indicators
    if (
      typeof state.loading !== "boolean" ||
      typeof state.authLoading !== "boolean"
    ) {
      logger.warn("Invalid state: loading flags are not boolean");
      return false;
    }

    if (state.error !== null && typeof state.error !== "string") {
      logger.warn("Invalid state: error is not null or string");
      return false;
    }

    return true;
  },

  completeOnboarding: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      await AsyncStorage.setItem(onboardingKey, "true");
      set({ hasCompletedOnboarding: true });

      // Update auth status
      const { updateAuthStatus } = get();
      await updateAuthStatus();
    } catch (error) {
      logger.error("Error saving onboarding completion", error);
      // Still mark as completed in state even if saving fails
      set({ hasCompletedOnboarding: true });
      const { updateAuthStatus } = get();
      await updateAuthStatus();
    }
  },

  resetOnboarding: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
      await AsyncStorage.removeItem(onboardingKey);
      set({ hasCompletedOnboarding: false });

      // Update auth status
      const { updateAuthStatus } = get();
      await updateAuthStatus();
    } catch (error) {
      logger.error("Error resetting onboarding", error);
    }
  },

  updateAuthStatus: async () => {
    const { user, onboardingLoading } = get();

    // Still loading auth or onboarding data
    if (!user && get().loading) {
      set({ authStatus: AuthStatus.INITIALIZING });
      return;
    }

    // No user - unauthenticated
    if (!user) {
      set({ authStatus: AuthStatus.UNAUTHENTICATED });
      return;
    }

    // Check if email verification is required (skip for test accounts in dev)
    const isTestAccount =
      __DEV__ &&
      (user.email?.endsWith("@test.dreamweaver") ||
        user.email?.includes("test@example.com"));

    if (user.email && !user.emailVerified && !isTestAccount) {
      set({ authStatus: AuthStatus.UNVERIFIED });
      return;
    }

    // Check onboarding status if not already loaded
    if (get().hasCompletedOnboarding === null && !onboardingLoading) {
      set({ onboardingLoading: true });

      try {
        // Get children to check if user has completed onboarding
        const { useChildrenStore } = await import("./childrenStore");
        const childrenStore = useChildrenStore.getState();

        if (childrenStore.children.length > 0) {
          // User has children, they've completed onboarding
          set({ hasCompletedOnboarding: true });
          const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
          await AsyncStorage.setItem(onboardingKey, "true");
        } else {
          // Check AsyncStorage for onboarding flag
          const onboardingKey = `${ONBOARDING_KEY}_${user.uid}`;
          const hasOnboardedFlag = await AsyncStorage.getItem(onboardingKey);
          set({ hasCompletedOnboarding: hasOnboardedFlag === "true" });
        }
      } catch (error) {
        logger.error("Error checking onboarding status", error);
        set({ hasCompletedOnboarding: false });
      } finally {
        set({ onboardingLoading: false });
      }
    }

    // Wait for onboarding status to load
    if (onboardingLoading || get().hasCompletedOnboarding === null) {
      set({ authStatus: AuthStatus.INITIALIZING });
      return;
    }

    // Determine final auth status
    if (get().hasCompletedOnboarding) {
      set({ authStatus: AuthStatus.AUTHENTICATED });
    } else {
      set({ authStatus: AuthStatus.ONBOARDING });
    }
  },
}));
