/**
 * Server-side logging utility for Firebase Cloud Functions
 * Uses Firebase Functions logger for structured logging in production
 */
import { logger as functionsLogger } from "firebase-functions/v2";

class ServerLogger {
  /**
   * Log informational messages
   */
  info(message: string, data?: any) {
    functionsLogger.info(message, data);
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: any) {
    functionsLogger.warn(message, data);
  }

  /**
   * Log errors
   */
  error(message: string, error?: any, data?: any) {
    if (error instanceof Error) {
      functionsLogger.error(message, {
        error: error.message,
        stack: error.stack,
        ...data,
      });
    } else {
      functionsLogger.error(message, { error, ...data });
    }
  }

  /**
   * Debug logging
   */
  debug(message: string, data?: any) {
    functionsLogger.debug(message, data);
  }

  /**
   * Log function execution context
   */
  logExecution(functionName: string, data?: any) {
    functionsLogger.info(`[${functionName}] Execution`, data);
  }
}

export const logger = new ServerLogger();
