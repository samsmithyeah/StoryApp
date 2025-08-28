import { getAuth } from "@react-native-firebase/auth";
import { doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import { logger } from "../../utils/logger";
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

    logger.debug("Starting FCM token registration", {
      userExists: !!user,
      uid: user?.uid,
      token: fcmToken,
    });

    if (!user) {
      throw new Error("User must be authenticated to register FCM token");
    }

    try {
      const userRef = doc(db, "users", user.uid);
      logger.debug("Firestore document reference created", {
        userId: user.uid,
      });

      const tokenData = {
        fcmToken: fcmToken,
        fcmTokenUpdated: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      logger.debug("Token data to save", tokenData);

      // Only update existing documents, don't create new ones during signup
      // This prevents FCM from interfering with the signup deletion marker check
      let tokenSaved = false;
      try {
        const docSnapshot = await getDoc(userRef);
        if (docSnapshot.exists()) {
          await updateDoc(userRef, tokenData);
          logger.debug(
            "FCM token successfully saved to existing Firestore document"
          );
          tokenSaved = true;
        } else {
          logger.debug(
            "User document doesn't exist yet, skipping FCM token save (will retry later)"
          );
          // Don't create the document - let the signup process handle it first
        }
      } catch (error) {
        logger.error("Error saving FCM token", error);
        // Don't throw - FCM registration can be retried later
      }

      // Verify the token was actually written by reading it back (only if we tried to save it)
      if (tokenSaved) {
        const verifySnapshot = await getDoc(userRef);
        if (verifySnapshot.exists()) {
          const savedData = verifySnapshot.data();
          logger.debug("Token verification successful", {
            documentData: savedData,
            fcmTokenExists: !!savedData?.fcmToken,
            savedToken: savedData?.fcmToken,
          });
        } else {
          logger.error("Token verification FAILED - document does not exist!");
        }
      } else {
        logger.debug("Skipping token verification - token save was deferred");
      }
    } catch (error) {
      logger.error("Failed to register FCM token", error);
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
      logger.error("Failed to remove FCM token", error);
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
