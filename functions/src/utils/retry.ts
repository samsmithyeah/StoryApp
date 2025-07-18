// Retry function with exponential backoff
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

      // Check if it's a rate limit error
      if (error.status === 429) {
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        console.log(
          `Rate limited. Retrying after ${delay}ms (attempt ${
            i + 1
          }/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // If not a rate limit error, throw immediately
        throw error;
      }
    }
  }

  throw lastError;
}
