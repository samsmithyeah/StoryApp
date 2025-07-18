import * as admin from "firebase-admin";

// Initialize storage bucket
const bucket = admin.storage().bucket();

// Function to upload image from URL to Firebase Storage
export async function uploadImageToStorage(
  imageUrl: string,
  userId: string,
  storyId: string,
  imageName: string
): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const file = bucket.file(`stories/${userId}/${storyId}/${imageName}.png`);

    // Upload to Firebase Storage
    await file.save(Buffer.from(buffer), {
      metadata: {
        contentType: "image/png",
      },
      public: false, // Keep images private
      validation: false, // Skip validation for performance
    });

    // Return the storage path instead of a signed URL
    // The client will use getDownloadURL() to get an authenticated URL
    const storagePath = `stories/${userId}/${storyId}/${imageName}.png`;

    return storagePath;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    throw error;
  }
}