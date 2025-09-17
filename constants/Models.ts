// Model name constants to avoid hardcoded strings throughout the codebase

export const TEXT_MODELS = {
  GPT_4O: "gpt-4o",
  GEMINI_2_5_PRO: "gemini-2.5-pro",
} as const;

export const IMAGE_MODELS = {
  GPT_IMAGE_1: "gpt-image-1",
  GEMINI_2_5_FLASH_IMAGE_PREVIEW: "gemini-2.5-flash-image-preview",
  GEMINI: "gemini", // For page image editing
} as const;
