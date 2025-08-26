import { revenueCatService } from "../../services/revenuecat";
import {
  AuthenticationError,
  UserContextError,
  SubscriptionError,
  ConfigurationError,
} from "../../types/revenuecat.errors";
import { creditsService } from "../../services/firebase/credits";

// Mock RevenueCat
jest.mock("react-native-purchases", () => ({
  configure: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
  purchasePackage: jest.fn(),
  getCustomerInfo: jest.fn(),
  getOfferings: jest.fn(),
  restorePurchases: jest.fn(),
  setLogLevel: jest.fn(),
  LOG_LEVEL: {
    DEBUG: "DEBUG",
  },
}));

// Mock Firebase Auth
const mockAuthInstance = {
  currentUser: null as any,
};

jest.mock("@react-native-firebase/auth", () => ({
  __esModule: true,
  default: jest.fn(() => mockAuthInstance),
  getAuth: jest.fn(() => mockAuthInstance),
  onAuthStateChanged: jest.fn(() => jest.fn()), // Returns unsubscribe function
}));

// Mock Credits Service
jest.mock("../../services/firebase/credits", () => ({
  creditsService: {
    cancelSubscription: jest.fn(),
    updateSubscription: jest.fn(),
  },
}));

// Mock Logger
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("RevenueCatService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock auth state
    mockAuthInstance.currentUser = null;
  });

  describe("validateCurrentUser", () => {
    it("should throw AuthenticationError when no user is authenticated", () => {
      // Set mock to return no current user
      mockAuthInstance.currentUser = null;

      // Use reflection to test private method
      const service = revenueCatService as any;

      expect(() => {
        service.validateCurrentUser("user123");
      }).toThrow(AuthenticationError);
    });

    it("should throw UserContextError when user IDs do not match", () => {
      // Set mock to return different user
      mockAuthInstance.currentUser = { uid: "different-user" };

      const service = revenueCatService as any;

      expect(() => {
        service.validateCurrentUser("target-user");
      }).toThrow(UserContextError);
    });

    it("should not throw when user IDs match", () => {
      // Set mock to return matching user
      mockAuthInstance.currentUser = { uid: "matching-user" };

      const service = revenueCatService as any;

      expect(() => {
        service.validateCurrentUser("matching-user");
      }).not.toThrow();
    });
  });

  describe("validatePurchaseConfiguration", () => {
    it("should throw ConfigurationError when RevenueCat is not configured", () => {
      const service = revenueCatService as any;
      service.isConfigured = false;

      expect(() => {
        service.validatePurchaseConfiguration();
      }).toThrow(ConfigurationError);
    });

    it("should throw ConfigurationError when user is not set", () => {
      const service = revenueCatService as any;
      service.isConfigured = true;
      service.userId = null;

      expect(() => {
        service.validatePurchaseConfiguration();
      }).toThrow(ConfigurationError);
    });

    it("should not throw when properly configured", () => {
      const service = revenueCatService as any;
      service.isConfigured = true;
      service.userId = "user123";

      expect(() => {
        service.validatePurchaseConfiguration();
      }).not.toThrow();
    });
  });

  describe("validateProductCredits", () => {
    it("should throw SubscriptionError for unknown product", () => {
      const service = revenueCatService as any;

      expect(() => {
        service.validateProductCredits("unknown_product");
      }).toThrow(SubscriptionError);
    });

    it("should return credits for known product", () => {
      const service = revenueCatService as any;

      const credits = service.validateProductCredits(
        "subscription_monthly_basic"
      );
      expect(credits).toBe(30); // Based on CREDIT_AMOUNTS
    });
  });

  describe("safelyCallCancelSubscription", () => {
    it("should handle permission denied errors gracefully", async () => {
      const permissionError = new Error("Permission denied");
      (permissionError as any).code = "firestore/permission-denied";

      (creditsService.cancelSubscription as jest.Mock).mockRejectedValue(
        permissionError
      );

      const service = revenueCatService as any;

      // Should not throw
      await expect(
        service.safelyCallCancelSubscription("user123")
      ).resolves.toBeUndefined();
    });

    it("should throw SubscriptionError for other errors", async () => {
      const unexpectedError = new Error("Unexpected error");

      (creditsService.cancelSubscription as jest.Mock).mockRejectedValue(
        unexpectedError
      );

      const service = revenueCatService as any;

      await expect(
        service.safelyCallCancelSubscription("user123")
      ).rejects.toThrow(SubscriptionError);
    });
  });
});
