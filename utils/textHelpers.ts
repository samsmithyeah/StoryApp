// Text utility functions for the app

// Helper function to get character count display
export const getCharacterCountText = (current: number, max: number): string => {
  return `${current}/${max}`;
};

// Helper function to check if text is within character limit
export const isWithinLimit = (text: string, max: number): boolean => {
  return text.length <= max;
};

// Helper function to truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

// Helper function to get remaining characters
export const getRemainingCharacters = (text: string, max: number): number => {
  return Math.max(0, max - text.length);
};
