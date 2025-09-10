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

      // Check if it's a retryable error
      const isRetryableError =
        error.status === 429 || // Rate limit error
        (error.message &&
          error.message.includes("No image data in Gemini response")) || // Gemini no image data error
        (error.message &&
          (error.message.includes("Unexpected token") ||
            error.message.includes("JSON") ||
            error.message.includes("parse"))) || // JSON parsing errors
        (error.status === 400 &&
          error.message &&
          (error.message.includes("content policy") ||
            error.message.includes("safety system") ||
            error.message.includes("content guidelines"))); // OpenAI content filter errors

      if (isRetryableError && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        const errorType =
          error.status === 429
            ? "Rate limited"
            : error.message?.includes("No image data in Gemini response")
              ? "Gemini image generation failed"
              : error.message &&
                  (error.message.includes("Unexpected token") ||
                    error.message.includes("JSON") ||
                    error.message.includes("parse"))
                ? "JSON parsing failed"
                : "Content policy violation";
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
