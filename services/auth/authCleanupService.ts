import { logger } from "../../utils/logger";

/**
 * Service to manage cleanup of timers, listeners, and other resources
 * to prevent memory leaks in the auth system
 */
export class AuthCleanupService {
  private static activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
  private static activeIntervals = new Set<ReturnType<typeof setInterval>>();
  private static cleanupCallbacks = new Set<() => void>();

  /**
   * Create a managed timeout that will be automatically cleaned up
   */
  static createTimeout(
    callback: () => void,
    delay: number
  ): ReturnType<typeof setTimeout> {
    const timeoutId = setTimeout(() => {
      this.activeTimeouts.delete(timeoutId);
      callback();
    }, delay);

    this.activeTimeouts.add(timeoutId);
    logger.debug("Created managed timeout", { timeoutId, delay });
    return timeoutId;
  }

  /**
   * Create a managed interval that will be automatically cleaned up
   */
  static createInterval(
    callback: () => void,
    delay: number
  ): ReturnType<typeof setInterval> {
    const intervalId = setInterval(callback, delay);
    this.activeIntervals.add(intervalId);
    logger.debug("Created managed interval", { intervalId, delay });
    return intervalId;
  }

  /**
   * Clear a specific timeout
   */
  static clearTimeout(timeoutId: ReturnType<typeof setTimeout>): void {
    clearTimeout(timeoutId);
    this.activeTimeouts.delete(timeoutId);
    logger.debug("Cleared timeout", { timeoutId });
  }

  /**
   * Clear a specific interval
   */
  static clearInterval(intervalId: ReturnType<typeof setInterval>): void {
    clearInterval(intervalId);
    this.activeIntervals.delete(intervalId);
    logger.debug("Cleared interval", { intervalId });
  }

  /**
   * Register a cleanup callback to be called when auth is reset
   */
  static registerCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
    logger.debug("Registered cleanup callback", {
      callbackCount: this.cleanupCallbacks.size,
    });
  }

  /**
   * Unregister a cleanup callback
   */
  static unregisterCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.delete(callback);
    logger.debug("Unregistered cleanup callback", {
      callbackCount: this.cleanupCallbacks.size,
    });
  }

  /**
   * Clean up all managed resources
   */
  static cleanupAll(): void {
    logger.debug("Starting auth cleanup", {
      timeouts: this.activeTimeouts.size,
      intervals: this.activeIntervals.size,
      callbacks: this.cleanupCallbacks.size,
    });

    // Clear all timeouts
    for (const timeoutId of this.activeTimeouts) {
      clearTimeout(timeoutId);
    }
    this.activeTimeouts.clear();

    // Clear all intervals
    for (const intervalId of this.activeIntervals) {
      clearInterval(intervalId);
    }
    this.activeIntervals.clear();

    // Execute cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        logger.warn("Cleanup callback failed", { error });
      }
    }

    logger.debug("Auth cleanup completed");
  }

  /**
   * Get cleanup statistics for monitoring
   */
  static getStats() {
    return {
      activeTimeouts: this.activeTimeouts.size,
      activeIntervals: this.activeIntervals.size,
      cleanupCallbacks: this.cleanupCallbacks.size,
    };
  }

  /**
   * Reset for testing
   */
  static _reset(): void {
    this.cleanupAll();
    this.cleanupCallbacks.clear();
  }
}

/**
 * Utility function to create a debounced function with automatic cleanup
 */
export function createDebouncedFunction<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFunc = ((...args: Parameters<T>) => {
    if (timeoutId) {
      AuthCleanupService.clearTimeout(timeoutId);
    }

    timeoutId = AuthCleanupService.createTimeout(() => {
      timeoutId = null;
      func(...args);
    }, delay);
  }) as T & { cancel: () => void };

  debouncedFunc.cancel = () => {
    if (timeoutId) {
      AuthCleanupService.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunc;
}
