import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "@react-native-firebase/firestore";
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

    console.log("[NOTIFICATIONS] Starting FCM token registration...");
    console.log("[NOTIFICATIONS] User exists:", !!user, "UID:", user?.uid);
    console.log("[NOTIFICATIONS] Token to register:", fcmToken);

    if (!user) {
      throw new Error("User must be authenticated to register FCM token");
    }

    try {
      const userRef = doc(db, "users", user.uid);
      console.log(
        "[NOTIFICATIONS] Firestore document reference created for user:",
        user.uid
      );

      const tokenData = {
        fcmToken: fcmToken,
        fcmTokenUpdated: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      console.log("[NOTIFICATIONS] Token data to save:", tokenData);

      // Use setDoc with merge: true to create the document if it doesn't exist
      // or update it if it does exist
      await setDoc(userRef, tokenData, { merge: true });
      console.log("[NOTIFICATIONS] FCM token successfully saved to Firestore");

      // Verify the token was actually written by reading it back
      const verifySnapshot = await getDoc(userRef);
      if (verifySnapshot.exists()) {
        const savedData = verifySnapshot.data();
        console.log(
          "[NOTIFICATIONS] Token verification - document data:",
          savedData
        );
        console.log(
          "[NOTIFICATIONS] Token verification - fcmToken exists:",
          !!savedData?.fcmToken
        );
        console.log(
          "[NOTIFICATIONS] Token verification - saved token:",
          savedData?.fcmToken
        );
      } else {
        console.error(
          "[NOTIFICATIONS] Token verification FAILED - document does not exist!"
        );
      }
    } catch (error) {
      console.error("[NOTIFICATIONS] Failed to register FCM token:", error);
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
