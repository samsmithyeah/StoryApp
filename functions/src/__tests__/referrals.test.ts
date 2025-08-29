// Mock Firebase Admin SDK
const mockGet = jest.fn();
const mockSet = jest.fn().mockResolvedValue({});
const mockUpdate = jest.fn().mockResolvedValue({});
const mockDelete = jest.fn().mockResolvedValue({});
const mockCreate = jest.fn().mockResolvedValue({});

// Create a single doc instance that gets reused
const mockDocInstance = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
  create: mockCreate,
};

const mockDoc = jest.fn(() => mockDocInstance);

const mockQuery = {
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: jest.fn(),
};

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  where: jest.fn(() => mockQuery),
  orderBy: jest.fn(() => mockQuery),
  limit: jest.fn(() => mockQuery),
  get: jest.fn(),
}));

jest.mock("firebase-admin", () => {
  const mockTransaction = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  };

  const mockRunTransaction = jest.fn((callback) => callback(mockTransaction));

  const mockFirestore = jest.fn(() => ({
    collection: mockCollection,
    doc: mockDoc,
    runTransaction: mockRunTransaction,
  }));

  const mockFieldValue = {
    serverTimestamp: jest.fn(() => "timestamp"),
    increment: jest.fn((val) => `increment-${val}`),
  };

  return {
    firestore: mockFirestore,
    initializeApp: jest.fn(),
    FieldValue: mockFieldValue,
  };
});

// Mock Firebase Functions
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock("firebase-functions", () => ({
  logger: mockLogger,
}));

jest.mock("firebase-functions/v2/https", () => ({
  onCall: jest.fn((_config, handler) => handler),
}));

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: jest.fn(() => "timestamp"),
    increment: jest.fn((val) => `increment-${val}`),
  },
}));

// Mock sendReferralNotification
jest.mock("../sendReferralNotification", () => ({
  sendReferralNotification: jest.fn().mockResolvedValue(undefined),
}));

