// Mock Firebase dependencies first
const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({ get: mockGet }));
const mockCollection = jest.fn(() => ({ doc: mockDoc }));
const mockDb = { collection: mockCollection };

jest.mock("firebase-admin", () => ({
  firestore: jest.fn(() => mockDb),
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
jest.mock("../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Import the function after mocking
let checkDeletionMarker: any;

// Get the handler function from the mocked onCall
jest.isolateModules(() => {
  require("../checkDeletionMarker");
  // The function is wrapped, we need to extract the handler
  checkDeletionMarker = jest.requireActual(
    "../checkDeletionMarker"
  ).checkDeletionMarker;
});

describe("checkDeletionMarker", () => {
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();

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

    const result = await checkDeletionMarker(mockRequest);

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

    const result = await checkDeletionMarker(mockRequest);

    expect(result).toEqual({ hasMarker: true });
    expect(mockHashEmail).toHaveBeenCalledWith("test@example.com");
    expect(mockCollection).toHaveBeenCalledWith("deletedAccountMarkers");
    expect(mockDoc).toHaveBeenCalledWith("hashed-email-value");
  });

  it("should handle authentication errors properly", async () => {
    // Test missing auth
    mockRequest.auth = null;

    await expect(checkDeletionMarker(mockRequest)).rejects.toThrow(
      "unauthenticated: User must be authenticated."
    );

    // Test missing uid
    mockRequest.auth = { token: { email: "test@example.com" } };

    await expect(checkDeletionMarker(mockRequest)).rejects.toThrow(
      "unauthenticated: User must be authenticated."
    );

    // Test missing email in token
    mockRequest.auth = {
      uid: "test-user-id",
      token: {},
    };

    await expect(checkDeletionMarker(mockRequest)).rejects.toThrow(
      "permission-denied: Unable to verify user email."
    );
  });

  it("should handle network failures gracefully", async () => {
    // Mock network error
    mockGet.mockRejectedValue(new Error("Network error"));

    await expect(checkDeletionMarker(mockRequest)).rejects.toThrow(
      "unknown: Failed to check deletion marker."
    );
  });

  it("should enforce email ownership restrictions", async () => {
    // Test user trying to check different email
    mockRequest.data.email = "different@example.com";
    mockRequest.auth.token.email = "user@example.com";

    await expect(checkDeletionMarker(mockRequest)).rejects.toThrow(
      "permission-denied: You can only check deletion markers for your own email address."
    );

    // Should normalize case and whitespace before comparison
    mockRequest.data.email = "  Test@Example.Com  ";
    mockRequest.auth.token.email = "test@example.com";
    mockGet.mockResolvedValue({ exists: false });

    const result = await checkDeletionMarker(mockRequest);
    expect(result).toEqual({ hasMarker: false });
  });

  it("should handle invalid request data", async () => {
    // Test missing email
    mockRequest.data = {};

    await expect(checkDeletionMarker(mockRequest)).rejects.toThrow(
      "invalid-argument: Email address is required and must be a string."
    );

    // Test non-string email
    mockRequest.data = { email: 123 };

    await expect(checkDeletionMarker(mockRequest)).rejects.toThrow(
      "invalid-argument: Email address is required and must be a string."
    );

    // Test null email
    mockRequest.data = { email: null };

    await expect(checkDeletionMarker(mockRequest)).rejects.toThrow(
      "invalid-argument: Email address is required and must be a string."
    );
  });

  it("should handle edge cases with document existence", async () => {
    // Test document is null (shouldn't happen but defensive)
    mockGet.mockResolvedValue(null);

    const result = await checkDeletionMarker(mockRequest);
    expect(result).toEqual({ hasMarker: null });

    // Test document is undefined
    mockGet.mockResolvedValue(undefined);

    const result2 = await checkDeletionMarker(mockRequest);
    expect(result2).toEqual({ hasMarker: undefined });
  });

  it("should handle crypto utility errors", async () => {
    // Mock hashEmail throwing an error
    mockHashEmail.mockImplementation(() => {
      throw new Error("Crypto error");
    });

    await expect(checkDeletionMarker(mockRequest)).rejects.toThrow(
      "unknown: Failed to check deletion marker."
    );
  });
});
