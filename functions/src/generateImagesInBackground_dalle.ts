import * as admin from "firebase-admin";
import OpenAI from "openai";
import { StoryGenerationRequest, StoryPage } from "./types";
import { uploadImageToStorage } from "./utils/storage";
import { retryWithBackoff } from "./utils/retry";

// Background image generation function using DALL-E (preserved for future use)
export async function generateImagesInBackgroundDALLE(
  storyId: string,
  storyContent: any,
  storyPages: StoryPage[],
  config: StoryGenerationRequest,
  averageAge: number,
  openai: OpenAI,
  userId: string
): Promise<void> {
  const storyRef = admin.firestore().collection("stories").doc(storyId);
  let imagesGenerated = 0;

  try {
    // Update status to generating
    await storyRef.update({
      imageGenerationStatus: "generating",
    });

    // Generate cover image first
    const coverPrompt = `A gentle, dreamy book cover illustration for a children's bedtime story titled "${storyContent.title}". Style: ${config.illustrationStyle}, soft colors, magical atmosphere, perfect for children aged ${averageAge}.`;

    const coverImageResponse = await retryWithBackoff(() =>
      openai.images.generate({
        model: "dall-e-3",
        prompt: coverPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      })
    );

    const tempCoverImageUrl = coverImageResponse.data?.[0]?.url || "";

    // Upload to Firebase Storage and update immediately
    if (tempCoverImageUrl) {
      try {
        const coverImageUrl = await uploadImageToStorage(
          tempCoverImageUrl,
          userId,
          storyId,
          "cover"
        );

        imagesGenerated++;
        await storyRef.update({
          coverImageUrl,
          imagesGenerated,
        });
      } catch (uploadError) {
        console.error("Failed to upload cover image to storage:", uploadError);
        // Still update with temporary URL as fallback
        imagesGenerated++;
        await storyRef.update({
          coverImageUrl: tempCoverImageUrl,
          imagesGenerated,
        });
      }
    }

    // Generate page images one by one
    for (let i = 0; i < storyContent.pages.length; i++) {
      const page = storyContent.pages[i];

      if (page.imagePrompt) {
        // Add delay between requests to avoid rate limits
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay between requests
        }

        const enhancedPrompt = `${page.imagePrompt}. Style: ${config.illustrationStyle}, gentle colors, child-friendly, perfect for a bedtime story.`;

        try {
          const imageResponse = await retryWithBackoff(() =>
            openai.images.generate({
              model: "dall-e-3",
              prompt: enhancedPrompt,
              n: 1,
              size: "1024x1024",
              quality: "standard",
            })
          );

          const tempImageUrl = imageResponse.data?.[0]?.url || "";

          if (tempImageUrl) {
            try {
              // Upload to Firebase Storage
              const imageUrl = await uploadImageToStorage(
                tempImageUrl,
                userId,
                storyId,
                `page-${i + 1}`
              );

              // Update the specific page with the Firebase Storage URL
              storyPages[i].imageUrl = imageUrl;
              imagesGenerated++;

              // Update Firestore with the new image
              await storyRef.update({
                [`storyContent.${i}.imageUrl`]: imageUrl,
                imagesGenerated,
              });
            } catch (uploadError) {
              console.error(
                `Failed to upload page ${i + 1} image to storage:`,
                uploadError
              );
              // Still update with temporary URL as fallback
              storyPages[i].imageUrl = tempImageUrl;
              imagesGenerated++;

              await storyRef.update({
                [`storyContent.${i}.imageUrl`]: tempImageUrl,
                imagesGenerated,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to generate image for page ${i + 1}:`, error);
          // Continue with other pages even if one fails
        }
      }
    }

    // Update final status
    await storyRef.update({
      imageGenerationStatus: "completed",
      storyContent: storyPages, // Update all pages at once to ensure consistency
    });
  } catch (error) {
    console.error("Error in background image generation:", error);
    throw error; // This will be caught by the .catch() in the main function
  }
}