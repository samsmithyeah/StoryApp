export interface StoryPage {
  page: number;
  text: string;
  imageUrl: string;
}

export interface StoryConfiguration {
  selectedChildren: string[];
  childrenAsCharacters: boolean;
  theme: string;
  length: "short" | "medium" | "long";
  illustrationStyle: string;
  enableIllustrations?: boolean;
  targetAge?: number;
  storyId?: string;
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
