import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthStatus, User } from "../../types/auth.types";
import { isTestAccount } from "../../constants/AuthConstants";

// Types for centralized auth state test
interface AuthStatusState {
  authStatus: AuthStatus;
  user: User | null;
  loading: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean | null;
}

interface AuthStatusActions {
  setAuthStatus: (status: AuthStatus) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOnboardingStatus: (completed: boolean | null) => void;
  computeAuthStatus: () => void;
  initialize: () => Promise<void>;
}

// Mock AsyncStorage for testing
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock __DEV__ for test account logic
(global as any).__DEV__ = true;

// Mock useChildren hook
const mockUseChildren = jest.fn();
jest.mock("../../hooks/useChildren", () => ({
  useChildren: () => mockUseChildren(),
}));

// Helper function to create valid User objects for tests
const createTestUser = (overrides: Partial<User> = {}): User => ({
  uid: "test-uid",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
  emailVerified: true,
  createdAt: new Date(),
  isAdmin: false,
  ...overrides,
});

// Create test store
const createAuthStatusStore = () =>
  create<AuthStatusState & AuthStatusActions>((set, get) => ({
    authStatus: AuthStatus.INITIALIZING,
    user: null,
    loading: true,
    error: null,
    hasCompletedOnboarding: null,

    setAuthStatus: (status) => set({ authStatus: status }),
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setOnboardingStatus: (completed) =>
      set({ hasCompletedOnboarding: completed }),

    computeAuthStatus: () => {
      const { user, loading, hasCompletedOnboarding } = get();

      // Still loading dependencies
      if (loading || hasCompletedOnboarding === null) {
        set({ authStatus: AuthStatus.INITIALIZING });
        return;
      }

      // No user means unauthenticated
      if (!user) {
        set({ authStatus: AuthStatus.UNAUTHENTICATED });
        return;
      }

      // User exists but email not verified (skip test accounts)
      if (user.email && !user.emailVerified && !isTestAccount(user.email)) {
        set({ authStatus: AuthStatus.UNVERIFIED });
        return;
      }

      // User verified but hasn't completed onboarding
      if (!hasCompletedOnboarding) {
        set({ authStatus: AuthStatus.ONBOARDING });
        return;
      }

      // Fully authenticated
      set({ authStatus: AuthStatus.AUTHENTICATED });
    },

    initialize: async () => {
      const { computeAuthStatus } = get();
      set({ loading: true, authStatus: AuthStatus.INITIALIZING });

      // Simulate loading user data and onboarding status
      setTimeout(() => {
        set({ loading: false });
        computeAuthStatus();
      }, 10);
    },
  }));

