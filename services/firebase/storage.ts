import { Platform } from 'react-native';
import { storageService } from './config';
import { webStorage } from './webConfig';

// Get the appropriate storage instance based on platform
const storage = Platform.OS === 'web' ? webStorage : storageService;

/**
 * Upload an image to Firebase Storage
 * @param imageUrl - The URL of the image to upload (e.g., from OpenAI)
 * @param path - The storage path where the image should be saved
 * @returns The Firebase Storage download URL
 */
export async function uploadImageFromUrl(imageUrl: string, path: string): Promise<string> {
  try {
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    if (Platform.OS === 'web') {
      // Web SDK approach
      const storageRef = storage.ref(path);
      const uploadTask = await storageRef.put(blob);
      const downloadUrl = await uploadTask.ref.getDownloadURL();
      return downloadUrl;
    } else {
      // React Native Firebase approach
      const reference = storage.ref(path);
      await reference.put(blob);
      const downloadUrl = await reference.getDownloadURL();
      return downloadUrl;
    }
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw error;
  }
}

/**
 * Delete an image from Firebase Storage
 * @param path - The storage path of the image to delete
 */
export async function deleteImage(path: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      const storageRef = storage.ref(path);
      await storageRef.delete();
    } else {
      const reference = storage.ref(path);
      await reference.delete();
    }
  } catch (error) {
    console.error('Error deleting image from Firebase Storage:', error);
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
export function getStoryImagePath(userId: string, storyId: string, imageName: string): string {
  return `stories/${userId}/${storyId}/${imageName}.png`;
}