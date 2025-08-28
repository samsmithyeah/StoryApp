import { defineSecret } from "firebase-functions/params";
import * as crypto from "crypto";

export const emailHashSalt = defineSecret("EMAIL_HASH_SALT");

// Helper function to hash email addresses for deletion markers
export const hashEmail = (email: string): string => {
  const salt = emailHashSalt.value();
  if (!salt) {
    throw new Error("EMAIL_HASH_SALT secret is not configured");
  }
  return crypto
    .createHmac("sha256", salt)
    .update(email.toLowerCase().trim())
    .digest("hex");
};
