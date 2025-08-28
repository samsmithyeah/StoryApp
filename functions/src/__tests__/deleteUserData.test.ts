// Mock Firebase Admin SDK with simplified structure
jest.mock("firebase-admin", () => {
  const mockSet = jest.fn().mockResolvedValue({});
  const mockGet = jest.fn().mockResolvedValue({ exists: false });
  const mockDelete = jest.fn();
  const mockCommit = jest.fn().mockResolvedValue({});
  const mockForEach = jest.fn();

  const mockDoc = jest.fn(() => ({
    set: mockSet,
    get: mockGet,
    delete: mockDelete,
  }));

  const mockCollection = jest.fn(() => ({
    doc: mockDoc,
    where: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({
        forEach: mockForEach,
      }),
    })),
  }));

  const mockBatch = jest.fn(() => ({
    delete: jest.fn(),
    commit: mockCommit,
  }));

  const mockBucket = jest.fn(() => ({
    getFiles: jest.fn().mockResolvedValue([[]]),
  }));

  return {
    firestore: jest.fn(() => ({
      collection: mockCollection,
      doc: mockDoc,
      batch: mockBatch,
    })),
    storage: jest.fn(() => ({
      bucket: mockBucket,
    })),
    auth: jest.fn(() => ({
      deleteUser: jest.fn().mockResolvedValue({}),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => "TIMESTAMP"),
      increment: jest.fn((value: any) => ({ increment: value })),
    },
  };
});

// Store the handler function for testing
let actualDeleteHandler: any;

// Mock Firebase Functions
jest.mock("firebase-functions/v2", () => ({
  https: {
    onCall: jest.fn((config: any, handler: any) => {
      actualDeleteHandler = handler;
      return handler;
    }),
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
jest.mock("../utils/crypto", () => ({
  hashEmail: jest.fn(),
  emailHashSalt: {
    value: jest.fn(() => "test-salt-value"),
  },
}));

// Mock logger
jest.mock("../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Import the function after mocking to trigger the handler capture
import "../deleteUserData";
import { hashEmail } from "../utils/crypto";
import * as admin from "firebase-admin";

// Get access to the mocked functions
const mockHashEmail = hashEmail as jest.MockedFunction<typeof hashEmail>;

describe("deleteUserData", () => {
  let mockRequest: any;
  let mockFirestore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mock instances
    mockFirestore = (admin.firestore as unknown as jest.Mock)();

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
  });

  it("should handle multiple rapid deletions of same account", async () => {
    // Mock existing deletion marker
    mockFirestore.collection().doc().get.mockResolvedValue({ exists: true });

    const result = await actualDeleteHandler(mockRequest);

    // Should complete successfully
    expect(result).toEqual({
      success: true,
      message: "User data deleted successfully",
      deletedCollections: expect.any(Array),
    });
  });

  it("should handle successful deletion", async () => {
    const result = await actualDeleteHandler(mockRequest);

    // Should complete successfully
    expect(result.success).toBe(true);
    expect(result.deletedCollections).toContain("auth");
    expect(result.message).toBe("User data deleted successfully");
  });

  it("should handle batch operations", async () => {
    // Mock documents exist
    mockFirestore
      .collection()
      .where()
      .get.mockResolvedValue({
        forEach: jest.fn((callback: any) => {
          // Simulate 2 documents
          callback({ id: "doc1", ref: { delete: jest.fn() } });
          callback({ id: "doc2", ref: { delete: jest.fn() } });
        }),
      });

    const result = await actualDeleteHandler(mockRequest);

    expect(result.success).toBe(true);
    expect(mockFirestore.batch).toHaveBeenCalled();
  });

  it("should create deletion marker for new deletions", async () => {
    // Mock no existing deletion marker
    mockFirestore.collection().doc().get.mockResolvedValue({ exists: false });

    // Mock no documents in collections (forEach doesn't call callback)
    mockFirestore.collection().where().get.mockResolvedValue({
      forEach: jest.fn(),
    });

    const result = await actualDeleteHandler(mockRequest);

    // Should have created deletion marker
    expect(mockHashEmail).toHaveBeenCalledWith("test@example.com");
    expect(mockFirestore.collection).toHaveBeenCalledWith(
      "deletedAccountMarkers"
    );

    expect(result.success).toBe(true);
  });
});
