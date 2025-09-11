// Retry function with exponential backoff
import { logger } from "./logger";

// Helper functions for error classification
export const isRateLimitError = (error: any): boolean => error.status === 429;

export const isJsonParseError = (error: any): boolean =>
  error instanceof SyntaxError;

export const isImageGenerationError = (error: any): boolean =>
  error.message && error.message.includes("No image data in Gemini response");

export const isContentPolicyError = (error: any): boolean =>
  error.status === 400 &&
  error.message &&
  (error.message.includes("content policy") ||
    error.message.includes("safety system") ||
    error.message.includes("content guidelines"));

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if it's a retryable error
      const isRetryableError =
        isRateLimitError(error) ||
        isJsonParseError(error) ||
        isImageGenerationError(error) ||
        isContentPolicyError(error);

      if (isRetryableError && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        let errorType = "Unknown error";
        if (isRateLimitError(error)) {
          errorType = "Rate limited";
        } else if (isImageGenerationError(error)) {
          errorType = "Gemini image generation failed";
        } else if (isJsonParseError(error)) {
          errorType = "JSON parsing failed";
        } else if (isContentPolicyError(error)) {
          errorType = "Content policy violation";
        }
        logger.info("Retrying after error", {
          errorType,
          delay,
          attempt: i + 1,
          maxRetries,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (!isRetryableError) {
        // If not a retryable error, throw immediately
        throw error;
      }
    }
  }

  throw lastError;
}
