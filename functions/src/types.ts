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
