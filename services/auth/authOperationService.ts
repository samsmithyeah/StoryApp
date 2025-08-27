import { logger } from "../../utils/logger";

/**
 * Service to handle race conditions in auth operations using operation IDs
 * This is much cleaner than multiple user uid checks
 */
export class AuthOperationService {
  private static currentOperationId: string | null = null;
  private static operationCounter = 0;

  /**
   * Generate a new operation ID and set it as current
   */
  static startOperation(description: string): string {
    this.operationCounter++;
    const operationId = `auth_op_${Date.now()}_${this.operationCounter}`;
    this.currentOperationId = operationId;

    logger.debug("Started auth operation", { operationId, description });
    return operationId;
  }

  /**
   * Check if an operation is still current (not superseded by newer operation)
   */
  static isOperationCurrent(operationId: string): boolean {
    return this.currentOperationId === operationId;
  }

  /**
   * Execute an async operation with race condition protection
   */
  static async executeWithRaceProtection<T>(
    description: string,
    operation: (operationId: string) => Promise<T>
  ): Promise<T | null> {
    const operationId = this.startOperation(description);

    try {
      const result = await operation(operationId);

      // Check if operation is still current after async work
      if (!this.isOperationCurrent(operationId)) {
        logger.debug("Operation superseded, ignoring result", {
          operationId,
          description,
        });
        return null;
      }

      logger.debug("Operation completed successfully", {
        operationId,
        description,
      });
      return result;
    } catch (error) {
      // Always log errors, even if superseded
      logger.error("Auth operation failed", {
        operationId,
        description,
        error,
      });
      throw error;
    }
  }

  /**
   * Clear current operation (useful for cleanup)
   */
  static clearCurrentOperation(): void {
    const previousId = this.currentOperationId;
    this.currentOperationId = null;
    logger.debug("Cleared current auth operation", { previousId });
  }

  /**
   * Get current operation info for debugging
   */
  static getCurrentOperation(): { id: string | null; counter: number } {
    return {
      id: this.currentOperationId,
      counter: this.operationCounter,
    };
  }

  /**
   * Reset for testing
   */
  static _reset(): void {
    this.currentOperationId = null;
    this.operationCounter = 0;
  }
}

/**
 * Utility function for common pattern: execute operation with race protection and state update
 */
export async function executeAuthOperation<T>(
  description: string,
  operation: () => Promise<T>,
  onSuccess?: (result: T) => void,
  onError?: (error: unknown) => void
): Promise<boolean> {
  try {
    const result = await AuthOperationService.executeWithRaceProtection(
      description,
      async () => await operation()
    );

    if (result !== null && onSuccess) {
      onSuccess(result);
      return true;
    }

    return result !== null;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    return false;
  }
}
