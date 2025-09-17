interface StoryCharacter {
  name: string;
  description?: string;
  appearance?: string;
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
  illustrationAiDescriptionBackup1?: string;
  illustrationAiDescriptionBackup2?: string;
  pageImageModel?: "gemini" | "gpt-image-1"; // Optional, defaults to gpt-image-1
  textModel?: "gpt-4o" | "gemini-2.5-pro";
  coverImageModel?: "gemini-2.5-flash-image-preview" | "gpt-image-1";
  storyAbout?: string;
  characters?: StoryCharacter[];
  temperature?: number; // 0.0 to 2.0, controls randomness/creativity
  geminiThinkingBudget?: number; // -1 for dynamic, 128-32768 for fixed budget
  storyId?: string; // Optional pre-generated story ID for early listener setup
}

export interface StoryPage {
  page: number;
  text: string;
  imageUrl: string;
}
