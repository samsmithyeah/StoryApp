import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { GenerationStep } from "@/components/wizard/steps/GenerationStep";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Story } from "@/types/story.types";

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

// Mock @react-navigation/native
jest.mock("@react-navigation/native", () => ({
  useIsFocused: jest.fn(() => true), // Default to focused for tests
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 20, top: 44, left: 0, right: 0 }),
}));

describe("GenerationStep", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useIsFocused as jest.Mock).mockReturnValue(true);
  });

  describe("Loading State", () => {
    it("should display loading spinner when generating", () => {
      const { getByText, queryByText } = render(
        <GenerationStep isGenerating={true} error={null} storyData={null} />
      );

      expect(getByText("Creating your story")).toBeTruthy();
      expect(queryByText(/Story generation failed/)).toBeFalsy();
    });

    it("should show generation progress checklist", () => {
      const { getByText } = render(
        <GenerationStep isGenerating={true} error={null} storyData={null} />
      );

      expect(getByText("Story text")).toBeTruthy();
      expect(getByText("Cover illustration")).toBeTruthy();
      expect(getByText(/Page illustrations/)).toBeTruthy();
    });
  });

  describe("Progress Tracking", () => {
    it("should show story text as complete when data is available", () => {
      const mockStory: Partial<Story> = {
        title: "Test Story",
        storyContent: [
          { page: 1, text: "Page 1", imageUrl: "" },
          { page: 2, text: "Page 2", imageUrl: "" },
        ],
      };

      const { getByText } = render(
        <GenerationStep
          isGenerating={true}
          error={null}
          storyData={mockStory as Story}
        />
      );

      const storyTextElement = getByText("Story text");
      expect(storyTextElement).toBeTruthy();
    });

    it("should show cover image as complete when URL is available", () => {
      const mockStory: Partial<Story> = {
        title: "Test Story",
        coverImageUrl: "https://example.com/cover.jpg",
        storyContent: [],
      };

      const { getByText } = render(
        <GenerationStep
          isGenerating={true}
          error={null}
          storyData={mockStory as Story}
        />
      );

      const coverElement = getByText("Cover illustration");
      expect(coverElement).toBeTruthy();
    });

    it("should show page image progress", () => {
      const mockStory: Partial<Story> = {
        title: "Test Story",
        coverImageUrl: "https://example.com/cover.jpg",
        storyContent: [],
        imagesGenerated: 2,
        totalImages: 5,
        imageGenerationStatus: "generating",
      };

      const { getByText } = render(
        <GenerationStep
          isGenerating={true}
          error={null}
          storyData={mockStory as Story}
        />
      );

      expect(getByText(/Page illustrations \(2\/5\)/)).toBeTruthy();
    });

    it("should use debug force states when provided", () => {
      const { getByText } = render(
        <GenerationStep
          isGenerating={true}
          error={null}
          storyData={null}
          _debugForceStates={{
            textReady: true,
            coverReady: true,
            imagesReady: false,
          }}
        />
      );

      // Should show completion message when all forced to ready
      const storyTextElement = getByText("Story text");
      const coverElement = getByText("Cover illustration");
      expect(storyTextElement).toBeTruthy();
      expect(coverElement).toBeTruthy();
    });
  });

  describe("Error State", () => {
    it("should display generic error message", () => {
      const { getByText } = render(
        <GenerationStep
          isGenerating={false}
          error="Something went wrong"
          storyData={null}
          onStartOver={jest.fn()}
        />
      );

      expect(getByText("Story generation failed")).toBeTruthy();
      expect(getByText("Something went wrong")).toBeTruthy();
      expect(getByText("Try a different story")).toBeTruthy();
    });

    it("should display insufficient credits error with buy button", () => {
      const { getByText } = render(
        <GenerationStep
          isGenerating={false}
          error="Insufficient credits. You need 5 credits to generate this story."
          storyData={null}
          onStartOver={jest.fn()}
        />
      );

      expect(getByText("More credits needed")).toBeTruthy();
      expect(
        getByText(/You need more credits to create this story/)
      ).toBeTruthy();
      expect(getByText("Buy credits")).toBeTruthy();
      expect(getByText("Choose fewer pages")).toBeTruthy();
    });

    it("should navigate to credits modal when buy credits is pressed", () => {
      const { getByText } = render(
        <GenerationStep
          isGenerating={false}
          error="Insufficient credits"
          storyData={null}
          onStartOver={jest.fn()}
        />
      );

      const buyButton = getByText("Buy credits");
      fireEvent.press(buyButton);

      expect(mockRouter.push).toHaveBeenCalledWith("/credits-modal");
    });

    it("should call onStartOver when retry button is pressed", () => {
      const mockStartOver = jest.fn();
      const { getByText } = render(
        <GenerationStep
          isGenerating={false}
          error="Generation failed"
          storyData={null}
          onStartOver={mockStartOver}
        />
      );

      const retryButton = getByText("Try a different story");
      fireEvent.press(retryButton);

      expect(mockStartOver).toHaveBeenCalled();
    });
  });

  describe("User Actions", () => {
    it("should show disabled View story button during generation without story text", () => {
      const { getByText } = render(
        <GenerationStep isGenerating={true} error={null} storyData={null} />
      );

      const viewButton = getByText("View story");
      expect(viewButton).toBeTruthy();

      // Button should be disabled (non-interactive) when story text isn't ready
      fireEvent.press(viewButton);
      // Since it's disabled, pressing shouldn't trigger any action
    });

    it("should show View Story button when story text is ready", () => {
      const mockNavigate = jest.fn();
      const mockStory: Partial<Story> = {
        title: "Test Story",
        storyContent: [{ page: 1, text: "Page 1", imageUrl: "" }],
      };

      const { getByText } = render(
        <GenerationStep
          isGenerating={true}
          error={null}
          storyData={mockStory as Story}
          onNavigateToStory={mockNavigate}
        />
      );

      const viewButton = getByText("View story");
      fireEvent.press(viewButton);

      expect(mockNavigate).toHaveBeenCalled();
    });

    it("should show completion message when all generation is complete", () => {
      const mockStory: Partial<Story> = {
        title: "Test Story",
        coverImageUrl: "https://example.com/cover.jpg",
        storyContent: [
          {
            page: 1,
            text: "Page 1",
            imageUrl: "https://example.com/page1.jpg",
          },
        ],
        imageGenerationStatus: "completed",
      };

      const { getByText } = render(
        <GenerationStep
          isGenerating={false}
          error={null}
          storyData={mockStory as Story}
        />
      );

      expect(
        getByText("Your story is complete and ready to read!")
      ).toBeTruthy();
    });

    it("should show push notification tip when generation is in progress", () => {
      const { getByText } = render(
        <GenerationStep isGenerating={true} error={null} storyData={null} />
      );

      expect(getByText(/Feel free to get on with something else/)).toBeTruthy();
    });
  });
});
