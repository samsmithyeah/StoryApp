import * as admin from "firebase-admin";
import { https } from "firebase-functions/v2";
import { logger } from "./utils/logger";
import { emailHashSalt, hashEmail } from "./utils/crypto";

const db = admin.firestore();
const storage = admin.storage();

export const deleteUserData = https.onCall(
  {
    region: "us-central1",
    cors: true,
    invoker: "public",
    secrets: [emailHashSalt],
  },
  async (request: https.CallableRequest) => {
    logger.info("deleteUserData function called", {
      auth: request.auth,
      data: request.data,
    });

    const { auth } = request;

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

    logger.debug("Authenticated user ID", { userId: auth.uid });

    const userId = auth.uid;
    logger.info("Starting data deletion for user", { userId });

    try {
      // Create deletion marker before deleting any data
      const userEmail = auth.token.email;
      if (userEmail) {
        try {
          const hashedEmail = hashEmail(userEmail);
          const markerRef = db
            .collection("deletedAccountMarkers")
            .doc(hashedEmail);

          // Check if marker already exists to handle repeated deletions
          const existingMarker = await markerRef.get();
          if (existingMarker && existingMarker.exists) {
            // Update existing marker
            await markerRef.update({
              lastDeletedAt: admin.firestore.FieldValue.serverTimestamp(),
              deletionCount: admin.firestore.FieldValue.increment(1),
            });
            logger.debug("Updated existing deletion marker", { hashedEmail });
          } else {
            // Create new marker
            await markerRef.set({
              lastDeletedAt: admin.firestore.FieldValue.serverTimestamp(),
              deletionCount: 1,
            });
            logger.debug("Created new deletion marker", { hashedEmail });
          }
        } catch (markerError) {
          logger.error("Failed to create deletion marker", markerError, {
            userId,
          });
          // Continue with deletion even if marker creation fails
        }
      } else {
        logger.warn("No email found in auth token, skipping deletion marker", {
          userId,
        });
      }
      // Create a batch for Firestore operations
      const batch = db.batch();

      // Delete user document
      const userDocRef = db.collection("users").doc(userId);
      batch.delete(userDocRef);
      logger.debug("Queued user document for deletion", { userId });

      // Delete user preferences
      const preferencesDocRef = db.collection("userPreferences").doc(userId);
      batch.delete(preferencesDocRef);
      logger.debug("Queued user preferences for deletion", { userId });

      // Delete user credits
      const userCreditsDocRef = db.collection("userCredits").doc(userId);
      batch.delete(userCreditsDocRef);
      logger.debug("Queued user credits for deletion", { userId });

      // Delete children documents
      const childrenSnapshot = await db
        .collection("children")
        .where("userId", "==", userId)
        .get();

      childrenSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        logger.debug("Queued child document for deletion", { childId: doc.id });
      });

      // Delete saved characters documents
      const charactersSnapshot = await db
        .collection("savedCharacters")
        .where("userId", "==", userId)
        .get();

      charactersSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        logger.debug("Queued saved character for deletion", {
          characterId: doc.id,
        });
      });

      // Delete stories documents
      const storiesSnapshot = await db
        .collection("stories")
        .where("userId", "==", userId)
        .get();

      storiesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        logger.debug("Queued story for deletion", { storyId: doc.id });
      });

      // Delete credit transactions
      const creditTransactionsSnapshot = await db
        .collection("creditTransactions")
        .where("userId", "==", userId)
        .get();

      creditTransactionsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        logger.debug("Queued credit transaction for deletion", {
          transactionId: doc.id,
        });
      });

      // Delete purchase history
      const purchaseHistorySnapshot = await db
        .collection("purchaseHistory")
        .where("userId", "==", userId)
        .get();

      purchaseHistorySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        logger.debug("Queued purchase history for deletion", {
          purchaseId: doc.id,
        });
      });

      // Commit all Firestore deletions
      await batch.commit();
      logger.info("Firestore data deleted successfully for user", { userId });

      // Delete all user files from Firebase Storage
      try {
        const bucket = storage.bucket();
        const userStoragePrefix = `stories/${userId}/`;

        // List all files with the user's prefix
        const [files] = await bucket.getFiles({ prefix: userStoragePrefix });

        if (files.length > 0) {
          // Delete all files in parallel
          const deletePromises = files.map(async (file) => {
            await file.delete();
            logger.debug("Deleted storage file", { fileName: file.name });
          });

          await Promise.all(deletePromises);
          logger.info("Storage cleanup completed for user", { userId });
        } else {
          logger.debug("No storage files found for user", { userId });
        }
      } catch (storageError) {
        logger.error("Storage cleanup failed for user", storageError, {
          userId,
        });
        // Don't throw here - we want to continue even if storage cleanup fails
      }

      // Delete from Firebase Auth
      await admin.auth().deleteUser(userId);
      logger.info("User account deleted from Firebase Auth", { userId });

      logger.info("Data deletion completed successfully for user", { userId });

      return {
        success: true,
        message: "User data deleted successfully",
        deletedCollections: [
          "users",
          "userPreferences",
          "userCredits",
          "children",
          "savedCharacters",
          "stories",
          "creditTransactions",
          "purchaseHistory",
          "storage",
          "auth",
          "deletedAccountMarkers",
        ],
      };
    } catch (error) {
      logger.error("Error deleting user data", error, { userId });
      throw new https.HttpsError("unknown", "Failed to delete user account.");
    }
  }
);
