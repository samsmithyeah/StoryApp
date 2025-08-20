import { doc, updateDoc } from "@react-native-firebase/firestore";
import auth, { getAuth } from "@react-native-firebase/auth";
import { db } from "./config";

/**
 * Firebase Cloud Messaging token management for push notifications
 */
export class NotificationService {
  /**
   * Register FCM token for the current user
   * This should be called when the user logs in and FCM token is obtained
   */
  static async registerFCMToken(fcmToken: string): Promise<void> {
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      throw new Error("User must be authenticated to register FCM token");
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        fcmToken: fcmToken,
        fcmTokenUpdated: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      });

      console.log("FCM token registered successfully");
    } catch (error) {
      console.error("Failed to register FCM token:", error);
      throw error;
    }
  }

  /**
   * Remove FCM token for the current user
   * This should be called when the user logs out
   */
  static async removeFCMToken(): Promise<void> {
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      return; // No user to remove token for
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        fcmToken: null,
        fcmTokenUpdated: new Date().toISOString(),
      });

      console.log("FCM token removed successfully");
    } catch (error) {
      console.error("Failed to remove FCM token:", error);
      throw error;
    }
  }

  /**
   * Update FCM token for the current user
   * This should be called when the token refreshes
   */
  static async updateFCMToken(newToken: string): Promise<void> {
    await this.registerFCMToken(newToken);
  }
}
