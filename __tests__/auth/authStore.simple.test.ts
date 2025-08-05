import { create } from "zustand";

// Create a simple version of the auth store for testing
interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
  authLoading: boolean;
}

interface AuthActions {
  setUser: (user: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  clearError: () => void;
}

// Simple auth store implementation for testing
const createAuthStore = () =>
  create<AuthState & AuthActions>((set, get) => ({
    user: null,
    loading: true,
    error: null,
    authLoading: false,

    setUser: (user) => {
      const currentState = get();
      // Clear error only when successfully authenticated
      if (user && currentState.error) {
        set({ user, error: null });
      } else {
        set({ user });
      }
    },

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    setAuthLoading: (authLoading) => set({ authLoading }),

    clearError: () => set({ error: null }),
  }));

describe("Auth Store Logic", () => {
  let useAuthStore: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    useAuthStore = createAuthStore();
  });

  describe("User state management", () => {
    it("should initialize with null user and loading true", () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.authLoading).toBe(false);
    });

    it("should update user state", () => {
      const mockUser = { uid: "test-uid", email: "test@example.com" };

      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
    });

    it("should handle setting user to null", () => {
      const mockUser = { uid: "test-uid", email: "test@example.com" };

      // First set a user
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);

      // Then set to null
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("Loading state management", () => {
    it("should update loading state", () => {
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().loading).toBe(false);

      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().loading).toBe(true);
    });

    it("should update authLoading state", () => {
      useAuthStore.getState().setAuthLoading(true);
      expect(useAuthStore.getState().authLoading).toBe(true);

      useAuthStore.getState().setAuthLoading(false);
      expect(useAuthStore.getState().authLoading).toBe(false);
    });
  });

  describe("Error state management", () => {
    it("should update error state", () => {
      const errorMessage = "Test error message";

      useAuthStore.getState().setError(errorMessage);
      expect(useAuthStore.getState().error).toBe(errorMessage);
    });

    it("should clear error when set to null", () => {
      useAuthStore.getState().setError("Test error");
      expect(useAuthStore.getState().error).toBe("Test error");

      useAuthStore.getState().setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it("should clear error with clearError method", () => {
      useAuthStore.getState().setError("Test error");
      expect(useAuthStore.getState().error).toBe("Test error");

      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("Race condition handling", () => {
    it("should clear error when user successfully authenticates", () => {
      const mockUser = { uid: "test-uid", email: "test@example.com" };

      // Set an error first
      useAuthStore.getState().setError("Login failed");
      expect(useAuthStore.getState().error).toBe("Login failed");

      // Simulate successful authentication
      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull(); // Error should be cleared
    });

    it("should not clear error when user is set to null", () => {
      // Set an error first
      useAuthStore.getState().setError("Network error");
      expect(useAuthStore.getState().error).toBe("Network error");

      // Set user to null (e.g., logout)
      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.error).toBe("Network error"); // Error should be preserved
    });

    it("should handle multiple state updates correctly", () => {
      const mockUser = { uid: "test-uid", email: "test@example.com" };

      // Simulate a typical auth flow
      useAuthStore.getState().setAuthLoading(true);
      useAuthStore.getState().setError("Invalid credentials");

      let state = useAuthStore.getState();
      expect(state.authLoading).toBe(true);
      expect(state.error).toBe("Invalid credentials");

      // Successful login via different method
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setAuthLoading(false);

      state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.authLoading).toBe(false);
      expect(state.error).toBeNull(); // Error cleared on successful auth
    });
  });

  describe("Error message mapping", () => {
    const errorMappings = [
      {
        code: "auth/invalid-email",
        expected: "Please enter a valid email address.",
      },
      {
        code: "auth/user-not-found",
        expected:
          "No account found with this email. Please check your email or sign up.",
      },
      {
        code: "auth/wrong-password",
        expected: "Incorrect password. Please try again.",
      },
      {
        code: "auth/invalid-credential",
        expected:
          "Invalid email or password. Please check your credentials and try again.",
      },
      {
        code: "auth/too-many-requests",
        expected: "Too many failed attempts. Please try again later.",
      },
      {
        code: "auth/email-already-in-use",
        expected: "An account already exists with this email address.",
      },
      {
        code: "auth/weak-password",
        expected: "Password should be at least 6 characters long.",
      },
      {
        code: "auth/network-request-failed",
        expected: "Network error. Please check your internet connection.",
      },
      {
        code: "auth/operation-not-allowed",
        expected: "This sign-in method is not enabled. Please contact support.",
      },
      {
        code: "auth/requires-recent-login",
        expected: "Please sign in again to complete this action.",
      },
    ];

    // Simple error mapping function (extracted from useAuth logic)
    const getAuthErrorMessage = (error: any): string => {
      const errorCode = error?.code || error?.message || "";

      const errorMap: { [key: string]: string } = {
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/user-disabled":
          "This account has been disabled. Please contact support.",
        "auth/user-not-found":
          "No account found with this email. Please check your email or sign up.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential":
          "Invalid email or password. Please check your credentials and try again.",
        "auth/too-many-requests":
          "Too many failed attempts. Please try again later.",
        "auth/email-already-in-use":
          "An account already exists with this email address.",
        "auth/weak-password": "Password should be at least 6 characters long.",
        "auth/network-request-failed":
          "Network error. Please check your internet connection.",
        "auth/operation-not-allowed":
          "This sign-in method is not enabled. Please contact support.",
        "auth/requires-recent-login":
          "Please sign in again to complete this action.",
        "auth/invalid-login-credentials":
          "Invalid email or password. Please check your credentials and try again.",
      };

      if (errorMap[errorCode]) {
        return errorMap[errorCode];
      }

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
    };

    errorMappings.forEach(({ code, expected }) => {
      it(`should map error code ${code} to user-friendly message`, () => {
        const error = { code };
        const result = getAuthErrorMessage(error);
        expect(result).toBe(expected);
      });
    });

    it("should return custom error message if already user-friendly", () => {
      const error = { message: "This is a custom error message" };
      const result = getAuthErrorMessage(error);
      expect(result).toBe("This is a custom error message");
    });

    it("should return generic error for unknown error codes", () => {
      const error = { code: "unknown-error-code" };
      const result = getAuthErrorMessage(error);
      expect(result).toBe("An error occurred. Please try again.");
    });

    it("should handle Firebase-specific errors", () => {
      const error = { message: "Firebase: Error (auth/some-firebase-error)" };
      const result = getAuthErrorMessage(error);
      expect(result).toBe("An error occurred. Please try again.");
    });
  });
});
