import * as Sentry from "@sentry/react-native";

/**
 * Production-safe logging utility
 * Uses Sentry for production logging and console for development
 */
class Logger {
  private isDev = __DEV__;

  /**
   * Log informational messages
   */
  info(message: string, extra?: any) {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, extra || "");
    }
    // Don't send info logs to Sentry to avoid noise and potential sensitive data
  }

  /**
   * Log warnings
   */
  warn(message: string, extra?: any) {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, extra || "");
    }
    Sentry.captureMessage(`Warning: ${message}`, "warning");
    if (extra) {
      Sentry.setContext("warning_context", extra);
    }
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | any, extra?: any) {
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, error || "", extra || "");
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(`Error: ${message}`, "error");
    }

    if (extra) {
      Sentry.setContext("error_context", extra);
    }
  }

  /**
   * Debug logging - only shows in development
   */
  debug(message: string, extra?: any) {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, extra || "");
    }
  }
}

export const logger = new Logger();
