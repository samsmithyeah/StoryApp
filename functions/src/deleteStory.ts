import * as admin from "firebase-admin";
import { https } from "firebase-functions/v2";
import { logger } from "./utils/logger";

const db = admin.firestore();
const storage = admin.storage();

interface DeleteStoryRequest {
  storyId: string;
}

export const deleteStory = https.onCall<DeleteStoryRequest>(
  {
    region: "us-central1",
    cors: true,
    invoker: "public",
  },
  async (request: https.CallableRequest<DeleteStoryRequest>) => {
    logger.info("deleteStory function called", {
      auth: request.auth,
      data: request.data,
    });

    const { auth, data } = request;

    if (!auth) {
      logger.error("No auth object in request");
      throw new https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    if (!auth.uid) {
      logger.error("No uid in auth object", { auth });
      throw new https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    if (!data?.storyId) {
      throw new https.HttpsError("invalid-argument", "Story ID is required.");
    }

    const userId = auth.uid;
    const { storyId } = data;

    logger.info("Starting story deletion", { storyId, userId });

    try {
      // First, get the story document to verify ownership and get image paths
      const storyDocRef = db.collection("stories").doc(storyId);
      const storyDoc = await storyDocRef.get();

      if (!storyDoc.exists) {
        throw new https.HttpsError("not-found", "Story not found.");
      }

      const storyData = storyDoc.data();

      // Verify the story belongs to the authenticated user
      if (storyData?.userId !== userId) {
        throw new https.HttpsError(
          "permission-denied",
          "You can only delete your own stories."
        );
      }

      logger.debug("Verified story ownership", { storyId });

      // Delete the story document from Firestore
      await storyDocRef.delete();
      logger.info("Story document deleted", { storyId });

      // Delete all associated images from Firebase Storage
      try {
        const bucket = storage.bucket();
        const storyStoragePrefix = `stories/${userId}/${storyId}/`;

        // List all files with the story's prefix
        const [files] = await bucket.getFiles({ prefix: storyStoragePrefix });

        if (files.length > 0) {
          // Delete all files in parallel
          const deletePromises = files.map(async (file) => {
            await file.delete();
            logger.debug("Deleted storage file", { fileName: file.name });
          });

          await Promise.all(deletePromises);
          logger.info("Storage cleanup completed", { storyId });
        } else {
          logger.debug("No storage files found", { storyId });
        }
      } catch (storageError) {
        logger.error("Storage cleanup failed", storageError, { storyId });
        // Don't throw here - we want to continue even if storage cleanup fails
        // The story document is already deleted from Firestore
      }

      logger.info("Story deletion completed successfully", { storyId });

      return {
        success: true,
        message: "Story deleted successfully",
        storyId: storyId,
      };
    } catch (error) {
      logger.error("Error deleting story", error, { storyId });

      // Re-throw HttpsError instances as-is
      if (error instanceof https.HttpsError) {
        throw error;
      }

      throw new https.HttpsError("unknown", "Failed to delete story.");
    }
  }
);
