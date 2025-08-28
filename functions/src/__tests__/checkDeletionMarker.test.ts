// Mock Firebase Admin SDK directly in the factory
jest.mock("firebase-admin", () => {
  const mockGet = jest.fn();
  const mockDoc = jest.fn(() => ({ get: mockGet }));
  const mockCollection = jest.fn(() => ({ doc: mockDoc }));

  return {
    firestore: jest.fn(() => ({ collection: mockCollection })),
  };
});

// Store the handler function for testing
let actualHandler: any;

// Mock Firebase Functions
jest.mock("firebase-functions/v2", () => ({
  https: {
    onCall: jest.fn((config, handler) => {
      actualHandler = handler;
      return handler;
    }),
    HttpsError: class MockHttpsError extends Error {
      constructor(code: string, message: string) {
        super(`${code}: ${message}`);
        this.name = "HttpsError";
      }
    },
  },
}));

// Mock crypto utility
jest.mock("../utils/crypto", () => {
  const mockHashEmailDirect = jest.fn();
  return {
    hashEmail: mockHashEmailDirect,
    emailHashSalt: {
      value: jest.fn(() => "test-salt-value"),
    },
  };
});

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
import "../checkDeletionMarker";
import { hashEmail } from "../utils/crypto";
import * as admin from "firebase-admin";

// Get access to the mocked functions
const mockHashEmail = hashEmail as jest.MockedFunction<typeof hashEmail>;
const mockFirestore = admin.firestore as jest.MockedFunction<
  typeof admin.firestore
>;

describe("checkDeletionMarker", () => {
  let mockRequest: any;
  let mockGet: jest.Mock;
  let mockDoc: jest.Mock;
  let mockCollection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mock functions from the mocked firestore
    const firestoreInstance = mockFirestore();
    mockCollection = firestoreInstance.collection as jest.Mock;
    mockDoc = mockCollection().doc as jest.Mock;
    mockGet = mockDoc().get as jest.Mock;

    // Setup default request
    mockRequest = {
      auth: {
        uid: "test-user-id",
        token: {
          email: "test@example.com",
        },
      },
      data: {
        email: "test@example.com",
      },
    };

    // Setup default mocks
    mockHashEmail.mockReturnValue("hashed-email-value");
  });

  it("should return false for non-deleted emails", async () => {
    // Mock document doesn't exist
    mockGet.mockResolvedValue({
      exists: false,
    });

    const result = await actualHandler(mockRequest);

    expect(result).toEqual({ hasMarker: false });
    expect(mockHashEmail).toHaveBeenCalledWith("test@example.com");
    expect(mockCollection).toHaveBeenCalledWith("deletedAccountMarkers");
    expect(mockDoc).toHaveBeenCalledWith("hashed-email-value");
  });

  it("should return true for deleted emails", async () => {
    // Mock document exists
    mockGet.mockResolvedValue({
      exists: true,
    });

    const result = await actualHandler(mockRequest);

    expect(result).toEqual({ hasMarker: true });
    expect(mockHashEmail).toHaveBeenCalledWith("test@example.com");
    expect(mockCollection).toHaveBeenCalledWith("deletedAccountMarkers");
    expect(mockDoc).toHaveBeenCalledWith("hashed-email-value");
  });

  it("should handle authentication errors properly", async () => {
    // Test missing auth
    mockRequest.auth = null;

    await expect(actualHandler(mockRequest)).rejects.toThrow(
      "unauthenticated: User must be authenticated."
    );

    // Test missing uid
    mockRequest.auth = { token: { email: "test@example.com" } };

    await expect(actualHandler(mockRequest)).rejects.toThrow(
      "unauthenticated: User must be authenticated."
    );

    // Test missing email in token
    mockRequest.auth = {
      uid: "test-user-id",
      token: {},
    };

    await expect(actualHandler(mockRequest)).rejects.toThrow(
      "permission-denied: Unable to verify user email."
    );
  });

  it("should handle network failures gracefully", async () => {
    // Mock network error
    mockGet.mockRejectedValue(new Error("Network error"));

    await expect(actualHandler(mockRequest)).rejects.toThrow(
      "unknown: Failed to check deletion marker."
    );
  });

  it("should enforce email ownership restrictions", async () => {
    // Test user trying to check different email
    mockRequest.data.email = "different@example.com";
    mockRequest.auth.token.email = "user@example.com";

    await expect(actualHandler(mockRequest)).rejects.toThrow(
      "permission-denied: You can only check deletion markers for your own email address."
    );

    // Should normalize case and whitespace before comparison
    mockRequest.data.email = "  Test@Example.Com  ";
    mockRequest.auth.token.email = "test@example.com";
    mockGet.mockResolvedValue({ exists: false });

    const result = await actualHandler(mockRequest);
    expect(result).toEqual({ hasMarker: false });
  });

  it("should handle invalid request data", async () => {
    // Test missing email
    mockRequest.data = {};

    await expect(actualHandler(mockRequest)).rejects.toThrow(
      "invalid-argument: Email address is required and must be a string."
    );

    // Test non-string email
    mockRequest.data = { email: 123 };

    await expect(actualHandler(mockRequest)).rejects.toThrow(
      "invalid-argument: Email address is required and must be a string."
    );

    // Test null email
    mockRequest.data = { email: null };

    await expect(actualHandler(mockRequest)).rejects.toThrow(
      "invalid-argument: Email address is required and must be a string."
    );
  });

  it("should handle edge cases with document existence", async () => {
    // Test document is null (shouldn't happen but defensive)
    mockGet.mockResolvedValue(null);

    const result = await actualHandler(mockRequest);
    expect(result).toEqual({ hasMarker: null });

    // Test document is undefined
    mockGet.mockResolvedValue(undefined);

    const result2 = await actualHandler(mockRequest);
    expect(result2).toEqual({ hasMarker: undefined });
  });

  it("should handle crypto utility errors", async () => {
    // Mock hashEmail throwing an error
    mockHashEmail.mockImplementation(() => {
      throw new Error("Crypto error");
    });

    await expect(actualHandler(mockRequest)).rejects.toThrow(
      "unknown: Failed to check deletion marker."
    );
  });
});
