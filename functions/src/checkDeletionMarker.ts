import * as admin from "firebase-admin";
import { https } from "firebase-functions/v2";
import { logger } from "./utils/logger";
import * as crypto from "crypto";
import { defineSecret } from "firebase-functions/params";

const db = admin.firestore();

const emailHashSalt = defineSecret("EMAIL_HASH_SALT");

// Helper function to hash email addresses for deletion markers
const hashEmail = (email: string): string => {
  const salt = emailHashSalt.value();
  if (!salt) {
    throw new Error("EMAIL_HASH_SALT secret is not configured");
  }
  return crypto
    .createHmac("sha256", salt)
    .update(email.toLowerCase().trim())
    .digest("hex");
};

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
