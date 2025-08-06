// Content limits for user-generated text inputs
// Centralized configuration for easy management

export const ContentLimits = {
  // Story configuration limits
  STORY_ABOUT_MAX_LENGTH: 2000,
  CUSTOM_THEME_MAX_LENGTH: 100,
  CUSTOM_MOOD_MAX_LENGTH: 100,

  // Child profile limits
  CHILD_NAME_MAX_LENGTH: 50,
  CHILD_PREFERENCES_MAX_LENGTH: 500,

  // Saved character limits
  CHARACTER_NAME_MAX_LENGTH: 50,
  CHARACTER_DESCRIPTION_MAX_LENGTH: 500,
} as const;