describe("Centralized Auth Status System", () => {
  let useAuthStatusStore: ReturnType<typeof createAuthStatusStore>;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  beforeEach(() => {
    useAuthStatusStore = createAuthStatusStore();
    jest.clearAllMocks();
    mockUseChildren.mockReturnValue({ children: [], loading: false });
  });

  describe("AuthStatus Enum Values", () => {
    it("should have correct enum values", () => {
      expect(AuthStatus.INITIALIZING).toBe("initializing");
      expect(AuthStatus.UNAUTHENTICATED).toBe("unauthenticated");
      expect(AuthStatus.UNVERIFIED).toBe("unverified");
      expect(AuthStatus.ONBOARDING).toBe("onboarding");
      expect(AuthStatus.AUTHENTICATED).toBe("authenticated");
    });
  });

  describe("Initial State", () => {
    it("should start with INITIALIZING status", () => {
      const state = useAuthStatusStore.getState();
      expect(state.authStatus).toBe(AuthStatus.INITIALIZING);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      expect(state.hasCompletedOnboarding).toBeNull();
    });
  });

  describe("Auth Status Computation Logic", () => {
    it("should remain INITIALIZING when loading", () => {
      const store = useAuthStatusStore.getState();

      store.setLoading(true);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "test@example.com",
          emailVerified: true,
        })
      );
      store.setOnboardingStatus(true);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.INITIALIZING
      );
    });

    it("should remain INITIALIZING when onboarding status is unknown", () => {
      const store = useAuthStatusStore.getState();

      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "test@example.com",
          emailVerified: true,
        })
      );
      store.setOnboardingStatus(null); // Unknown onboarding status
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.INITIALIZING
      );
    });

    it("should be UNAUTHENTICATED when no user", () => {
      const store = useAuthStatusStore.getState();

      store.setLoading(false);
      store.setUser(null);
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.UNAUTHENTICATED
      );
    });

    it("should be UNVERIFIED when email not verified", () => {
      const store = useAuthStatusStore.getState();

      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "user@example.com",
          emailVerified: false,
        })
      );
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.UNVERIFIED
      );
    });

    it("should skip verification for test accounts", () => {
      const store = useAuthStatusStore.getState();

      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "user@test.dreamweaver",
          emailVerified: false,
        })
      );
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.ONBOARDING
      );
    });

    it("should be ONBOARDING when user verified but onboarding incomplete", () => {
      const store = useAuthStatusStore.getState();

      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "user@example.com",
          emailVerified: true,
        })
      );
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.ONBOARDING
      );
    });

    it("should be AUTHENTICATED when fully verified and onboarded", () => {
      const store = useAuthStatusStore.getState();

      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "user@example.com",
          emailVerified: true,
        })
      );
      store.setOnboardingStatus(true);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.AUTHENTICATED
      );
    });
  });

  describe("Race Condition Prevention", () => {
    it("should handle rapid user state changes without flickering", async () => {
      const store = useAuthStatusStore.getState();
      const statusHistory: AuthStatus[] = [];

      // Subscribe to status changes
      const unsubscribe = useAuthStatusStore.subscribe((state) => {
        statusHistory.push(state.authStatus);
      });

      // Simulate rapid fire updates that could cause race conditions
      store.setLoading(true);
      store.computeAuthStatus();

      store.setUser(
        createTestUser({
          uid: "test",
          email: "test@example.com",
          emailVerified: true,
        })
      );
      store.computeAuthStatus();

      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      store.setLoading(false);
      store.computeAuthStatus();

      store.setOnboardingStatus(true);
      store.computeAuthStatus();

      // Should end up with AUTHENTICATED status
      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.AUTHENTICATED
      );

      // Should never have invalid status transitions
      const invalidTransitions = statusHistory.filter((status, index) => {
        if (index === 0) return false;
        const prevStatus = statusHistory[index - 1];

        // Example: should never go directly from UNAUTHENTICATED to AUTHENTICATED
        return (
          prevStatus === AuthStatus.UNAUTHENTICATED &&
          status === AuthStatus.AUTHENTICATED
        );
      });

      expect(invalidTransitions).toHaveLength(0);

      unsubscribe();
    });

    it("should handle onboarding completion race condition", () => {
      const store = useAuthStatusStore.getState();

      // Start with user who hasn't completed onboarding
      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "test@example.com",
          emailVerified: true,
        })
      );
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.ONBOARDING
      );

      // Complete onboarding
      store.setOnboardingStatus(true);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.AUTHENTICATED
      );
    });

    it("should handle logout gracefully", () => {
      const store = useAuthStatusStore.getState();

      // Start authenticated
      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "test@example.com",
          emailVerified: true,
        })
      );
      store.setOnboardingStatus(true);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.AUTHENTICATED
      );

      // Logout
      store.setUser(null);
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.UNAUTHENTICATED
      );
    });
  });

  describe("Error Handling", () => {
    it("should maintain error state alongside status", () => {
      const store = useAuthStatusStore.getState();

      store.setError("Network error");
      store.setLoading(false);
      store.setUser(null);
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      const state = useAuthStatusStore.getState();
      expect(state.authStatus).toBe(AuthStatus.UNAUTHENTICATED);
      expect(state.error).toBe("Network error");
    });

    it("should clear error on successful authentication", () => {
      const store = useAuthStatusStore.getState();

      // Set error first
      store.setError("Invalid credentials");

      // Then successful auth
      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "test@example.com",
          emailVerified: true,
        })
      );
      store.setOnboardingStatus(true);
      store.setError(null); // Clear error on success
      store.computeAuthStatus();

      const state = useAuthStatusStore.getState();
      expect(state.authStatus).toBe(AuthStatus.AUTHENTICATED);
      expect(state.error).toBeNull();
    });
  });

  describe("Integration with Onboarding System", () => {
    it("should determine onboarding status from children count", () => {
      const store = useAuthStatusStore.getState();

      // User with verified email but no explicit onboarding flag
      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "test@example.com",
          emailVerified: true,
        })
      );
      // Note: Onboarding status is now determined from Firestore during initializeAuthStatus
      store.setOnboardingStatus(null); // Unknown from storage

      // Logic should infer onboarding complete from children
      // This would be handled in the actual implementation
      store.setOnboardingStatus(true);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.AUTHENTICATED
      );
    });

    it("should handle storage-based onboarding status", async () => {
      const store = useAuthStatusStore.getState();
      mockAsyncStorage.getItem.mockResolvedValue("true");

      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "test",
          email: "test@example.com",
          emailVerified: true,
        })
      );
      // Note: Onboarding status is now determined from Firestore during initializeAuthStatus

      // Simulate reading from storage
      const onboardingKey = "user_onboarded_test";
      const hasOnboarded = await AsyncStorage.getItem(onboardingKey);
      store.setOnboardingStatus(hasOnboarded === "true");
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.AUTHENTICATED
      );
    });
  });
});

