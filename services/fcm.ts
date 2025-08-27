import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { logger } from "../utils/logger";
import { NotificationService } from "./firebase/notifications";

/**
 * Push notification service using Expo Notifications
 */
export class FCMService {
  private static isInitialized = false;
  private static cleanupFunction: (() => void) | null = null;
  /**
   * Request notification permissions (required for iOS)
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === "granted";
    } catch (error) {
      logger.error("Failed to request notification permissions", error);
      return false;
    }
  }

  /**
   * Get and register Expo push token
   * This should be called after successful authentication
   */
  static async initializeFCM(
    forceReInit = false
  ): Promise<(() => void) | undefined> {
    logger.debug("Starting FCM initialization", {
      forceReInit,
      isInitialized: this.isInitialized,
    });

    // Skip if already initialized (unless forced)
    if (this.isInitialized && !forceReInit) {
      logger.debug("Already initialized, returning existing cleanup function");
      // Return existing cleanup function if available, otherwise undefined
      return this.cleanupFunction || undefined;
    }

    if (forceReInit && this.isInitialized) {
      logger.debug("Force re-initialization requested, proceeding anyway");
    }

    try {
      // Request permissions first
      logger.debug("Requesting notification permissions");
      const hasPermission = await this.requestPermissions();
      logger.debug("Permission result", { hasPermission });

      if (!hasPermission) {
        logger.warn("Notification permissions not granted");
        return undefined;
      }

      // Get the Expo push token
      logger.debug("Getting Expo push token");
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "1bd7d4bd-9179-4cab-acee-fe6fa69367d3",
      });
      logger.debug("Token data received", {
        tokenExists: !!tokenData.data,
        tokenLength: tokenData.data?.length,
      });

      const expoPushToken = tokenData.data;

      if (expoPushToken) {
        logger.debug("Registering token with backend", { expoPushToken });
        // Register token with our backend
        await NotificationService.registerFCMToken(expoPushToken);
        logger.debug("Token registration completed successfully");
      } else {
        logger.error("No push token received from Expo");
      }

      // Check if app was opened from a notification
      this.handleInitialNotification();

      // Set up notification handling
      const cleanup = this.setupMessageHandling();

      // Mark as initialized and store cleanup function
      this.isInitialized = true;
      this.cleanupFunction = cleanup;

      logger.debug("FCM initialization completed successfully");
      return cleanup;
    } catch (error) {
      logger.error("Failed to initialize push notifications", error);
      return undefined;
    }
  }

  /**
   * Handle initial notification when app is opened from terminated state
   */
  static async handleInitialNotification(): Promise<void> {
    try {
      const lastNotificationResponse =
        await Notifications.getLastNotificationResponseAsync();

      if (lastNotificationResponse) {
        const data = lastNotificationResponse.notification.request.content.data;

        // Navigate to story if it's a story complete notification
        if (data?.type === "story_complete" && data?.storyId) {
          // Use requestAnimationFrame to ensure navigation is ready
          requestAnimationFrame(() => {
            router.push({
              pathname: "/story/[id]",
              params: { id: String(data.storyId) },
            });
          });
        }
      }
    } catch (error) {
      logger.error("Error handling initial notification", error);
    }
  }

  /**
   * Handle foreground and background messages
   */
  static setupMessageHandling(): () => void {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false, // We'll handle this with Toast
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: false, // We'll show our own toast
        shouldShowList: false, // We'll show our own toast
      }),
    });

    // Handle notifications received while the app is foregrounded
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        const { title, body, data } = notification.request.content;

        // Show toast notification (this listener only fires when app is in foreground)
        Toast.show({
          type: "success",
          text1: title || "New Notification",
          text2: body || "",
          position: "top",
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 60,
          onPress: () => {
            // Handle toast tap - navigate to story if it's a story complete notification
            if (data?.type === "story_complete" && data?.storyId) {
              router.push({
                pathname: "/story/[id]",
                params: { id: String(data.storyId) },
              });
            } else if (data?.type === "story_report") {
            }
          },
        });

        // Handle story report notifications
        if (data?.type === "story_report") {
        }
      });

    // Handle notification responses (when user taps notification from background/lock screen)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        // Navigate to story when user taps a story complete notification
        if (data?.type === "story_complete" && data?.storyId) {
          router.push({
            pathname: "/story/[id]",
            params: { id: String(data.storyId) },
          });
        } else if (data?.type === "story_report") {
          // Navigate to report details or admin panel if needed
        }
      });

    // Return cleanup function
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }

  /**
   * Cleanup FCM listeners only (keep token in database)
   * This is called during sign out to stop receiving notifications
   * but preserves the token for when the user signs back in
   */
  static async cleanupListeners(): Promise<void> {
    try {
      // Clean up notification listeners
      if (this.cleanupFunction) {
        this.cleanupFunction();
        this.cleanupFunction = null;
      }

      // Reset initialization flag so FCM can be re-initialized
      this.isInitialized = false;

      logger.debug("FCM listeners cleaned up, token preserved");
    } catch (error) {
      logger.error("FCM listener cleanup failed", error);
    }
  }

  /**
   * Full cleanup FCM including token removal from database
   * This should only be called when completely removing the user
   * (e.g., account deletion, device change, etc.)
   */
  static async cleanup(): Promise<void> {
    try {
      // Remove push token from backend
      await NotificationService.removeFCMToken();

      // Clean up notification listeners
      await this.cleanupListeners();

      logger.debug("FCM fully cleaned up including token removal");
    } catch (error) {
      logger.error("Failed to cleanup push notifications", error);
    }
  }

  /**
   * Check if device supports push notifications
   */
  static async isSupported(): Promise<boolean> {
    try {
      // Check if we can get permissions as a way to determine support
      const { status } = await Notifications.getPermissionsAsync();
      return status !== "undetermined" && status !== "denied";
    } catch (error) {
      logger.error("Push notification support check failed", error);
      return false;
    }
  }

  /**
   * Schedule a test notification (for development/testing)
   */
  static async scheduleTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is a test push notification",
        data: { type: "test" },
      },
      trigger: {
        seconds: 2,
      } as any, // Type assertion for expo-notifications compatibility
    });
  }

  /**
   * Schedule a test story complete notification
   */
  static async scheduleTestStoryNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌟 Your story is ready!",
        body: '"The Magical Adventure" is complete with all illustrations. Time for bedtime reading!',
        data: {
          type: "story_complete",
          storyId: "eYabXdTHCGD6VpouIMnX",
          storyTitle: "The Magical Adventure",
        },
      },
      trigger: {
        seconds: 2,
      } as any,
    });
  }
}