describe("Referral Functions", () => {
  let admin: any;
  let db: any;
  let referralFunctions: any;

  beforeAll(() => {
    admin = require("firebase-admin");
    db = admin.firestore();

    // Import the referral functions
    referralFunctions = require("../referrals");
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Completely reset all mock implementations
    mockGet.mockReset().mockResolvedValue({ exists: false });
    mockSet.mockReset().mockResolvedValue({});
    mockUpdate.mockReset().mockResolvedValue({});
    mockDelete.mockReset().mockResolvedValue({});
    mockCreate.mockReset().mockResolvedValue({});

    // Reset query mocks
    mockQuery.get.mockReset().mockResolvedValue({ empty: true, docs: [] });
  });

  describe("getUserReferralCode", () => {
    it("should return existing referral code if user already has one", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: {},
      };

      // Mock user doc with existing referral code
      const mockUserDoc = {
        data: () => ({ referralCode: "STORYABC" }),
      };
      // Mock referral code doc exists and is active
      const mockCodeDoc = {
        exists: true,
        data: () => ({ isActive: true }),
      };
      mockGet
        .mockResolvedValueOnce(mockUserDoc)
        .mockResolvedValueOnce(mockCodeDoc);

      const result = await referralFunctions.getUserReferralCode(mockRequest);

      expect(result).toEqual({ referralCode: "STORYABC" });
    });

    it("should create new referral code if user doesn't have one", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: {},
      };

      // Mock user doc without referral code
      const mockUserDoc = {
        data: () => null,
      };
      // Mock referral code doesn't exist (first attempt succeeds)
      const mockCodeDoc = {
        exists: false,
      };
      mockGet
        .mockResolvedValueOnce(mockUserDoc)
        .mockResolvedValueOnce(mockCodeDoc);

      const result = await referralFunctions.getUserReferralCode(mockRequest);

      expect(result).toHaveProperty("referralCode");
      expect(typeof result.referralCode).toBe("string");
      expect(result.referralCode).toMatch(/^STORY[A-Z0-9]{3}$/); // Total length is 8: "STORY" + 3 chars
    });

    it("should throw error if no authentication", async () => {
      const mockRequest = {
        auth: null,
        data: {},
      };

      await expect(
        referralFunctions.getUserReferralCode(mockRequest)
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("validateReferralCode", () => {
    it("should return valid for active referral code from different user", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: { code: "STORYABC" },
      };

      // Mock referral code doc exists and is valid
      const mockCodeDoc = {
        exists: true,
        data: () => ({
          ownerId: "different-user-id",
          isActive: true,
          usageLimit: 1000,
          timesUsed: 5,
        }),
      };
      mockGet.mockResolvedValue(mockCodeDoc);

      const result = await referralFunctions.validateReferralCode(mockRequest);

      expect(result).toEqual({
        isValid: true,
        ownerId: "different-user-id",
      });
    });

    it("should return invalid for user's own referral code", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: { code: "STORYABC" },
      };

      // Mock referral code doc exists but belongs to same user
      const mockCodeDoc = {
        exists: true,
        data: () => ({
          ownerId: "test-user-id", // Same as requesting user
          isActive: true,
          usageLimit: 1000,
          timesUsed: 5,
        }),
      };
      db.collection().doc().get.mockResolvedValue(mockCodeDoc);

      const result = await referralFunctions.validateReferralCode(mockRequest);

      expect(result).toEqual({
        isValid: false,
        error: "You cannot use your own referral code",
      });
    });

    it("should return invalid for non-existent code", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: { code: "STORYZZZ" }, // Valid length but non-existent
      };

      // Mock referral code doc doesn't exist
      const mockCodeDoc = {
        exists: false,
      };
      db.collection().doc().get.mockResolvedValue(mockCodeDoc);

      const result = await referralFunctions.validateReferralCode(mockRequest);

      expect(result).toEqual({
        isValid: false,
        error: "Referral code not found",
      });
    });

    it("should return invalid for inactive code", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: { code: "STORYABC" },
      };

      // Mock referral code doc exists but is inactive
      const mockCodeDoc = {
        exists: true,
        data: () => ({
          ownerId: "different-user-id",
          isActive: false,
          usageLimit: 1000,
          timesUsed: 5,
        }),
      };
      db.collection().doc().get.mockResolvedValue(mockCodeDoc);

      const result = await referralFunctions.validateReferralCode(mockRequest);

      expect(result).toEqual({
        isValid: false,
        error: "Referral code is no longer active",
      });
    });

    it("should return invalid for code at usage limit", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: { code: "STORYABC" },
      };

      // Mock referral code doc exists but at usage limit
      const mockCodeDoc = {
        exists: true,
        data: () => ({
          ownerId: "different-user-id",
          isActive: true,
          usageLimit: 1000,
          timesUsed: 1000, // At limit
        }),
      };
      db.collection().doc().get.mockResolvedValue(mockCodeDoc);

      const result = await referralFunctions.validateReferralCode(mockRequest);

      expect(result).toEqual({
        isValid: false,
        error: "Referral code usage limit exceeded",
      });
    });

    it("should return invalid for incorrect code format", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: { code: "ABC" }, // Too short
      };

      const result = await referralFunctions.validateReferralCode(mockRequest);

      expect(result).toEqual({
        isValid: false,
        error: "Invalid code format",
      });
    });
  });

  describe("recordReferral", () => {
    it("should successfully record a valid referral", async () => {
      const mockRequest = {
        auth: { uid: "referee-user-id" },
        data: { referralCode: "STORYABC" },
      };

      // Mock valid referral code
      const mockCodeDoc = {
        exists: true,
        data: () => ({
          ownerId: "referrer-user-id",
          isActive: true,
          usageLimit: 1000,
          timesUsed: 5,
        }),
      };
      db.collection().doc().get.mockResolvedValue(mockCodeDoc);

      // Mock transaction - no existing redemption
      const mockTransaction =
        db.runTransaction.mock.calls[0]?.[0] ||
        ((callback: any) =>
          callback({
            get: jest.fn().mockResolvedValue({ exists: false }),
            set: jest.fn(),
            update: jest.fn(),
          }));

      db.runTransaction.mockImplementation(mockTransaction);

      const result = await referralFunctions.recordReferral(mockRequest);

      expect(result).toEqual({ success: true });
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Referral recorded successfully",
        expect.objectContaining({
          refereeId: "referee-user-id",
          referralCode: "STORYABC",
          referrerId: "referrer-user-id",
        })
      );
    });

    it("should throw error for duplicate referral", async () => {
      const mockRequest = {
        auth: { uid: "referee-user-id" },
        data: { referralCode: "STORYABC" },
      };

      // Mock valid referral code
      const mockCodeDoc = {
        exists: true,
        data: () => ({
          ownerId: "referrer-user-id",
          isActive: true,
          usageLimit: 1000,
          timesUsed: 5,
        }),
      };
      db.collection().doc().get.mockResolvedValue(mockCodeDoc);

      // Mock transaction with existing redemption
      db.runTransaction.mockImplementation((callback: any) =>
        callback({
          get: jest.fn().mockResolvedValue({ exists: true }),
          set: jest.fn(),
          update: jest.fn(),
        })
      );

      await expect(
        referralFunctions.recordReferral(mockRequest)
      ).rejects.toThrow("Referral already recorded for this user");
    });

    it("should throw error for non-existent referral code", async () => {
      const mockRequest = {
        auth: { uid: "referee-user-id" },
        data: { referralCode: "INVALID" },
      };

      // Mock non-existent referral code
      const mockCodeDoc = {
        exists: false,
      };
      db.collection().doc().get.mockResolvedValue(mockCodeDoc);

      await expect(
        referralFunctions.recordReferral(mockRequest)
      ).rejects.toThrow("Referral code not found");
    });
  });

  describe("completeReferral", () => {
    it("should successfully complete a pending referral", async () => {
      const mockRequest = {
        auth: { uid: "admin-user-id" },
        data: { userId: "referee-user-id" },
      };

      // Mock pending referral query result
      const mockQueryResult = {
        empty: false,
        docs: [
          {
            id: "redemption-id",
            data: () => ({
              referrerId: "referrer-user-id",
              refereeId: "referee-user-id",
              referralCode: "STORYABC",
              referrerCreditsAwarded: 10,
              refereeCreditsAwarded: 5,
            }),
          },
        ],
      };
      mockQuery.get.mockResolvedValue(mockQueryResult);

      // Mock transaction with referrer data
      db.runTransaction.mockImplementation((callback: any) =>
        callback({
          get: jest.fn().mockResolvedValue({
            data: () => ({
              referralStats: {
                totalReferred: 0,
                creditsEarned: 0,
                pendingReferrals: 1,
              },
            }),
          }),
          update: jest.fn(),
          set: jest.fn(),
        })
      );

      const result = await referralFunctions.completeReferral(mockRequest);

      expect(result).toEqual({ success: true });
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Referral completed successfully",
        expect.objectContaining({
          refereeId: "referee-user-id",
          referrerId: "referrer-user-id",
          referrerCredits: 10,
          refereeCredits: 5,
        })
      );
    });

    it("should return failure if no pending referral found", async () => {
      const mockRequest = {
        auth: { uid: "admin-user-id" },
        data: { userId: "referee-user-id" },
      };

      // Mock empty query result
      const mockQueryResult = {
        empty: true,
        docs: [],
      };
      mockQuery.get.mockResolvedValue(mockQueryResult);

      const result = await referralFunctions.completeReferral(mockRequest);

      expect(result).toEqual({
        success: false,
        message: "No pending referral found",
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "No pending referral found for user",
        { userId: "referee-user-id" }
      );
    });
  });

  describe("getReferralStats", () => {
    it("should return user referral stats", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: {},
      };

      // Mock user doc with referral stats
      const mockUserDoc = {
        data: () => ({
          referralStats: {
            totalReferred: 5,
            creditsEarned: 50,
            pendingReferrals: 2,
          },
        }),
      };
      db.collection().doc().get.mockResolvedValue(mockUserDoc);

      const result = await referralFunctions.getReferralStats(mockRequest);

      expect(result).toEqual({
        stats: {
          totalReferred: 5,
          creditsEarned: 50,
          pendingReferrals: 2,
        },
      });
    });

    it("should return default stats if user has no referral data", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: {},
      };

      // Mock user doc without referral stats
      const mockUserDoc = {
        data: () => ({}),
      };
      db.collection().doc().get.mockResolvedValue(mockUserDoc);

      const result = await referralFunctions.getReferralStats(mockRequest);

      expect(result).toEqual({
        stats: {
          totalReferred: 0,
          creditsEarned: 0,
          pendingReferrals: 0,
        },
      });
    });
  });

  describe("getReferralHistory", () => {
    it("should return user referral history", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: { limit: 5 },
      };

      // Mock query result
      const mockQueryResult = {
        docs: [
          {
            id: "redemption-1",
            data: () => ({
              referralCode: "STORYABC",
              refereeId: "referee-1",
              redeemedAt: "2024-01-01",
              status: "completed",
            }),
          },
          {
            id: "redemption-2",
            data: () => ({
              referralCode: "STORYDEF",
              refereeId: "referee-2",
              redeemedAt: "2024-01-02",
              status: "pending",
            }),
          },
        ],
      };
      mockQuery.get.mockResolvedValue(mockQueryResult);

      const result = await referralFunctions.getReferralHistory(mockRequest);

      expect(result).toEqual({
        history: [
          {
            id: "redemption-1",
            referralCode: "STORYABC",
            refereeId: "referee-1",
            redeemedAt: "2024-01-01",
            status: "completed",
          },
          {
            id: "redemption-2",
            referralCode: "STORYDEF",
            refereeId: "referee-2",
            redeemedAt: "2024-01-02",
            status: "pending",
          },
        ],
      });
    });

    it("should use default limit when not specified", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: {},
      };

      // Mock empty query result
      const mockQueryResult = {
        docs: [],
      };
      mockQuery.get.mockResolvedValue(mockQueryResult);

      const result = await referralFunctions.getReferralHistory(mockRequest);

      expect(result).toEqual({ history: [] });
    });
  });

  describe("Error Handling", () => {
    it("should handle authentication errors", async () => {
      const mockRequest = {
        auth: null,
        data: {},
      };

      await expect(
        referralFunctions.getUserReferralCode(mockRequest)
      ).rejects.toThrow("Authentication required");
    });

    it("should handle database errors gracefully", async () => {
      const mockRequest = {
        auth: { uid: "test-user-id" },
        data: {},
      };

      // Mock database error
      db.collection()
        .doc()
        .get.mockRejectedValue(new Error("Database connection failed"));

      await expect(
        referralFunctions.getUserReferralCode(mockRequest)
      ).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error creating/getting referral code",
        expect.any(Error)
      );
    });
  });
});
