import * as Notifications from "expo-notifications";
import { NotificationService } from "./firebase/notifications";

/**
 * Push notification service using Expo Notifications
 */
export class FCMService {
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

      console.log("Notification permission status:", finalStatus);
      return finalStatus === "granted";
    } catch (error) {
      console.error("Failed to request notification permissions:", error);
      return false;
    }
  }

  /**
   * Get and register Expo push token
   * This should be called after successful authentication
   */
  static async initializeFCM(): Promise<(() => void) | undefined> {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn("Notification permissions not granted");
        return undefined;
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "1bd7d4bd-9179-4cab-acee-fe6fa69367d3",
      });

      const expoPushToken = tokenData.data;
      console.log("Expo Push Token obtained:", expoPushToken);

      if (expoPushToken) {
        // Register token with our backend
        await NotificationService.registerFCMToken(expoPushToken);
      }

      // Set up notification handling
      return this.setupMessageHandling();
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      return undefined;
    }
  }

  /**
   * Handle foreground and background messages
   */
  static setupMessageHandling(): () => void {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Handle notifications received while the app is foregrounded
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received in foreground:", notification);

        // Handle story report notifications
        const data = notification.request.content.data;
        if (data?.type === "story_report") {
          console.log(
            "Story report notification:",
            notification.request.content.title
          );
          console.log("Report ID:", data.reportId);
          console.log("Story ID:", data.storyId);
        }
      });

    // Handle notification responses (when user taps notification)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);

        const data = response.notification.request.content.data;
        if (data?.type === "story_report") {
          console.log("User tapped story report notification");
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
   * Cleanup FCM on logout
   */
  static async cleanup(): Promise<void> {
    try {
      // Remove push token from backend
      await NotificationService.removeFCMToken();
      console.log("Push notification cleanup completed");
    } catch (error) {
      console.error("Failed to cleanup push notifications:", error);
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
      console.log("Push notification support check failed:", error);
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
}
