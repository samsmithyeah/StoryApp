import * as admin from "firebase-admin";
import { https } from "firebase-functions/v2";
import { logger } from "./utils/logger";
import { emailHashSalt, hashEmail } from "./utils/crypto";

const db = admin.firestore();

export const checkDeletionMarker = https.onCall(
  {
    region: "us-central1",
    cors: true,
    invoker: "public",
    secrets: [emailHashSalt],
  },
  async (request: https.CallableRequest) => {
    logger.info("checkDeletionMarker function called", {
      auth: request.auth,
      data: request.data,
    });

    const { auth, data } = request;

    if (!auth?.uid) {
      logger.error("User is not properly authenticated.", { auth });
      throw new https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    const { email } = data;

    if (!email || typeof email !== "string") {
      logger.error("Invalid or missing email in request data", { data });
      throw new https.HttpsError(
        "invalid-argument",
        "Email address is required and must be a string."
      );
    }

    try {
      const hashedEmail = hashEmail(email);
      logger.debug("Checking for deletion marker", {
        userId: auth.uid,
        hashedEmail,
      });

      const markerRef = db.collection("deletedAccountMarkers").doc(hashedEmail);
      const markerDoc = await markerRef.get();

      const hasMarker = markerDoc && markerDoc.exists;
      logger.info("Deletion marker check completed", {
        userId: auth.uid,
        hasMarker,
        hashedEmail,
      });

      return { hasMarker };
    } catch (error) {
      logger.error("Error checking deletion marker", error, {
        userId: auth.uid,
      });
      throw new https.HttpsError("unknown", "Failed to check deletion marker.");
    }
  }
);
