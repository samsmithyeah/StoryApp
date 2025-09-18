// Model name constants to avoid hardcoded strings throughout the codebase

export const TEXT_MODELS = {
  GPT_4O: "gpt-4o",
  GEMINI_2_5_PRO: "gemini-2.5-pro",
} as const;

export const IMAGE_MODELS = {
  GPT_IMAGE_1: "gpt-image-1",
  GEMINI_2_5_FLASH_IMAGE_PREVIEW: "gemini-2.5-flash-image-preview",
} as const;

// Type definitions for model values
export type TextModel = (typeof TEXT_MODELS)[keyof typeof TEXT_MODELS];
export type CoverImageModel = (typeof IMAGE_MODELS)[keyof typeof IMAGE_MODELS];
export type PageImageModel = (typeof IMAGE_MODELS)[keyof typeof IMAGE_MODELS];

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
    [IMAGE_MODELS.GPT_IMAGE_1]: IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW,
    [IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW]: IMAGE_MODELS.GPT_IMAGE_1,
  },
} as const;
