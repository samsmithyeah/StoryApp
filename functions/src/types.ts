export interface StoryGenerationRequest {
  selectedChildren: string[];
  childrenAsCharacters: boolean;
  theme: string;
  length: "short" | "medium" | "long";
  illustrationStyle: string;
  enableIllustrations: boolean;
  imageProvider?: "flux" | "gemini"; // Optional, defaults to flux for backward compatibility
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
