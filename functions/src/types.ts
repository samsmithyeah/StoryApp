import type { CoverImageModel, PageImageModel, TextModel } from "./models";

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
  pageImageModel?: PageImageModel;
  textModel?: TextModel;
  coverImageModel?: CoverImageModel;
  storyAbout?: string;
  characters?: StoryCharacter[];
  temperature?: number;
  geminiThinkingBudget?: number;
  storyId?: string;
}

export interface StoryPage {
  page: number;
  text: string;
  imageUrl: string;
}
