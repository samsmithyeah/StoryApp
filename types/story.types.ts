import { TEXT_MODELS, IMAGE_MODELS } from "../constants/Models";

type TextModel = (typeof TEXT_MODELS)[keyof typeof TEXT_MODELS];
type ImageModel = (typeof IMAGE_MODELS)[keyof typeof IMAGE_MODELS];

interface StoryPage {
  page: number;
  text: string;
  imageUrl: string;
}

export interface StoryCharacter {
  id?: string; // Unique identifier for one-off characters
  savedCharacterId?: string; // ID of the saved character this is based on
  name: string;
  description?: string;
  appearance?: string;
  isChild?: boolean;
  childId?: string;
  isOneOff?: boolean; // Add this flag
}

export interface StoryConfiguration {
  selectedChildren: string[];
  theme: string;
  mood?: string;
  pageCount: number;
  shouldRhyme?: boolean;
  illustrationStyle: string;
  illustrationAiDescription?: string;
  illustrationAiDescriptionBackup1?: string;
  illustrationAiDescriptionBackup2?: string;
  pageImageModel?: ImageModel;
  textModel?: TextModel;
  coverImageModel?: ImageModel;
  targetAge?: number;
  storyId?: string;
  storyAbout?: string;
  characters?: StoryCharacter[];
  temperature?: number;
  geminiThinkingBudget?: number;
}

export interface Story {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  storyContent: StoryPage[];
  audioUrl?: string;
  coverImageUrl: string;
  storyConfiguration: StoryConfiguration;
  imageGenerationStatus?:
    | "pending"
    | "generating"
    | "completed"
    | "failed"
    | "not_requested";
  generationPhase?: "text_complete" | "cover_complete" | "all_complete";
  imagesGenerated?: number;
  totalImages?: number;
  imagesFailed?: number;
  imageGenerationError?: string;
}
