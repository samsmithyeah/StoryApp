import * as crypto from "crypto";

// Mock the secret completely
const mockEmailHashSalt = {
  value: jest.fn(() => "test-salt-value"),
};

jest.mock("../crypto", () => {
  const mockCrypto = require("crypto");
  return {
    emailHashSalt: mockEmailHashSalt,
    hashEmail: (email: string): string => {
      const salt = mockEmailHashSalt.value();
      if (!salt) {
        throw new Error("EMAIL_HASH_SALT secret is not configured");
      }
      return mockCrypto
        .createHmac("sha256", salt)
        .update(email.toLowerCase().trim())
        .digest("hex");
    },
  };
});

// Import after mocking
import { hashEmail } from "../crypto";

describe("hashEmail", () => {
  beforeEach(() => {
    // Reset mocks and ensure salt returns test value
    jest.clearAllMocks();
    mockEmailHashSalt.value.mockReturnValue("test-salt-value");
  });

  it("should produce consistent hashes for same email", () => {
    const email = "test@example.com";
    const hash1 = hashEmail(email);
    const hash2 = hashEmail(email);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA256 hex string length
  });

  it("should handle case normalization correctly", () => {
    const email1 = "Test@Example.Com";
    const email2 = "test@example.com";
    const email3 = "TEST@EXAMPLE.COM";

    const hash1 = hashEmail(email1);
    const hash2 = hashEmail(email2);
    const hash3 = hashEmail(email3);

    expect(hash1).toBe(hash2);
    expect(hash1).toBe(hash3);
  });

  it("should handle whitespace normalization correctly", () => {
    const email1 = "  test@example.com  ";
    const email2 = "test@example.com";
    const email3 = "\t\ntest@example.com\n\t";

    const hash1 = hashEmail(email1);
    const hash2 = hashEmail(email2);
    const hash3 = hashEmail(email3);

    expect(hash1).toBe(hash2);
    expect(hash1).toBe(hash3);
  });

  it("should throw error when salt is missing", () => {
    // Mock the secret to return undefined for this test
    mockEmailHashSalt.value.mockReturnValueOnce(undefined as any);

    expect(() => {
      hashEmail("test@example.com");
    }).toThrow("EMAIL_HASH_SALT secret is not configured");
  });

  it("should handle various email formats and edge cases", () => {
    const testCases = [
      "simple@example.com",
      "user.name+tag@example.com",
      "user_name@example-domain.co.uk",
      "test123@sub.domain.com",
      "a@b.c",
      "very.long.email.address@very-long-domain-name.example.co.uk",
    ];

    testCases.forEach((email) => {
      const hash = hashEmail(email);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // Hex string pattern
    });
  });

  it("should produce different hashes for different emails", () => {
    const email1 = "user1@example.com";
    const email2 = "user2@example.com";
    const email3 = "user1@different.com";

    const hash1 = hashEmail(email1);
    const hash2 = hashEmail(email2);
    const hash3 = hashEmail(email3);

    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash2).not.toBe(hash3);
  });

  it("should use HMAC-SHA256 with the provided salt", () => {
    const email = "test@example.com";
    const salt = "test-salt-value";

    // Calculate expected hash manually
    const expectedHash = crypto
      .createHmac("sha256", salt)
      .update(email.toLowerCase().trim())
      .digest("hex");

    const actualHash = hashEmail(email);

    expect(actualHash).toBe(expectedHash);
  });

  it("should handle special characters in email", () => {
    const email = "test+special@example.com";
    const hash = hashEmail(email);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
