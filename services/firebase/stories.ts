import { functionsService, authService } from './config';
import { StoryConfiguration, Story } from '@/types/story.types';

export interface StoryGenerationRequest extends StoryConfiguration {
  enableIllustrations: boolean;
}

export const generateStory = async (config: StoryGenerationRequest) => {
  try {
    const generateStoryFn = functionsService.httpsCallable('generateStory');
    const result = await generateStoryFn(config);
    
    if (result.data.success) {
      return {
        storyId: result.data.storyId,
        story: result.data.story,
        imageGenerationStatus: result.data.imageGenerationStatus,
      };
    } else {
      throw new Error('Story generation failed');
    }
  } catch (error) {
    console.error('Error calling generateStory function:', error);
    throw error;
  }
};

export const getStories = async (): Promise<Story[]> => {
  try {
    const getStoriesFn = functionsService.httpsCallable('getStories');
    const result = await getStoriesFn();
    
    if (result.data.success) {
      return result.data.stories;
    } else {
      throw new Error('Failed to fetch stories');
    }
  } catch (error) {
    console.error('Error calling getStories function:', error);
    throw error;
  }
};

export interface ThemeSuggestion {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const generateThemeSuggestions = async (childPreferences: string[]): Promise<ThemeSuggestion[]> => {
  try {
    // Ensure user is authenticated
    const currentUser = authService.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to generate themes');
    }
    
    console.log('Current user ID:', currentUser.uid);
    
    const generateThemesFn = functionsService.httpsCallable('generateThemeSuggestions');
    const result = await generateThemesFn({ preferences: childPreferences });
    
    if (result.data.success) {
      return result.data.themes;
    } else {
      throw new Error('Theme generation failed');
    }
  } catch (error) {
    console.error('Error calling generateThemeSuggestions function:', error);
    throw error;
  }
};

export const getStory = async (storyId: string): Promise<Story> => {
  try {
    const getStoryFn = functionsService.httpsCallable('getStory');
    const result = await getStoryFn({ storyId });
    
    if (result.data.success) {
      return result.data.story;
    } else {
      throw new Error('Failed to fetch story');
    }
  } catch (error) {
    console.error('Error calling getStory function:', error);
    throw error;
  }
};