import { create } from "zustand";
import { subscribeToAuthChanges } from "../services/firebase/auth";
import { AuthState, User } from "../types/auth.types";

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
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  authLoading: false,
  isInitialized: false,
  isInitializing: false,
  unsubscribe: null,

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

    const unsubscribe = subscribeToAuthChanges((user) => {
      const currentState = get();
      const { validateAuthState } = get();

      // Validate auth state before updating
      if (!validateAuthState()) {
        console.warn("Auth state validation failed, resetting to safe state");
        set({
          user: null,
          loading: false,
          error: "Authentication state corrupted",
        });
        return;
      }

      // Clear error only when successfully authenticated
      // This prevents stale errors from persisting after successful login
      if (user && currentState.error) {
        set({ user, loading: false, error: null });
      } else {
        // Keep error if auth fails or user logs out
        set({ user, loading: false });
      }
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
      console.log("Starting sign out process...");
      set({ loading: true, error: null });
      const { signOutUser } = await import("../services/firebase/auth");
      await signOutUser();
      console.log("Sign out completed, clearing user state");
      set({ user: null, loading: false, authLoading: false });
    } catch (error) {
      console.error("Sign out error:", error);
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
      console.warn("Invalid state: user authenticated but still loading");
      return false;
    }

    if (state.user && !state.user.uid) {
      // User object exists but missing required uid
      console.warn("Invalid state: user object missing uid");
      return false;
    }

    if (state.user && (!state.user.email || !state.user.email.includes("@"))) {
      // User object exists but has invalid email
      console.warn("Invalid state: user object has invalid email");
      return false;
    }

    // Check for memory corruption indicators
    if (
      typeof state.loading !== "boolean" ||
      typeof state.authLoading !== "boolean"
    ) {
      console.warn("Invalid state: loading flags are not boolean");
      return false;
    }

    if (state.error !== null && typeof state.error !== "string") {
      console.warn("Invalid state: error is not null or string");
      return false;
    }

    return true;
  },
}));
