import * as admin from "firebase-admin";

/**
 * Send push notification to user when their story is fully complete
 * Only sends if the app is not currently active
 */
export async function sendStoryCompleteNotification(
  userId: string,
  storyData: any
) {
  try {
    const db = admin.firestore();

    // Get user's FCM/Expo push token and app state
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.warn(`User document not found: ${userId}`);
      return;
    }

    const userData = userDoc.data();
    const expoPushToken = userData?.fcmToken;
    const appState = userData?.appState;
    const lastStateUpdate = userData?.lastStateUpdate;

    if (!expoPushToken) {
      console.warn(
        `Expo push token not found for user ${userId}. User may need to log in to register device.`
      );
      return;
    }

    // Check if app is currently active
    if (appState === "active") {
      // Check how recent the last state update is (in case the app crashed without updating state)
      const lastUpdateTime = lastStateUpdate ? new Date(lastStateUpdate) : null;
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      if (lastUpdateTime && lastUpdateTime > fiveMinutesAgo) {
        console.log(
          `Skipping notification for user ${userId} - app is currently active (state: ${appState}, updated: ${lastStateUpdate})`
        );
        return;
      } else {
        console.log(
          `App state appears stale (${lastStateUpdate}), proceeding with notification for user ${userId}`
        );
      }
    }

    // Create Expo push notification payload
    console.log(
      `Sending story complete notification to user ${userId} (app state: ${appState || "unknown"}) for story "${storyData.title}"`
    );

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
      console.log(
        `Story complete notification sent to user ${userId} for story "${storyData.title}":`,
        result
      );
    } else {
      console.error("Failed to send story complete notification:", result);
    }
  } catch (error) {
    console.error("Failed to send story complete notification:", error);
    // Don't throw error - notification failure shouldn't fail the story generation
  }
}
