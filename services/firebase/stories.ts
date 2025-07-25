import { Story, StoryConfiguration } from "@/types/story.types";
import { authService, functionsService } from "./config";

export interface StoryGenerationRequest extends StoryConfiguration {
  enableIllustrations: boolean;
}

export const generateStory = async (config: StoryGenerationRequest) => {
  try {
    const generateStoryFn = functionsService.httpsCallable("generateStory", {
      timeout: 180000, // 3 minutes timeout
    });
    const result = await generateStoryFn(config);

    if ((result.data as any).success) {
      return {
        storyId: (result.data as any).storyId,
        story: (result.data as any).story,
        imageGenerationStatus: (result.data as any).imageGenerationStatus,
      };
    } else {
      throw new Error("Story generation failed");
    }
  } catch (error) {
    console.error("Error calling generateStory function:", error);
    throw error;
  }
};

export const getStories = async (): Promise<Story[]> => {
  try {
    const getStoriesFn = functionsService.httpsCallable("getStories");
    const result = await getStoriesFn();

    if ((result.data as any).success) {
      return (result.data as any).stories;
    } else {
      throw new Error("Failed to fetch stories");
    }
  } catch (error) {
    console.error("Error calling getStories function:", error);
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

    console.log("Current user ID:", currentUser.uid);

    const generateThemesFn = functionsService.httpsCallable(
      "generateThemeSuggestions"
    );
    const result = await generateThemesFn({ childrenInfo });

    if ((result.data as any).success) {
      return (result.data as any).themes;
    } else {
      throw new Error("Theme generation failed");
    }
  } catch (error) {
    console.error("Error calling generateThemeSuggestions function:", error);
    throw error;
  }
};

export const getStory = async (storyId: string): Promise<Story> => {
  try {
    const getStoryFn = functionsService.httpsCallable("getStory");
    const result = await getStoryFn({ storyId });

    if ((result.data as any).success) {
      return (result.data as any).story;
    } else {
      throw new Error("Failed to fetch story");
    }
  } catch (error) {
    console.error("Error calling getStory function:", error);
    throw error;
  }
};
