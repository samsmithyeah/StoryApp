import * as admin from "firebase-admin";
// import { defineSecret } from "firebase-functions/params"; // Temporarily disabled
import { HttpsError, onCall } from "firebase-functions/v2/https";
// import { google } from "googleapis"; // Temporarily disabled
// import * as nodemailer from "nodemailer"; // Temporarily disabled

// const OAuth2 = google.auth.OAuth2; // Temporarily disabled

// Gmail OAuth secrets (temporarily disabled)
// export const gmailClientId = defineSecret("GMAIL_CLIENT_ID");
// export const gmailClientSecret = defineSecret("GMAIL_CLIENT_SECRET");
// export const gmailRefreshToken = defineSecret("GMAIL_REFRESH_TOKEN");

// Email configuration (temporarily disabled)
// const ADMIN_EMAIL = "sam@sammysmith.co.uk";
// const FROM_EMAIL = "noreply@dreamweaver-app.com"; // This should be configured in your Google Workspace
// Admin configuration for push notifications
const ADMIN_USER_ID = "s772Li2Zb1QzfZc1YASX9LoJACC2";

// Note: Email notifications not currently implemented

async function sendPushNotification(reportData: any, reportId: string) {
  try {
    // Get admin's Expo push token from Firestore
    const db = admin.firestore();
    const adminDoc = await db.collection("users").doc(ADMIN_USER_ID).get();

    if (!adminDoc.exists) {
      console.warn(`Admin user document not found: ${ADMIN_USER_ID}`);
      return;
    }

    const adminData = adminDoc.data();
    const expoPushToken = adminData?.fcmToken; // We're reusing the fcmToken field for Expo tokens

    if (!expoPushToken) {
      console.warn(
        "Admin Expo push token not found. User may need to log in to register device."
      );
      return;
    }

    // Create Expo push notification payload
    const message = {
      to: expoPushToken,
      title: "🚩 Story Report",
      body: `"${reportData.storyTitle}" has been reported for inappropriate content`,
      data: {
        type: "story_report",
        reportId: reportId,
        storyId: reportData.storyId,
        storyTitle: reportData.storyTitle,
      },
      sound: "default",
      badge: 1,
      priority: "high",
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

    if (!response.ok) {
      throw new Error(
        `Expo push API returned ${response.status}: ${await response.text()}`
      );
    }

    const result = await response.json();
    console.log(
      `Expo push notification sent to admin for report ${reportId}:`,
      result
    );
  } catch (error) {
    console.error("Failed to send push notification:", error);
    // Don't throw error - push notification failure shouldn't fail the report
  }
}

interface ReportStoryRequest {
  storyId: string;
  storyTitle?: string;
  storyContent?: any[];
  storyConfiguration?: any;
  reportedAt: string;
}

export const reportStory = onCall<ReportStoryRequest>(
  {
    cors: true,
    // Gmail secrets temporarily removed since email is disabled
    // secrets: [gmailClientId, gmailClientSecret, gmailRefreshToken],
  },
  async (request) => {
    try {
      // Verify user is authenticated
      if (!request.auth) {
        throw new HttpsError(
          "unauthenticated",
          "User must be authenticated to report a story"
        );
      }

      const {
        storyId,
        storyTitle,
        storyContent,
        storyConfiguration,
        reportedAt,
      } = request.data;

      if (!storyId) {
        throw new HttpsError("invalid-argument", "Story ID is required");
      }

      // Create report document
      const reportData = {
        storyId,
        storyTitle: storyTitle || "Unknown",
        reportedBy: request.auth.uid,
        reportedByEmail: request.auth.token.email || "Unknown",
        reportedAt: reportedAt || new Date().toISOString(),
        status: "pending", // pending, reviewed, resolved
        storyContent: storyContent || null,
        storyConfiguration: storyConfiguration || null,
        reviewed: false,
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: null,
        actionTaken: null, // none, content_removed, user_warned, user_blocked
      };

      // Save report to Firestore
      const db = admin.firestore();
      const reportRef = await db.collection("storyReports").add(reportData);

      // Log the report for monitoring
      console.log(`Story reported: ${storyId} by user ${request.auth.uid}`, {
        reportId: reportRef.id,
        storyTitle,
        userEmail: request.auth.token.email,
      });

      // Send email notification to admin (temporarily disabled)
      // await sendReportNotification(reportData, reportRef.id);

      // Send push notification to admin
      await sendPushNotification(reportData, reportRef.id);

      return {
        success: true,
        reportId: reportRef.id,
        message: "Story reported successfully",
      };
    } catch (error) {
      console.error("Error reporting story:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Failed to report story. Please try again later."
      );
    }
  }
);
