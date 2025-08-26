import * as admin from "firebase-admin";
import { logger } from "./utils/logger";

/**
 * Send push notification to user when their story is fully complete
 */
export async function sendStoryCompleteNotification(
  userId: string,
  storyData: any
) {
  try {
    const db = admin.firestore();

    // Get user's FCM/Expo push token
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      logger.warn("User document not found", { userId });
      return;
    }

    const userData = userDoc.data();
    const expoPushToken = userData?.fcmToken;

    if (!expoPushToken) {
      logger.warn("Expo push token not found for user", {
        userId,
        message: "User may need to log in to register device",
      });
      return;
    }

    // Create Expo push notification payload
    logger.info("Sending story complete notification", {
      userId,
      storyTitle: storyData.title,
    });

    const message = {
      to: expoPushToken,
      title: "🌟 Your story is ready!",
      body: `"${storyData.title}" is complete with all illustrations. Time for bedtime reading!`,
      data: {
        type: "story_complete",
        storyId: storyData.id || storyData.storyId,
        storyTitle: storyData.title,
      },
      sound: "default",
      badge: 1,
    };

    // Send push notification via Expo Push API
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data && result.data.status === "ok") {
      logger.info("Story complete notification sent successfully", {
        userId,
        storyTitle: storyData.title,
        result,
      });
    } else {
      logger.error("Failed to send story complete notification", { result });
    }
  } catch (error) {
    logger.error("Failed to send story complete notification", error);
    // Don't throw error - notification failure shouldn't fail the story generation
  }
}
