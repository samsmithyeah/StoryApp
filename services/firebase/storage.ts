import {
  getDownloadURL as rnGetDownloadURL,
  ref as rnRef,
} from "@react-native-firebase/storage";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { Platform } from "react-native";
import { storageService } from "./config";
import { webStorage } from "./webConfig";

// Get the appropriate storage instance based on platform
const storage = Platform.OS === "web" ? webStorage : storageService;

/**
 * Upload an image to Firebase Storage
 * @param imageUrl - The URL of the image to upload (e.g., from OpenAI)
 * @param path - The storage path where the image should be saved
 * @returns The Firebase Storage download URL
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  path: string
): Promise<string> {
  try {
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Upload to Firebase Storage
    if (Platform.OS === "web") {
      // Web SDK approach
      const storageRef = ref(storage as any, path);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } else {
      // React Native Firebase approach
      const reference = rnRef(storageService, path);
      await reference.put(blob);
      const downloadUrl = await rnGetDownloadURL(reference);
      return downloadUrl;
    }
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    throw error;
  }
}

/**
 * Delete an image from Firebase Storage
 * @param path - The storage path of the image to delete
 */
export async function deleteImage(path: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      const storageRef = ref(storage as any, path);
      await deleteObject(storageRef);
    } else {
      const reference = rnRef(storageService, path);
      await reference.delete();
    }
  } catch (error) {
    console.error("Error deleting image from Firebase Storage:", error);
    throw error;
  }
}

/**
 * Generate a storage path for a story image
 * @param userId - The ID of the user who owns the story
 * @param storyId - The ID of the story
 * @param imageName - The name of the image (e.g., 'cover' or 'page-1')
 * @returns The storage path
 */
export function getStoryImagePath(
  userId: string,
  storyId: string,
  imageName: string
): string {
  return `stories/${userId}/${storyId}/${imageName}.png`;
}

/**
 * Get an authenticated download URL for a storage path
 * @param storagePath - The storage path (e.g., from Firestore)
 * @returns The authenticated download URL
 */
export async function getAuthenticatedUrl(
  storagePath: string | null | undefined
): Promise<string | null> {
  if (!storagePath) return null;

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
        console.warn("Error checking signed URL validity:", fetchError);
        return null;
      }
    }

    // Get authenticated download URL for storage path
    if (Platform.OS === "web") {
      const storageRef = ref(storage as any, storagePath);
      return await getDownloadURL(storageRef);
    } else {
      const reference = rnRef(storageService, storagePath);
      return await rnGetDownloadURL(reference);
    }
  } catch (error) {
    console.error(
      "Error getting authenticated URL for path:",
      storagePath,
      error
    );

    // If we get a "not found" error, it might mean the file doesn't exist
    if ((error as any).code === "storage/object-not-found") {
      console.error("Storage object not found. Path:", storagePath);
      console.error(
        "Expected format: stories/{userId}/{storyId}/{imageName}.png"
      );
    }

    return null;
  }
}
