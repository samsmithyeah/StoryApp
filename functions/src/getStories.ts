import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "./utils/logger";

export const getStories = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const userId = request.auth.uid;
    const db = getFirestore();
    const storiesSnapshot = await db
      .collection("stories")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const stories = storiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, stories };
  } catch (error) {
    logger.error("Error fetching stories", error, {
      userId: request.auth?.uid,
    });
    throw new HttpsError("internal", "Failed to fetch stories");
  }
});
