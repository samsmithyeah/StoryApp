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
  pageCount: number;
  shouldRhyme?: boolean;
  illustrationStyle: string;
  illustrationAiDescription?: string;
  enableIllustrations: boolean;
  pageImageModel?: "flux" | "gemini" | "gpt-image-1"; // Optional, defaults to gemini
  textModel?: "gpt-4o" | "gemini-2.5-pro";
  coverImageModel?:
    | "gemini-2.0-flash-preview-image-generation"
    | "dall-e-3"
    | "gpt-image-1";
  storyAbout?: string;
  characters?: StoryCharacter[];
  temperature?: number; // 0.0 to 2.0, controls randomness/creativity
  geminiThinkingBudget?: number; // -1 for dynamic, 128-32768 for fixed budget
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
