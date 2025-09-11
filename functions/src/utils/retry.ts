// Retry function with exponential backoff
import { logger } from "./logger";
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

      // Helper functions for error classification
      const isRateLimitError = () => error.status === 429;
      const isJsonParseError = () =>
        error.message &&
        (error.message.includes("Unexpected token") ||
          error.message.includes("JSON") ||
          error.message.includes("parse"));
      const isImageGenerationError = () =>
        error.message &&
        error.message.includes("No image data in Gemini response");
      const isContentPolicyError = () =>
        error.status === 400 &&
        error.message &&
        (error.message.includes("content policy") ||
          error.message.includes("safety system") ||
          error.message.includes("content guidelines"));

      // Check if it's a retryable error
      const isRetryableError =
        isRateLimitError() ||
        isJsonParseError() ||
        isImageGenerationError() ||
        isContentPolicyError();

      if (isRetryableError && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        let errorType = "Unknown error";
        if (isRateLimitError()) {
          errorType = "Rate limited";
        } else if (isImageGenerationError()) {
          errorType = "Gemini image generation failed";
        } else if (isJsonParseError()) {
          errorType = "JSON parsing failed";
        } else if (isContentPolicyError()) {
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
