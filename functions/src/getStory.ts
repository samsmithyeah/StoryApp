import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";

export const getStory = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const data = request.data as { storyId: string };

  try {
    const userId = request.auth.uid;
    const storyDoc = await admin
      .firestore()
      .collection("stories")
      .doc(data.storyId)
      .get();

    if (!storyDoc.exists) {
      throw new HttpsError("not-found", "Story not found");
    }

    const storyData = storyDoc.data();

    if (storyData?.userId !== userId) {
      throw new HttpsError("permission-denied", "Access denied");
    }

    return {
      success: true,
      story: {
        id: storyDoc.id,
        ...storyData,
      },
    };
  } catch (error) {
    console.error("Error fetching story:", error);
    throw new HttpsError("internal", "Failed to fetch story");
  }
});
