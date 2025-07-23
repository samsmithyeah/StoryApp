export interface StoryCharacter {
  name: string;
  description?: string;
  isChild?: boolean;
  childId?: string;
}

export interface StoryGenerationRequest {
  selectedChildren: string[];
  theme: string;
  mood?: string;
  length: "short" | "medium" | "long";
  illustrationStyle: string;
  enableIllustrations: boolean;
  imageProvider?: "flux" | "gemini"; // Optional, defaults to flux for backward compatibility
  textModel?: "gpt-4o" | "gemini-2.5-pro";
  coverImageModel?: "gemini-2.0-flash-preview-image-generation" | "dall-e-3" | "gpt-image-1";
  storyAbout?: string;
  characters?: StoryCharacter[];
}

export interface StoryPage {
  page: number;
  text: string;
  imageUrl: string;
}

export interface GeneratedStory {
  title: string;
  pages: StoryPage[];
  coverImageUrl: string;
}
