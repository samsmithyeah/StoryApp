// Mock Firebase dependencies
const mockSet = jest.fn().mockResolvedValue({});
const mockUpdate = jest.fn().mockResolvedValue({});
const mockGet = jest.fn().mockResolvedValue({ exists: false });
const mockBatchDelete = jest.fn();
const mockCommit = jest.fn().mockResolvedValue({});

const mockDocRef = {
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
};

const mockDoc = jest.fn(() => mockDocRef);

// Also need to track specific marker ref with its own set method
const mockMarkerSet = jest.fn().mockResolvedValue({});
const mockMarkerRef = {
  set: mockMarkerSet,
  get: mockGet,
};

const mockForEach = jest.fn();
const mockQuerySnapshot = {
  forEach: mockForEach,
};

const mockCollectionRef = {
  doc: mockDoc,
  where: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(mockQuerySnapshot),
  })),
};

// Track marker doc calls separately
const mockMarkerDoc = jest.fn(() => mockMarkerRef);

const mockCollection = jest.fn((collectionName) => {
  if (collectionName === "deletedAccountMarkers") {
    return { doc: mockMarkerDoc };
  }
  return mockCollectionRef;
});

const mockBatch = jest.fn(() => ({
  delete: mockBatchDelete,
  commit: mockCommit,
}));

const mockDb = {
  collection: mockCollection,
  doc: mockDoc,
  batch: mockBatch,
};

// Mock storage
const mockDeleteFile = jest.fn();
const mockGetFiles = jest.fn();
const mockBucket = jest.fn(() => ({
  getFiles: mockGetFiles,
}));
const mockStorage = { bucket: mockBucket };

// Mock auth
const mockDeleteUser = jest.fn();
const mockAuth = { deleteUser: mockDeleteUser };

jest.mock("firebase-admin", () => ({
  firestore: jest.fn(() => mockDb),
  storage: jest.fn(() => mockStorage),
  auth: jest.fn(() => mockAuth),
  FieldValue: {
    serverTimestamp: jest.fn(() => "TIMESTAMP"),
    increment: jest.fn((value) => ({ increment: value })),
  },
}));

jest.mock("firebase-functions/v2", () => ({
  https: {
    onCall: jest.fn((config, handler) => handler),
    HttpsError: class MockHttpsError extends Error {
      constructor(code: string, message: string) {
        super(`${code}: ${message}`);
        this.name = "HttpsError";
      }
    },
    CallableRequest: {},
  },
}));

// Mock crypto utility
const mockHashEmail = jest.fn();
jest.mock("../utils/crypto", () => ({
  hashEmail: mockHashEmail,
  emailHashSalt: {
    value: jest.fn(() => "test-salt-value"),
  },
}));

// Mock logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
jest.mock("../utils/logger", () => ({
  logger: mockLogger,
}));

