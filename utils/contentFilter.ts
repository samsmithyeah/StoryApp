// Content filter for user input to prevent inappropriate content
// Uses obscenity package for comprehensive bad word detection
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

// Patterns that might indicate inappropriate content
const PROHIBITED_PATTERNS = [
  /\b(kill|hurt|harm)\s+(someone|people|person|child|kid)\b/gi,
  /\b(violent|scary|frightening)\s+(extremely|very|super)\b/gi,
  /\b(adult|mature|explicit)\s+content\b/gi,
];

// Common names that might be flagged but should be allowed in name contexts
// Note: Some entries are partial matches due to how the obscenity package detects patterns
const ALLOWED_NAMES = new Set(["dick", "dic"]);

export interface ContentFilterResult {
  isAppropriate: boolean;
  reason?: string;
  sanitizedText?: string;
}

// Create a matcher with the English dataset and recommended transformers
// This handles variations, leetspeak, and common obfuscation techniques
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export function filterContent(
  text: string,
  isNameField: boolean = false
): ContentFilterResult {
  if (!text || typeof text !== "string") {
    return { isAppropriate: true };
  }

  // Check for prohibited words using obscenity package
  const matches = matcher.getAllMatches(text);
  if (matches.length > 0) {
    // If this is a name field, check if the flagged words are allowed names
    if (isNameField) {
      const flaggedWords = matches.map((match) =>
        text.substring(match.startIndex, match.endIndex).toLowerCase()
      );
      const hasOnlyAllowedNames = flaggedWords.every((word) =>
        ALLOWED_NAMES.has(word)
      );

      if (hasOnlyAllowedNames) {
        // All flagged words are allowed names, so this is appropriate
        return { isAppropriate: true, sanitizedText: text.trim() };
      }
    }

    return {
      isAppropriate: false,
      reason: `Content contains inappropriate language`,
    };
  }

  // Check for prohibited patterns
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isAppropriate: false,
        reason: "Content contains inappropriate themes or combinations",
      };
    }
  }

  // Note: Length validation is now handled by maxLength on TextInput
  // This check is kept as a safety measure for API calls
  if (text.length > 5000) {
    return {
      isAppropriate: false,
      reason: "Content is too long.",
    };
  }

  return {
    isAppropriate: true,
    sanitizedText: text.trim(),
  };
}

// Helper function to show user-friendly error messages
export function getFilterErrorMessage(reason?: string): string {
  if (!reason) {
    return "Please ensure your content is appropriate for children.";
  }

  if (reason.includes("too long")) {
    return reason;
  }

  return "Please ensure your content is appropriate for children's stories. Avoid violence, explicit content, or inappropriate language.";
}
