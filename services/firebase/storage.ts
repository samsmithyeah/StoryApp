import {
  getDownloadURL as rnGetDownloadURL,
  ref as rnRef,
} from "@react-native-firebase/storage";
import { storageService, authService } from "./config";
import { logger } from "../../utils/logger";

/**
 * Get an authenticated download URL for a storage path
 * @param storagePath - The storage path (e.g., from Firestore)
 * @returns The authenticated download URL
 */
export async function getAuthenticatedUrl(
  storagePath: string | null | undefined
): Promise<string | null> {
  if (!storagePath) return null;

  // Check if user is authenticated before attempting storage operations
  if (!authService.currentUser) {
    logger.debug("User not authenticated, skipping storage URL request", {
      storagePath,
    });
    return null;
  }

  try {
    // Check if it's already a full URL (for backwards compatibility)
    if (
      storagePath.startsWith("http://") ||
      storagePath.startsWith("https://")
    ) {
      // For old signed URLs, we need to check if they're still valid
      // If they're expired or invalid, we should return null to trigger fallback
      try {
        const response = await fetch(storagePath, { method: "HEAD" });
        if (response.ok) {
          return storagePath;
        } else {
          return null;
        }
      } catch (fetchError) {
        logger.warn("Error checking signed URL validity", fetchError);
        return null;
      }
    }

    // Get authenticated download URL for storage path
    const reference = rnRef(storageService, storagePath);
    return await rnGetDownloadURL(reference);
  } catch (error) {
    // Handle authorization errors more gracefully during signout
    if ((error as any).code === "storage/unauthorized") {
      logger.debug("Storage unauthorized (user may have signed out)", {
        storagePath,
      });
      return null;
    }

    logger.error("Error getting authenticated URL", { storagePath, error });

    // If we get a "not found" error, it might mean the file doesn't exist
    if ((error as any).code === "storage/object-not-found") {
      logger.error("Storage object not found", {
        storagePath,
        expectedFormat: "stories/{userId}/{storyId}/{imageName}.png",
      });
    }

    return null;
  }
}
