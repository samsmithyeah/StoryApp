import { logger } from "../../utils/logger";

export interface AuthErrorNotification {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  details?: string;
  timestamp: Date;
  dismissible: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Service to manage error notifications that should be surfaced to users
 * instead of being silently logged
 */
export class ErrorNotificationService {
  private static notifications = new Set<AuthErrorNotification>();
  private static listeners = new Set<
    (notifications: AuthErrorNotification[]) => void
  >();
  private static nextId = 1;

  /**
   * Add an error notification that should be shown to the user
   */
  static addNotification(
    notification: Omit<AuthErrorNotification, "id" | "timestamp">
  ): string {
    const id = `auth_error_${this.nextId++}`;
    const fullNotification: AuthErrorNotification = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    this.notifications.add(fullNotification);

    logger.debug("Added error notification", {
      id,
      type: notification.type,
      message: notification.message,
    });
    this.notifyListeners();

    return id;
  }

  /**
   * Remove a notification by ID
   */
  static dismissNotification(id: string): void {
    const notification = Array.from(this.notifications).find(
      (n) => n.id === id
    );
    if (notification) {
      this.notifications.delete(notification);
      logger.debug("Dismissed notification", { id });
      this.notifyListeners();
    }
  }

  /**
   * Clear all notifications
   */
  static clearAll(): void {
    this.notifications.clear();
    logger.debug("Cleared all notifications");
    this.notifyListeners();
  }

  /**
   * Get all current notifications
   */
  static getNotifications(): AuthErrorNotification[] {
    return Array.from(this.notifications).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Subscribe to notification changes
   */
  static subscribe(
    listener: (notifications: AuthErrorNotification[]) => void
  ): () => void {
    this.listeners.add(listener);

    // Immediately call with current notifications
    listener(this.getNotifications());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private static notifyListeners(): void {
    const notifications = this.getNotifications();
    for (const listener of this.listeners) {
      try {
        listener(notifications);
      } catch (error) {
        logger.warn("Error notification listener failed", { error });
      }
    }
  }

  /**
   * Helper to add common error types
   */
  static addFCMError(details: string): void {
    this.addNotification({
      type: "warning",
      message: "Push notifications may not work properly",
      details: `FCM initialization failed: ${details}`,
      dismissible: true,
      action: {
        label: "Retry",
        handler: () => {
          // Could trigger FCM retry logic here
          logger.debug("User requested FCM retry");
        },
      },
    });
  }

  static addCacheError(details: string): void {
    this.addNotification({
      type: "info",
      message: "Some features may load more slowly",
      details: `Data caching issue: ${details}`,
      dismissible: true,
    });
  }

  static addOnboardingError(details: string): void {
    this.addNotification({
      type: "warning",
      message: "Unable to determine account setup status",
      details: `Onboarding check failed: ${details}`,
      dismissible: true,
      action: {
        label: "Refresh",
        handler: () => {
          // Could trigger onboarding status refresh
          logger.debug("User requested onboarding status refresh");
        },
      },
    });
  }

  static addNetworkError(operation: string): void {
    this.addNotification({
      type: "error",
      message: "Network connection issue",
      details: `Failed to ${operation}. Please check your internet connection.`,
      dismissible: true,
      action: {
        label: "Retry",
        handler: () => {
          logger.debug("User requested network retry", { operation });
        },
      },
    });
  }

  /**
   * Reset for testing
   */
  static _reset(): void {
    this.notifications.clear();
    this.listeners.clear();
    this.nextId = 1;
  }
}
