import * as admin from "firebase-admin";
import { https } from "firebase-functions/v2";

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
    console.log("=== deleteStory function called ===");
    console.log("Request auth:", request.auth);
    console.log("Request data:", request.data);

    const { auth, data } = request;

    if (!auth) {
      console.error("No auth object in request");
      throw new https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    if (!auth.uid) {
      console.error("No uid in auth object:", auth);
      throw new https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    if (!data?.storyId) {
      throw new https.HttpsError(
        "invalid-argument",
        "Story ID is required."
      );
    }

    const userId = auth.uid;
    const { storyId } = data;
    
    console.log(`Starting story deletion for story: ${storyId}, user: ${userId}`);

    try {
      // First, get the story document to verify ownership and get image paths
      const storyDocRef = db.collection("stories").doc(storyId);
      const storyDoc = await storyDocRef.get();

      if (!storyDoc.exists) {
        throw new https.HttpsError(
          "not-found",
          "Story not found."
        );
      }

      const storyData = storyDoc.data();
      
      // Verify the story belongs to the authenticated user
      if (storyData?.userId !== userId) {
        throw new https.HttpsError(
          "permission-denied",
          "You can only delete your own stories."
        );
      }

      console.log(`Verified story ownership for story: ${storyId}`);

      // Delete the story document from Firestore
      await storyDocRef.delete();
      console.log(`Story document deleted: ${storyId}`);

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
            console.log(`Deleted storage file: ${file.name}`);
          });

          await Promise.all(deletePromises);
          console.log(`Storage cleanup completed for story: ${storyId}`);
        } else {
          console.log(`No storage files found for story: ${storyId}`);
        }
      } catch (storageError) {
        console.error(
          `Storage cleanup failed for story ${storyId}:`,
          storageError
        );
        // Don't throw here - we want to continue even if storage cleanup fails
        // The story document is already deleted from Firestore
      }

      console.log(`Story deletion completed successfully for story: ${storyId}`);

      return {
        success: true,
        message: "Story deleted successfully",
        storyId: storyId,
      };
    } catch (error) {
      console.error(`Error deleting story ${storyId}:`, error);
      
      // Re-throw HttpsError instances as-is
      if (error instanceof https.HttpsError) {
        throw error;
      }
      
      throw new https.HttpsError("unknown", "Failed to delete story.");
    }
  }
);