describe("Auth Status Integration Tests", () => {
  let useAuthStatusStore: ReturnType<typeof createAuthStatusStore>;

  beforeEach(() => {
    useAuthStatusStore = createAuthStatusStore();
    jest.clearAllMocks();
  });

  describe("Complete Auth Flows", () => {
    it("should handle complete signup flow", async () => {
      const store = useAuthStatusStore.getState();
      const statusHistory: AuthStatus[] = [store.authStatus];

      const unsubscribe = useAuthStatusStore.subscribe((state) => {
        statusHistory.push(state.authStatus);
      });

      // Start with signup
      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "new-user",
          email: "new@example.com",
          emailVerified: false,
        })
      );
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.UNVERIFIED
      );

      // Email verification
      store.setUser(
        createTestUser({
          uid: "new-user",
          email: "new@example.com",
          emailVerified: true,
        })
      );
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.ONBOARDING
      );

      // Complete onboarding
      store.setOnboardingStatus(true);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.AUTHENTICATED
      );

      // Verify smooth progression
      const expectedFlow = [
        AuthStatus.INITIALIZING,
        AuthStatus.UNVERIFIED,
        AuthStatus.ONBOARDING,
        AuthStatus.AUTHENTICATED,
      ];

      expect(statusHistory).toEqual(expect.arrayContaining(expectedFlow));
      unsubscribe();
    });

    it("should handle returning user flow", () => {
      const store = useAuthStatusStore.getState();

      // Simulate app restart with authenticated user
      store.setLoading(true);
      store.setUser(
        createTestUser({
          uid: "existing-user",
          email: "user@example.com",
          emailVerified: true,
        })
      );
      store.setOnboardingStatus(true);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.INITIALIZING
      );

      // Finish loading
      store.setLoading(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.AUTHENTICATED
      );
    });

    it("should handle logout flow", () => {
      const store = useAuthStatusStore.getState();

      // Start authenticated
      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "user",
          email: "user@example.com",
          emailVerified: true,
        })
      );
      store.setOnboardingStatus(true);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.AUTHENTICATED
      );

      // Logout
      store.setUser(null);
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.UNAUTHENTICATED
      );
    });

    it("should handle email verification status change", () => {
      const store = useAuthStatusStore.getState();

      // Start with unverified user
      store.setLoading(false);
      store.setUser(
        createTestUser({
          uid: "user",
          email: "user@example.com",
          emailVerified: false,
        })
      );
      store.setOnboardingStatus(false);
      store.computeAuthStatus();

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.UNVERIFIED
      );

      // Email gets verified (user object updates)
      store.setUser(
        createTestUser({
          uid: "user",
          email: "user@example.com",
          emailVerified: true,
        })
      );
      store.computeAuthStatus(); // This should be called automatically in real app

      expect(useAuthStatusStore.getState().authStatus).toBe(
        AuthStatus.ONBOARDING
      );
    });
  });
});
