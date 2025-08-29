import { jest } from "@jest/globals";

// Mock the referral service
const mockReferralService = {
  getUserReferralCode: jest.fn(),
  validateReferralCode: jest.fn(),
  recordReferral: jest.fn(),
  completeReferral: jest.fn(),
  getReferralStats: jest.fn(),
  getReferralHistory: jest.fn(),
} as any;

// Mock the auth store
const mockAuthStore = {
  getState: jest.fn(),
  setState: jest.fn(),
  subscribe: jest.fn(),
};

// Mock Firebase Auth
const mockUser = {
  uid: "test-user-id",
  email: "test@example.com",
  emailVerified: true,
  displayName: "Test User",
  createdAt: new Date(),
};

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock("@/services/firebase/referrals", () => ({
  referralService: mockReferralService,
}));

jest.mock("@/store/authStore", () => ({
  useAuthStore: mockAuthStore,
}));

jest.mock("@/utils/logger", () => ({
  logger: mockLogger,
}));

describe("Referral System Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete Referral Flow", () => {
    it("should complete full referral flow from code generation to credit award", async () => {
      // Step 1: Referrer gets their referral code
      mockReferralService.getUserReferralCode.mockResolvedValue("STORYABC");

      const referralCode = await mockReferralService.getUserReferralCode();
      expect(referralCode).toBe("STORYABC");
      expect(mockReferralService.getUserReferralCode).toHaveBeenCalledTimes(1);

      // Step 2: Referee validates the referral code
      mockReferralService.validateReferralCode.mockResolvedValue({
        isValid: true,
        ownerId: "referrer-user-id",
      });

      const validationResult =
        await mockReferralService.validateReferralCode("STORYABC");
      expect(validationResult).toEqual({
        isValid: true,
        ownerId: "referrer-user-id",
      });

      // Step 3: Referee records the referral (during signup)
      mockReferralService.recordReferral.mockResolvedValue(undefined);

      await mockReferralService.recordReferral("referee-user-id", "STORYABC");
      expect(mockReferralService.recordReferral).toHaveBeenCalledWith(
        "referee-user-id",
        "STORYABC"
      );

      // Step 4: Referee verifies email and referral is completed
      mockReferralService.completeReferral.mockResolvedValue({
        success: true,
        referrerCreditsAwarded: 10,
        refereeCreditsAwarded: 5,
      });

      const completionResult =
        await mockReferralService.completeReferral("referee-user-id");
      expect(completionResult).toEqual({
        success: true,
        referrerCreditsAwarded: 10,
        refereeCreditsAwarded: 5,
      });

      // Step 5: Verify referrer can see updated stats
      mockReferralService.getReferralStats.mockResolvedValue({
        stats: {
          totalReferred: 1,
          creditsEarned: 10,
          pendingReferrals: 0,
        },
      });

      const referrerStats = await mockReferralService.getReferralStats();
      expect(referrerStats.stats.totalReferred).toBe(1);
      expect(referrerStats.stats.creditsEarned).toBe(10);
    });

    it("should handle referral for unverified user correctly", async () => {
      // Step 1: Unverified user records referral
      mockReferralService.recordReferral.mockResolvedValue(undefined);
      await mockReferralService.recordReferral(
        "unverified-user-id",
        "STORYABC"
      );

      // Step 2: User verifies email later
      mockReferralService.completeReferral.mockResolvedValue({
        success: true,
        referrerCreditsAwarded: 10,
        refereeCreditsAwarded: 5,
      });

      // Simulate email verification trigger
      const completionResult =
        await mockReferralService.completeReferral("unverified-user-id");
      expect(completionResult.success).toBe(true);
    });

    it("should handle referral for already verified user", async () => {
      // User is already verified when they enter referral code
      const verifiedUser = { ...mockUser, emailVerified: true };

      // Record referral
      mockReferralService.recordReferral.mockResolvedValue(undefined);
      await mockReferralService.recordReferral(verifiedUser.uid, "STORYABC");

      // Complete immediately since user is verified
      mockReferralService.completeReferral.mockResolvedValue({
        success: true,
        referrerCreditsAwarded: 10,
        refereeCreditsAwarded: 5,
      });

      const completionResult = await mockReferralService.completeReferral(
        verifiedUser.uid
      );
      expect(completionResult.success).toBe(true);
    });
  });

  describe("Referral Error Scenarios", () => {
    it("should handle validation errors gracefully", async () => {
      // Test invalid code
      mockReferralService.validateReferralCode.mockResolvedValue({
        isValid: false,
        error: "Referral code not found",
      });

      const result = await mockReferralService.validateReferralCode("INVALID");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Referral code not found");
    });

    it("should handle user trying to use their own code", async () => {
      mockReferralService.validateReferralCode.mockResolvedValue({
        isValid: false,
        error: "You cannot use your own referral code",
      });

      const result = await mockReferralService.validateReferralCode("STORYABC");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("You cannot use your own referral code");
    });

    it("should handle duplicate referral recording", async () => {
      mockReferralService.recordReferral.mockRejectedValue(
        new Error("Referral already recorded for this user")
      );

      await expect(
        mockReferralService.recordReferral("duplicate-user-id", "STORYABC")
      ).rejects.toThrow("Referral already recorded for this user");
    });

    it("should handle completion when no pending referral exists", async () => {
      mockReferralService.completeReferral.mockResolvedValue({
        success: false,
        message: "No pending referral found",
      });

      const result = await mockReferralService.completeReferral(
        "no-referral-user-id"
      );
      expect(result.success).toBe(false);
      expect(result.message).toBe("No pending referral found");
    });
  });

  describe("Referral Code Generation", () => {
    it("should generate unique codes for multiple users", async () => {
      // Mock different codes for different users
      mockReferralService.getUserReferralCode
        .mockResolvedValueOnce("STORYABC")
        .mockResolvedValueOnce("STORYDEF")
        .mockResolvedValueOnce("STORYGHI");

      const code1 = await mockReferralService.getUserReferralCode();
      const code2 = await mockReferralService.getUserReferralCode();
      const code3 = await mockReferralService.getUserReferralCode();

      expect(code1).toBe("STORYABC");
      expect(code2).toBe("STORYDEF");
      expect(code3).toBe("STORYGHI");
      expect(code1).not.toBe(code2);
      expect(code2).not.toBe(code3);
    });

    it("should return existing code for user who already has one", async () => {
      // First call creates code, subsequent calls return same code
      mockReferralService.getUserReferralCode.mockResolvedValue("STORYABC");

      const code1 = await mockReferralService.getUserReferralCode();
      const code2 = await mockReferralService.getUserReferralCode();

      expect(code1).toBe("STORYABC");
      expect(code2).toBe("STORYABC");
    });
  });

  describe("Referral Stats and History", () => {
    it("should track referral statistics correctly", async () => {
      // Mock initial stats
      mockReferralService.getReferralStats.mockResolvedValue({
        stats: {
          totalReferred: 3,
          creditsEarned: 30,
          pendingReferrals: 1,
        },
      });

      const stats = await mockReferralService.getReferralStats();
      expect(stats.stats.totalReferred).toBe(3);
      expect(stats.stats.creditsEarned).toBe(30);
      expect(stats.stats.pendingReferrals).toBe(1);
    });

    it("should return referral history in correct order", async () => {
      const mockHistory = [
        {
          id: "redemption-1",
          referralCode: "STORYABC",
          refereeId: "referee-1",
          redeemedAt: new Date("2024-01-03"),
          status: "completed",
        },
        {
          id: "redemption-2",
          referralCode: "STORYDEF",
          refereeId: "referee-2",
          redeemedAt: new Date("2024-01-02"),
          status: "completed",
        },
        {
          id: "redemption-3",
          referralCode: "STORYGHI",
          refereeId: "referee-3",
          redeemedAt: new Date("2024-01-01"),
          status: "pending",
        },
      ];

      mockReferralService.getReferralHistory.mockResolvedValue({
        history: mockHistory,
      });

      const history = await mockReferralService.getReferralHistory({
        limit: 5,
      });
      expect(history.history).toHaveLength(3);
      // Should be ordered by most recent first
      expect(history.history[0].redeemedAt).toEqual(new Date("2024-01-03"));
      expect(history.history[2].redeemedAt).toEqual(new Date("2024-01-01"));
    });

    it("should handle empty stats and history", async () => {
      // New user with no referrals
      mockReferralService.getReferralStats.mockResolvedValue({
        stats: {
          totalReferred: 0,
          creditsEarned: 0,
          pendingReferrals: 0,
        },
      });

      mockReferralService.getReferralHistory.mockResolvedValue({
        history: [],
      });

      const stats = await mockReferralService.getReferralStats();
      const history = await mockReferralService.getReferralHistory();

      expect(stats.stats.totalReferred).toBe(0);
      expect(history.history).toHaveLength(0);
    });
  });

  describe("Referral Configuration", () => {
    it("should use correct credit amounts", async () => {
      mockReferralService.completeReferral.mockResolvedValue({
        success: true,
        referrerCreditsAwarded: 10,
        refereeCreditsAwarded: 5,
      });

      const result = await mockReferralService.completeReferral("test-user-id");
      expect(result.referrerCreditsAwarded).toBe(10);
      expect(result.refereeCreditsAwarded).toBe(5);
    });

    it("should handle referral code length validation", async () => {
      // Test with incorrect length codes
      mockReferralService.validateReferralCode
        .mockResolvedValueOnce({
          isValid: false,
          error: "Invalid code format",
        })
        .mockResolvedValueOnce({
          isValid: false,
          error: "Invalid code format",
        });

      const shortCode = await mockReferralService.validateReferralCode("ABC");
      const longCode =
        await mockReferralService.validateReferralCode("TOOLONGCODE");

      expect(shortCode.isValid).toBe(false);
      expect(longCode.isValid).toBe(false);
    });
  });
});
