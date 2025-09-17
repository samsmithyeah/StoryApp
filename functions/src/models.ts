// Model name constants to avoid hardcoded strings throughout the codebase

export const IMAGE_MODELS = {
  GPT_IMAGE_1: "gpt-image-1",
  GEMINI_2_5_FLASH_IMAGE_PREVIEW: "gemini-2.5-flash-image-preview",
  GEMINI: "gemini", // For page image editing
} as const;

// Type definitions for model values
export type CoverImageModel =
  | typeof IMAGE_MODELS.GPT_IMAGE_1
  | typeof IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW;
export type PageImageModel =
  | typeof IMAGE_MODELS.GPT_IMAGE_1
  | typeof IMAGE_MODELS.GEMINI;

// Default model selections
export const DEFAULT_MODELS = {
  TEXT: TEXT_MODELS.GEMINI_2_5_PRO,
  COVER_IMAGE: IMAGE_MODELS.GPT_IMAGE_1,
  PAGE_IMAGE: IMAGE_MODELS.GPT_IMAGE_1,
} as const;

// Fallback mappings
export const FALLBACK_MODELS = {
  COVER_IMAGE: {
    [IMAGE_MODELS.GPT_IMAGE_1]: IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
    [IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW]: IMAGE_MODELS.GPT_IMAGE_1,
  },
  PAGE_IMAGE: {
    [IMAGE_MODELS.GPT_IMAGE_1]: IMAGE_MODELS.GEMINI,
    [IMAGE_MODELS.GEMINI]: IMAGE_MODELS.GPT_IMAGE_1,
  },
} as const;
