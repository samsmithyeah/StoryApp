import { Story, StoryConfiguration } from "@/types/story.types";
import { httpsCallable } from "@react-native-firebase/functions";
import { authService, functionsService } from "./config";
import { creditsService } from "./credits";
import { logger } from "../../utils/logger";

export interface StoryGenerationRequest extends StoryConfiguration {}

export const generateStory = async (config: StoryGenerationRequest) => {
  try {
    // Check if user has enough credits
    const userId = authService.currentUser?.uid;
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    const userCredits = await creditsService.getUserCredits(userId);
    const creditsNeeded = config.pageCount || 5;

    if (!userCredits || userCredits.balance < creditsNeeded) {
      throw new Error(
        `Insufficient credits. You need ${creditsNeeded} credits to generate this story.`
      );
    }

    const generateStoryFn = httpsCallable(functionsService, "generateStory", {
      timeout: 180000, // 3 minutes timeout
    });
    const result = await generateStoryFn(config);

    // Add null check for result data
    if (!result?.data) {
      throw new Error("No data returned from story generation");
    }

    const data = result.data as any;
    if (data.success) {
      // Validate required fields
      if (!data.storyId) {
        throw new Error("Story generation succeeded but no story ID returned");
      }

      // Deduct credits after successful generation
      const storyId = data.storyId;
      await creditsService.useCredits(userId, creditsNeeded, storyId);

      return {
        storyId,
        story: data.story || null,
        imageGenerationStatus: data.imageGenerationStatus || "pending",
      };
    } else {
      throw new Error(data.error || "Story generation failed");
    }
  } catch (error) {
    logger.error("Error calling generateStory function", error);
    throw error;
  }
};

export const getStories = async (): Promise<Story[]> => {
  try {
    const getStoriesFn = httpsCallable(functionsService, "getStories");
    const result = await getStoriesFn();

    if ((result.data as any).success) {
      return (result.data as any).stories;
    } else {
      throw new Error("Failed to fetch stories");
    }
  } catch (error) {
    logger.error("Error calling getStories function", error);
    throw error;
  }
};

export interface ThemeSuggestion {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ChildInfo {
  preferences: string;
  age: number;
}

export const generateThemeSuggestions = async (
  childrenInfo: ChildInfo[]
): Promise<ThemeSuggestion[]> => {
  try {
    // Ensure user is authenticated
    const currentUser = authService.currentUser;
    if (!currentUser) {
      throw new Error("User must be authenticated to generate themes");
    }

    const generateThemesFn = httpsCallable(
      functionsService,
      "generateThemeSuggestions"
    );
    const result = await generateThemesFn({ childrenInfo });

    if ((result.data as any).success) {
      return (result.data as any).themes;
    } else {
      throw new Error("Theme generation failed");
    }
  } catch (error) {
    logger.error("Error calling generateThemeSuggestions function", error);
    throw error;
  }
};

export const getStory = async (storyId: string): Promise<Story> => {
  try {
    const getStoryFn = httpsCallable(functionsService, "getStory");
    const result = await getStoryFn({ storyId });

    if ((result.data as any).success) {
      return (result.data as any).story;
    } else {
      throw new Error("Failed to fetch story");
    }
  } catch (error) {
    logger.error("Error calling getStory function", error);
    throw error;
  }
};

export const reportStory = async (
  storyId: string,
  story: Story
): Promise<void> => {
  try {
    const reportStoryFn = httpsCallable(functionsService, "reportStory");
    const result = await reportStoryFn({
      storyId,
      storyTitle: story.title,
      storyContent: story.storyContent,
      storyConfiguration: story.storyConfiguration,
      reportedAt: new Date().toISOString(),
    });

    if (!(result.data as any).success) {
      throw new Error("Failed to report story");
    }
  } catch (error) {
    logger.error("Error calling reportStory function", error);
    throw error;
  }
};

export const deleteStory = async (storyId: string): Promise<void> => {
  try {
    const deleteStoryFn = httpsCallable(functionsService, "deleteStory");
    const result = await deleteStoryFn({
      storyId,
    });

    if (!(result.data as any).success) {
      throw new Error("Failed to delete story");
    }
  } catch (error) {
    logger.error("Error calling deleteStory function", error);
    throw error;
  }
};
