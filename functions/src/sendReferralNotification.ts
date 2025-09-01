import * as admin from "firebase-admin";
import { logger } from "./utils/logger";

/**
 * Send push notification to user when they receive referral credits
 */
export async function sendReferralNotification(
  referrerId: string,
  referralData: {
    referralCode: string;
    refereeId: string;
    creditsEarned: number;
  }
) {
  // Make notification sending completely asynchronous and non-blocking
  setImmediate(async () => {
    try {
      const db = admin.firestore();

      // Get referrer's FCM/Expo push token with timeout
      const userDocPromise = db.collection("users").doc(referrerId).get();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("FCM lookup timeout")), 3000);
      });

      const userDoc = (await Promise.race([
        userDocPromise,
        timeoutPromise,
      ])) as admin.firestore.DocumentSnapshot;

      if (!userDoc.exists) {
        logger.debug("User document not found for notification", {
          userId: referrerId,
        });
        return;
      }

      const userData = userDoc.data();
      const expoPushToken = userData?.fcmToken;

      if (!expoPushToken) {
        logger.debug("Expo push token not found for user", {
          userId: referrerId,
          message: "User may need to log in to register device",
        });
        return;
      }

      // Create Expo push notification payload
      logger.info("Sending referral completion notification", {
        referrerId,
        referralCode: referralData.referralCode,
        creditsEarned: referralData.creditsEarned,
      });

      const message = {
        to: expoPushToken,
        title: "🎉 Referral bonus earned!",
        body: `Somebody joined via your referral code! You've earned ${referralData.creditsEarned} credits.`,
        data: {
          type: "referral_complete",
          referralCode: referralData.referralCode,
          refereeId: referralData.refereeId,
          creditsEarned: referralData.creditsEarned.toString(),
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
        logger.info("Referral completion notification sent successfully", {
          referrerId,
          referralCode: referralData.referralCode,
          result,
        });
      } else {
        logger.error("Failed to send referral completion notification", {
          result,
        });
      }
    } catch (error: any) {
      logger.debug("Failed to send referral completion notification", {
        error: error?.message || error,
        referrerId,
      });
      // Don't throw error - notification failure shouldn't fail the referral process
    }
  });

  // Return immediately without waiting for notification
  return;
}