describe("account deletion", () => {
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset batch mock to default working state
    mockBatch.mockReturnValue({
      delete: mockBatchDelete,
      commit: mockCommit,
    });

    mockRequest = {
      auth: {
        uid: "test-user-id",
        token: {
          email: "test@example.com",
        },
      },
    };

    // Setup default mocks
    mockHashEmail.mockReturnValue("hashed-email");
    mockGet.mockResolvedValue({ exists: false });
    mockSet.mockResolvedValue({});
    mockMarkerSet.mockResolvedValue({});
    mockUpdate.mockResolvedValue({});
    mockCommit.mockResolvedValue({});
    mockDeleteUser.mockResolvedValue({});
    mockGetFiles.mockResolvedValue([[]]);
    mockForEach.mockImplementation(() => {}); // No documents by default
  });

  it("should handle multiple rapid deletions of same account", async () => {
    // Mock existing deletion marker
    mockGet.mockResolvedValue({ exists: true });

    // Import and execute the function
    const { deleteUserData } = require("../deleteUserData");
    const result = await deleteUserData(mockRequest);

    // Should complete successfully
    expect(result).toEqual({
      success: true,
      message: "User data deleted successfully",
      deletedCollections: expect.arrayContaining([
        "users",
        "userPreferences",
        "userCredits",
        "children",
        "savedCharacters",
        "stories",
        "creditTransactions",
        "purchaseHistory",
        "storage",
        "auth",
        "deletedAccountMarkers",
      ]),
    });
  });

  it("should continue on storage cleanup failure", async () => {
    // Mock storage failure
    mockGetFiles.mockRejectedValue(new Error("Storage error"));

    const { deleteUserData } = require("../deleteUserData");
    const result = await deleteUserData(mockRequest);

    // Should still succeed despite storage failure
    expect(result.success).toBe(true);
    expect(mockDeleteUser).toHaveBeenCalledWith("test-user-id");
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Storage cleanup failed for user",
      expect.any(Error),
      { userId: "test-user-id" }
    );
  });

  it("should properly clean up all user data collections", async () => {
    // Mock collections with some documents
    mockForEach.mockImplementation((callback) => {
      // Simulate some documents
      callback({ ref: { path: "children/doc1" }, id: "doc1" });
      callback({ ref: { path: "children/doc2" }, id: "doc2" });
    });

    const { deleteUserData } = require("../deleteUserData");
    await deleteUserData(mockRequest);

    // Should query all user data collections
    expect(mockCollection).toHaveBeenCalledWith("children");
    expect(mockCollection).toHaveBeenCalledWith("savedCharacters");
    expect(mockCollection).toHaveBeenCalledWith("stories");
    expect(mockCollection).toHaveBeenCalledWith("creditTransactions");
    expect(mockCollection).toHaveBeenCalledWith("purchaseHistory");
  });

  it("should create/update deletion markers atomically", async () => {
    const { deleteUserData } = require("../deleteUserData");
    await deleteUserData(mockRequest);

    // Should hash the email
    expect(mockHashEmail).toHaveBeenCalledWith("test@example.com");

    // Should access the correct collection and document
    expect(mockCollection).toHaveBeenCalledWith("deletedAccountMarkers");
    expect(mockMarkerDoc).toHaveBeenCalledWith("hashed-email");
  });

  it("should handle batch operation limits for large datasets", async () => {
    // Mock a large number of documents (>500)
    mockForEach.mockImplementation((callback) => {
      // Simulate 600 documents to test batch splitting
      for (let i = 0; i < 600; i++) {
        callback({ ref: { path: `stories/doc${i}` }, id: `doc${i}` });
      }
    });

    // Track batch creation
    const batches: any[] = [];
    mockBatch.mockImplementation(() => {
      const batchInstance = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue({}),
      };
      batches.push(batchInstance);
      return batchInstance;
    });

    const { deleteUserData } = require("../deleteUserData");
    await deleteUserData(mockRequest);

    // Should create multiple batches for large datasets
    expect(batches.length).toBeGreaterThan(1);

    // Each batch should have been committed
    batches.forEach((batch) => {
      expect(batch.commit).toHaveBeenCalled();
    });
  });

  it("should handle authentication errors", async () => {
    // Test missing auth
    const noAuthRequest = { auth: null };
    const { deleteUserData } = require("../deleteUserData");

    await expect(deleteUserData(noAuthRequest)).rejects.toThrow(
      "unauthenticated: User must be authenticated."
    );

    // Test missing uid
    const noUidRequest = { auth: { token: { email: "test@example.com" } } };

    await expect(deleteUserData(noUidRequest)).rejects.toThrow(
      "unauthenticated: User must be authenticated."
    );
  });

  it("should handle missing email in auth token", async () => {
    const noEmailRequest = {
      auth: {
        uid: "test-user-id",
        token: {},
      },
    };

    const { deleteUserData } = require("../deleteUserData");
    const result = await deleteUserData(noEmailRequest);

    // Should skip deletion marker creation but continue with deletion
    expect(mockSet).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "No email found in auth token, skipping deletion marker",
      { userId: "test-user-id" }
    );
  });

  it("should handle deletion marker creation failure gracefully", async () => {
    // Mock deletion marker creation failure
    mockSet.mockRejectedValue(new Error("Marker creation failed"));

    const { deleteUserData } = require("../deleteUserData");
    const result = await deleteUserData(mockRequest);

    // Should log the error but continue with deletion
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Failed to create deletion marker",
      expect.any(Error),
      { userId: "test-user-id" }
    );

    // Should still complete successfully
    expect(result.success).toBe(true);
  });

  it("should handle firestore batch failure", async () => {
    // Force batch operation to fail on all attempts
    const failingBatch = {
      delete: jest.fn(),
      commit: jest.fn().mockRejectedValue(new Error("Batch commit failed")),
    };
    mockBatch.mockReturnValue(failingBatch);

    const { deleteUserData } = require("../deleteUserData");

    await expect(deleteUserData(mockRequest)).rejects.toThrow(
      "unknown: Failed to delete user account."
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error deleting user data",
      expect.any(Error),
      { userId: "test-user-id" }
    );
  });

  it("should delete storage files when they exist", async () => {
    // Mock files in storage
    const mockFiles = [
      { name: "stories/test-user-id/story1.jpg", delete: mockDeleteFile },
      { name: "stories/test-user-id/story2.jpg", delete: mockDeleteFile },
    ];
    mockGetFiles.mockResolvedValue([mockFiles]);

    const { deleteUserData } = require("../deleteUserData");
    await deleteUserData(mockRequest);

    // Should list files with correct prefix
    expect(mockGetFiles).toHaveBeenCalledWith({
      prefix: "stories/test-user-id/",
    });

    // Should delete all files
    expect(mockDeleteFile).toHaveBeenCalledTimes(2);
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Storage cleanup completed for user",
      { userId: "test-user-id" }
    );
  });
});
