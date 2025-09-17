// Mock Firebase first before importing
import type { UserCredits } from "../../types/monetization.types";
const mockDoc = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  onSnapshot: jest.fn(),
};

const mockCollection = {
  doc: jest.fn(() => mockDoc),
  add: jest.fn(),
  where: jest.fn(() => ({
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  })),
};

// Create the FieldValue mock and individual function mocks
const mockFieldValue = {
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  increment: jest.fn((value: number) => ({ _increment: value })),
  delete: jest.fn(() => ({ _delete: true })),
};

const mockServerTimestamp = jest.fn(() => "SERVER_TIMESTAMP");
const mockIncrement = jest.fn((value: number) => ({ _increment: value }));
const mockDeleteField = jest.fn(() => ({ _delete: true }));

const mockRunTransaction = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockAddDoc = jest.fn();

const mockFirestore = {
  collection: jest.fn(() => mockCollection),
  runTransaction: mockRunTransaction,
  FieldValue: mockFieldValue,
};

const mockFirestoreFunction = jest.fn(() => mockFirestore);
// TypeScript-friendly way to add FieldValue to the mock
(mockFirestoreFunction as any).FieldValue = mockFieldValue;

const mockFirestoreModule = {
  __esModule: true,
  default: mockFirestoreFunction,
  FieldValue: mockFieldValue,
  getFirestore: jest.fn(() => mockFirestore),
  collection: jest.fn(() => mockCollection),
  doc: jest.fn(() => mockDoc),
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  addDoc: mockAddDoc,
  runTransaction: mockRunTransaction,
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: mockServerTimestamp,
  increment: mockIncrement,
  deleteField: mockDeleteField,
};

jest.doMock("@react-native-firebase/firestore", () => mockFirestoreModule);

// Now import the service AFTER the mock is set up

const { creditsService } = require("../../services/firebase/credits");

describe("CreditsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateUserCredits", () => {
    it("should validate correct credit structure", () => {
      const validCredits: UserCredits = {
        userId: "user123",
        balance: 100,
        lifetimeUsed: 50,
        subscriptionActive: false,
        freeCreditsGranted: true,
        lastUpdated: new Date(),
      };

      expect(() =>
        creditsService.validateUserCredits(validCredits)
      ).not.toThrow();
    });

    it("should throw error for invalid data types", () => {
      expect(() => creditsService.validateUserCredits(null)).toThrow(
        "Invalid credits data structure"
      );
      expect(() => creditsService.validateUserCredits(undefined)).toThrow(
        "Invalid credits data structure"
      );
      expect(() => creditsService.validateUserCredits("invalid")).toThrow(
        "Invalid credits data structure"
      );
    });

    it("should throw error for missing required fields", () => {
      expect(() => creditsService.validateUserCredits({})).toThrow(
        "Missing required field: balance"
      );
      expect(() => creditsService.validateUserCredits({ balance: 50 })).toThrow(
        "Missing required field: lifetimeUsed"
      );
    });

    it("should throw error for invalid field types", () => {
      expect(() =>
        creditsService.validateUserCredits({
          balance: "not a number",
          lifetimeUsed: 0,
          subscriptionActive: false,
          freeCreditsGranted: true,
        })
      ).toThrow("Field balance must be a number");

      expect(() =>
        creditsService.validateUserCredits({
          balance: 100,
          lifetimeUsed: "not a number",
          subscriptionActive: false,
          freeCreditsGranted: true,
        })
      ).toThrow("Field lifetimeUsed must be a number");
    });

    it("should throw error for negative values", () => {
      expect(() =>
        creditsService.validateUserCredits({
          balance: -10,
          lifetimeUsed: 0,
          subscriptionActive: false,
          freeCreditsGranted: true,
        })
      ).toThrow("Field balance cannot be negative");

      expect(() =>
        creditsService.validateUserCredits({
          balance: 100,
          lifetimeUsed: -5,
          subscriptionActive: false,
          freeCreditsGranted: true,
        })
      ).toThrow("Field lifetimeUsed cannot be negative");
    });
  });

  describe("useCredits", () => {
    it("should handle insufficient credits error", async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ balance: 5, lifetimeUsed: 0 }),
        }),
        update: jest.fn(),
        set: jest.fn(),
      };

      mockRunTransaction.mockImplementation(async (db: any, callback: any) => {
        try {
          return await callback(mockTransaction);
        } catch (error) {
          // The service should catch the error and return error format
          return {
            success: false,
            remainingBalance: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      const result = await creditsService.useCredits("user123", 10, "story123");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Insufficient credits. Need 10, have 5");
    });

    it("should successfully deduct credits when sufficient", async () => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ balance: 20, lifetimeUsed: 5 }),
        }),
        update: jest.fn(),
        set: jest.fn(),
      };

      mockRunTransaction.mockImplementation(async (db: any, callback: any) => {
        return await callback(mockTransaction);
      });

      const result = await creditsService.useCredits("user123", 10, "story123");

      expect(result.success).toBe(true);
      expect(result.remainingBalance).toBe(10);
    });
  });

  describe("checkCreditsAvailable", () => {
    it("should return true when credits are sufficient", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ balance: 20 }),
      });

      const result = await creditsService.checkCreditsAvailable("user123", 10);

      expect(result.available).toBe(true);
      expect(result.balance).toBe(20);
    });

    it("should return false when credits are insufficient", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ balance: 5 }),
      });

      const result = await creditsService.checkCreditsAvailable("user123", 10);

      expect(result.available).toBe(false);
      expect(result.balance).toBe(5);
    });

    it("should return false when user credits don't exist", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await creditsService.checkCreditsAvailable("user123", 10);

      expect(result.available).toBe(false);
      expect(result.balance).toBe(0);
    });
  });

  describe("recordPurchase", () => {
    it("should successfully record a purchase", async () => {
      mockAddDoc.mockResolvedValue({ id: "purchase123" });

      const purchaseData = {
        userId: "user123",
        productId: "credits_25",
        purchaseDate: new Date(),
        amount: 4.99,
        credits: 25,
        platform: "ios" as const,
        transactionId: "txn_123",
        status: "completed" as const,
      };

      await creditsService.recordPurchase(purchaseData);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: "user123",
          productId: "credits_25",
          credits: 25,
          platform: "ios",
          status: "completed",
        })
      );
    });
  });
});
