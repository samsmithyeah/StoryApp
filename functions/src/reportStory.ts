import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";

interface ReportStoryRequest {
  storyId: string;
  storyTitle?: string;
  storyContent?: any[];
  storyConfiguration?: any;
  reportedAt: string;
}

export const reportStory = onCall<ReportStoryRequest>(
  { cors: true },
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

      // Optional: Send notification to admin/moderators
      // You can implement email notifications or push notifications here
      // Example: await sendAdminNotification(reportRef.id, reportData);

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
