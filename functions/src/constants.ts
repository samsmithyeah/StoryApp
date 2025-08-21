/**
 * Constants for Cloud Functions
 * Only includes values actually used by the functions
 */

// Timeouts (in seconds)
export const TIMEOUTS = {
  STORY_GENERATION: 540, // 9 minutes - used in generateStory.ts
  COVER_GENERATION: 300, // 5 minutes - used in generateCoverImage.ts
  SINGLE_IMAGE_GENERATION: 300, // 5 minutes - used in generateSingleImage.ts
} as const;

// Image generation settings
export const IMAGE_SETTINGS = {
  COVER_ASPECT_RATIO: "1:1", // Used in generateCoverImage.ts
  COVER_IMAGE_SIZE: "1024x1024" as const, // Used in generateCoverImage.ts
} as const;
