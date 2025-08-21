import {
  generateStory,
  getStories,
  getStory,
  generateThemeSuggestions,
} from "@/services/firebase/stories";
import { httpsCallable } from "@react-native-firebase/functions";
import { authService, functionsService } from "@/services/firebase/config";
import { creditsService } from "@/services/firebase/credits";

// Mock dependencies
jest.mock("@react-native-firebase/functions");
jest.mock("@/services/firebase/config", () => ({
  authService: {
    currentUser: { uid: "test-user-id" },
  },
  functionsService: {},
}));
jest.mock("@/services/firebase/credits");

describe("Story Service", () => {
  const mockHttpsCallable = httpsCallable as jest.MockedFunction<
    typeof httpsCallable
  >;
  const mockCreditsService = creditsService as jest.Mocked<
    typeof creditsService
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateStory", () => {
    it("should successfully generate a story when user has sufficient credits", async () => {
      // Setup
      const mockStoryConfig = {
        selectedChildren: [],
        theme: "Adventure",
        pageCount: 5,
        illustrationStyle: "watercolor",
      };

      mockCreditsService.getUserCredits.mockResolvedValue({
        userId: "test-user-id",
        balance: 10,
        lifetimeUsed: 0,
        subscriptionActive: false,
        freeCreditsGranted: true,
        lastUpdated: new Date(),
      });

      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: true,
          storyId: "story-123",
          story: { title: "Test Story" },
          imageGenerationStatus: "pending",
        },
      });
      mockHttpsCallable.mockReturnValue(mockCallable);

      mockCreditsService.useCredits.mockResolvedValue({
        success: true,
        remainingBalance: 5,
      });

      // Execute
      const result = await generateStory(mockStoryConfig);

      // Assert
      expect(mockCreditsService.getUserCredits).toHaveBeenCalledWith(
        "test-user-id"
      );
      expect(mockHttpsCallable).toHaveBeenCalledWith(
        functionsService,
        "generateStory",
        {
          timeout: 180000,
        }
      );
      expect(mockCallable).toHaveBeenCalledWith(mockStoryConfig);
      expect(mockCreditsService.useCredits).toHaveBeenCalledWith(
        "test-user-id",
        5,
        "story-123"
      );
      expect(result).toEqual({
        storyId: "story-123",
        story: { title: "Test Story" },
        imageGenerationStatus: "pending",
      });
    });

    it("should throw error when user has insufficient credits", async () => {
      // Setup
      const mockStoryConfig = {
        selectedChildren: [],
        theme: "Adventure",
        pageCount: 5,
        illustrationStyle: "watercolor",
      };

      mockCreditsService.getUserCredits.mockResolvedValue({
        userId: "test-user-id",
        balance: 2,
        lifetimeUsed: 3,
        subscriptionActive: false,
        freeCreditsGranted: true,
        lastUpdated: new Date(),
      });

      // Execute & Assert
      await expect(generateStory(mockStoryConfig)).rejects.toThrow(
        "Insufficient credits. You need 5 credits to generate this story."
      );
      expect(mockHttpsCallable).not.toHaveBeenCalled();
    });

    it("should throw error when user is not authenticated", async () => {
      // Setup
      (authService.currentUser as any) = null;
      const mockStoryConfig = {
        selectedChildren: [],
        theme: "Adventure",
        pageCount: 5,
        illustrationStyle: "watercolor",
      };

      // Execute & Assert
      await expect(generateStory(mockStoryConfig)).rejects.toThrow(
        "User must be authenticated"
      );
    });

    it("should handle story generation failure", async () => {
      // Setup
      (authService.currentUser as any) = { uid: "test-user-id" }; // Restore the user
      const mockStoryConfig = {
        selectedChildren: [],
        theme: "Adventure",
        pageCount: 3,
        illustrationStyle: "watercolor",
      };

      mockCreditsService.getUserCredits.mockResolvedValue({
        userId: "test-user-id",
        balance: 10,
        lifetimeUsed: 0,
        subscriptionActive: false,
        freeCreditsGranted: true,
        lastUpdated: new Date(),
      });

      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: false,
          error: "Generation failed due to content policy",
        },
      });
      mockHttpsCallable.mockReturnValue(mockCallable);

      // Execute & Assert
      await expect(generateStory(mockStoryConfig)).rejects.toThrow(
        "Generation failed due to content policy"
      );
      expect(mockCreditsService.useCredits).not.toHaveBeenCalled();
    });

    it("should handle missing storyId in successful response", async () => {
      // Setup
      (authService.currentUser as any) = { uid: "test-user-id" }; // Restore the user
      const mockStoryConfig = {
        selectedChildren: [],
        theme: "Adventure",
        pageCount: 3,
        illustrationStyle: "watercolor",
      };

      mockCreditsService.getUserCredits.mockResolvedValue({
        userId: "test-user-id",
        balance: 10,
        lifetimeUsed: 0,
        subscriptionActive: false,
        freeCreditsGranted: true,
        lastUpdated: new Date(),
      });

      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: true,
          // Missing storyId
        },
      });
      mockHttpsCallable.mockReturnValue(mockCallable);

      // Execute & Assert
      await expect(generateStory(mockStoryConfig)).rejects.toThrow(
        "Story generation succeeded but no story ID returned"
      );
    });
  });

  describe("getStories", () => {
    it("should successfully fetch stories", async () => {
      // Setup
      const mockStories = [
        { id: "1", title: "Story 1" },
        { id: "2", title: "Story 2" },
      ];

      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: true,
          stories: mockStories,
        },
      });
      mockHttpsCallable.mockReturnValue(mockCallable);

      // Execute
      const result = await getStories();

      // Assert
      expect(mockHttpsCallable).toHaveBeenCalledWith(
        functionsService,
        "getStories"
      );
      expect(result).toEqual(mockStories);
    });

    it("should throw error when fetch fails", async () => {
      // Setup
      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: false,
        },
      });
      mockHttpsCallable.mockReturnValue(mockCallable);

      // Execute & Assert
      await expect(getStories()).rejects.toThrow("Failed to fetch stories");
    });
  });

  describe("getStory", () => {
    it("should successfully fetch a single story", async () => {
      // Setup
      const mockStory = { id: "story-123", title: "Test Story" };
      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: true,
          story: mockStory,
        },
      });
      mockHttpsCallable.mockReturnValue(mockCallable);

      // Execute
      const result = await getStory("story-123");

      // Assert
      expect(mockHttpsCallable).toHaveBeenCalledWith(
        functionsService,
        "getStory"
      );
      expect(mockCallable).toHaveBeenCalledWith({ storyId: "story-123" });
      expect(result).toEqual(mockStory);
    });
  });

  describe("generateThemeSuggestions", () => {
    beforeEach(() => {
      // Reset the current user for theme tests
      (authService.currentUser as any) = { uid: "test-user-id" };
    });

    it("should successfully generate theme suggestions", async () => {
      // Setup
      const mockChildInfo = [
        { preferences: "dinosaurs", age: 5 },
        { preferences: "space", age: 7 },
      ];
      const mockThemes = [
        {
          id: "1",
          name: "Dino Space Adventure",
          description: "Dinosaurs in space!",
          icon: "🦕",
        },
        {
          id: "2",
          name: "Prehistoric Planets",
          description: "Ancient worlds",
          icon: "🌍",
        },
      ];

      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: true,
          themes: mockThemes,
        },
      });
      mockHttpsCallable.mockReturnValue(mockCallable);

      // Execute
      const result = await generateThemeSuggestions(mockChildInfo);

      // Assert
      expect(mockHttpsCallable).toHaveBeenCalledWith(
        functionsService,
        "generateThemeSuggestions"
      );
      expect(mockCallable).toHaveBeenCalledWith({
        childrenInfo: mockChildInfo,
      });
      expect(result).toEqual(mockThemes);
    });

    it("should throw error when user is not authenticated", async () => {
      // Setup
      (authService.currentUser as any) = null;
      const mockChildInfo = [{ preferences: "dinosaurs", age: 5 }];

      // Execute & Assert
      await expect(generateThemeSuggestions(mockChildInfo)).rejects.toThrow(
        "User must be authenticated to generate themes"
      );
    });

    it("should throw error when theme generation fails", async () => {
      // Setup
      const mockChildInfo = [{ preferences: "dinosaurs", age: 5 }];
      const mockCallable = jest.fn().mockResolvedValue({
        data: {
          success: false,
        },
      });
      mockHttpsCallable.mockReturnValue(mockCallable);

      // Execute & Assert
      await expect(generateThemeSuggestions(mockChildInfo)).rejects.toThrow(
        "Theme generation failed"
      );
    });
  });
});
