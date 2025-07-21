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
  sourceImageUrl?: string; // Only for the first page
  consistencyInput?: {
    // For pages 2-N
    imageUrl: string;
    text: string;
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
      sourceImageUrl,
      imagePrompt,
      imageProvider,
      consistencyInput,
    } = payload;
    const isFirstPage = pageIndex === 0;

    console.log(
      `[Worker] Received job for story ${storyId}, page ${pageIndex + 1}`
    );
    const storyRef = admin.firestore().collection("stories").doc(storyId);

    try {
      let finalImageUrl: string;

      if (isFirstPage) {
        if (!sourceImageUrl)
          throw new Error("First page worker received no sourceImageUrl.");
        finalImageUrl = sourceImageUrl;
        console.log(`[Worker] Page 1: Using pre-generated image.`);
      } else {
        if (!consistencyInput)
          throw new Error(
            `Page ${pageIndex + 1} worker received no consistencyInput.`
          );

        const subsequentPrompt = `The caption for the input image is "${consistencyInput.text}". In the same style, and with totally consistent characters to the input, generate another image for this caption: "${imagePrompt}"`;

        if (imageProvider === "flux") {
          const fluxClient = getFluxClient();
          finalImageUrl = await retryWithBackoff(() =>
            fluxClient.generateImageWithPolling({
              prompt: subsequentPrompt,
              input_image: consistencyInput.imageUrl,
              aspect_ratio: "1:1",
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
      }

      const storagePath = await uploadImageToStorage(
        finalImageUrl,
        userId,
        storyId,
        `page-${pageIndex + 1}`
      );
      console.log(`[Worker] Uploaded to ${storagePath}.`);

      // --- ATOMIC UPDATE USING A TRANSACTION ---
      await admin.firestore().runTransaction(async (transaction) => {
        // 1. Read the document within the transaction
        const doc = await transaction.get(storyRef);
        if (!doc.exists) {
          throw new Error("Document does not exist!");
        }

        // 2. Modify the data in memory
        const storyData = doc.data();
        if (!storyData || !Array.isArray(storyData.storyContent)) {
          throw new Error("Story content is not a valid array.");
        }

        // Create a new array from the existing one to modify it
        const newStoryContent = [...storyData.storyContent];

        // Ensure the object at the target index exists before updating
        if (newStoryContent[pageIndex]) {
          // This is the key change: update the object, preserving other fields like 'text'.
          newStoryContent[pageIndex] = {
            ...newStoryContent[pageIndex],
            imageUrl: storagePath,
          };
        } else {
          throw new Error(`Page index ${pageIndex} is out of bounds.`);
        }

        // Prepare the final update payload
        const updateData: { [key: string]: any } = {
          storyContent: newStoryContent, // Write the entire modified array back
          imagesGenerated: admin.firestore.FieldValue.increment(1),
        };

        if (isFirstPage) {
          updateData.coverImageUrl = storagePath;
        }

        // 3. Write the new data back to Firestore
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
