import { create } from "zustand";
import { subscribeToAuthChanges } from "../services/firebase/auth";
import { User, AuthState } from "../types/auth.types";

interface AuthStore extends AuthState {
  initialize: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  initialize: () => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      console.log('[AUTH_STORE] Auth state changed:', {
        user: user ? `${user.email} (verified: ${user.emailVerified})` : 'null',
        previousLoading: get().loading
      });
      // Don't clear error when auth state changes to prevent losing login errors
      set({ user, loading: false });
    });

    // Store the unsubscribe function for cleanup
    (get() as any).unsubscribe = unsubscribe;
  },

  setUser: (user) => set({ user }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  signOut: async () => {
    try {
      console.log("Starting sign out process...");
      set({ loading: true, error: null });
      const { signOutUser } = await import("../services/firebase/auth");
      await signOutUser();
      console.log("Sign out completed, clearing user state");
      set({ user: null, loading: false });
    } catch (error) {
      console.error("Sign out error:", error);
      set({
        error: error instanceof Error ? error.message : "Sign out failed",
        loading: false,
      });
    }
  },
}));
