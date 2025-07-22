import * as admin from "firebase-admin";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { getFluxClient } from "./utils/flux";
import { getGeminiClient } from "./utils/gemini";
import { retryWithBackoff } from "./utils/retry";
import { uploadImageToStorage } from "./utils/storage";

interface ImageGenerationPayload {
  storyId: string;
  userId: string;
  pageIndex: number;
  imagePrompt: string;
  imageProvider: "flux" | "gemini";
  consistencyInput: {
    imageUrl: string;
    text: string;
  };
  characters: {
    names: string;
    descriptions: string;
  };
}

export const generateSingleImage = onMessagePublished(
  {
    topic: "generate-story-image",
    secrets: ["FLUX_API_KEY", "GEMINI_API_KEY"],
    timeoutSeconds: 300,
    memory: "1GiB",
  },
  async (event) => {
    const payload = event.data.message.json as ImageGenerationPayload;
    const {
      storyId,
      userId,
      pageIndex,
      imagePrompt,
      imageProvider,
      consistencyInput,
      characters,
    } = payload;

    console.log(
      `[Worker] Received job for story ${storyId}, page ${pageIndex + 1}`
    );
    const storyRef = admin.firestore().collection("stories").doc(storyId);

    try {
      const subsequentPrompt = `The input image is the book's cover, which establishes the appearance of the main characters and overall art style.

IMPORTANT CHARACTER CONSISTENCY REQUIREMENTS:
- The story features these specific characters: ${characters.names}
- Character appearances: ${characters.descriptions}
- Always maintain the EXACT same visual appearance for each character as shown in the cover image
- Only include characters that are specifically mentioned or implied in the scene description
- If no characters are mentioned in the scene, create an appropriate scene without characters

Create a new illustration for this page scene: ${imagePrompt}

Maintain the same art style, character designs, and visual consistency as the cover image. Create a well-composed children's book page illustration in 4:3 aspect ratio format.`;

      console.log(
        `[Worker] Generating image for page ${pageIndex + 1} with new scene prompt.`
      );

      let finalImageUrl: string;
      if (imageProvider === "flux") {
        const fluxClient = getFluxClient();
        finalImageUrl = await retryWithBackoff(() =>
          fluxClient.generateImageWithPolling({
            prompt: subsequentPrompt,
            input_image: consistencyInput.imageUrl,
            aspect_ratio: "4:3",
          })
        );
      } else {
        // Gemini
        const geminiClient = getGeminiClient();
        const base64Data = consistencyInput.imageUrl.split(",")[1];
        if (!base64Data)
          throw new Error(
            "Could not extract base64 data from consistency input."
          );
        finalImageUrl = await retryWithBackoff(() =>
          geminiClient.editImage(subsequentPrompt, base64Data)
        );
      }
      console.log(`[Worker] Page ${pageIndex + 1}: Generated new image.`);

      const storagePath = await uploadImageToStorage(
        finalImageUrl,
        userId,
        storyId,
        `page-${pageIndex + 1}`
      );
      console.log(`[Worker] Uploaded to ${storagePath}.`);

      // Atomic update and completion check
      await admin.firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(storyRef);
        if (!doc.exists) throw new Error("Document does not exist!");

        const storyData = doc.data();
        if (!storyData || !Array.isArray(storyData.storyContent))
          throw new Error("Story content is not a valid array.");

        const newStoryContent = [...storyData.storyContent];
        if (newStoryContent[pageIndex]) {
          newStoryContent[pageIndex] = {
            ...newStoryContent[pageIndex],
            imageUrl: storagePath,
          };
        } else {
          throw new Error(`Page index ${pageIndex} is out of bounds.`);
        }

        const updateData: { [key: string]: any } = {
          storyContent: newStoryContent,
          imagesGenerated: admin.firestore.FieldValue.increment(1),
        };

        const currentImagesGenerated = storyData.imagesGenerated || 0;
        const totalImages = storyData.totalImages || 0;

        if (totalImages > 0 && currentImagesGenerated + 1 >= totalImages) {
          console.log(
            `[Worker] This is the final image (${currentImagesGenerated + 1}/${totalImages}). Setting status to 'completed'.`
          );
          updateData.imageGenerationStatus = "completed";
        }

        transaction.update(storyRef, updateData);
      });

      console.log(
        `[Worker] Successfully and safely processed page ${pageIndex + 1} for story ${storyId}.`
      );
    } catch (error) {
      console.error(
        `[Worker] Failed to process page ${pageIndex + 1} for story ${storyId}:`,
        error
      );
      await storyRef.update({
        imageGenerationStatus: "failed",
        imageGenerationError: `Failed on page ${pageIndex + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }
);
