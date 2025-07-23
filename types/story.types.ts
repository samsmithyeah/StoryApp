export interface StoryPage {
  page: number;
  text: string;
  imageUrl: string;
}

export interface StoryCharacter {
  name: string;
  description?: string;
  isChild?: boolean;
  childId?: string;
}

export interface StoryConfiguration {
  selectedChildren: string[];
  theme: string;
  mood?: string;
  length: "short" | "medium" | "long";
  shouldRhyme?: boolean;
  illustrationStyle: string;
  illustrationAiDescription?: string;
  enableIllustrations?: boolean;
  imageProvider?: "flux" | "gemini";
  textModel?: "gpt-4o" | "gemini-2.5-pro";
  coverImageModel?:
    | "gemini-2.0-flash-preview-image-generation"
    | "dall-e-3"
    | "gpt-image-1";
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
  imagesGenerated?: number;
  totalImages?: number;
  imageGenerationError?: string;
}

export interface StoryWizardData {
  childId: string;
  theme: string;
  characters: string[];
  setting: string;
  mood: string;
  lesson?: string;
}

export interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  loading: boolean;
  error: string | null;
}
