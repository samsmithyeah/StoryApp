import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { toFile } from "openai";
import { Readable } from "stream";
import { getFluxClient } from "./utils/flux";
import { getGeminiClient } from "./utils/gemini";
import { getOpenAIClient } from "./utils/openai";
import { retryWithBackoff } from "./utils/retry";
import { uploadImageToStorage } from "./utils/storage";

interface ImageGenerationPayload {
  storyId: string;
  userId: string;
  pageIndex: number;
  imagePrompt: string;
  imageProvider: "flux" | "gemini" | "gpt-image-1";
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
    secrets: ["FLUX_API_KEY", "GEMINI_API_KEY", "OPENAI_API_KEY"],
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
    const db = getFirestore();
    const storyRef = db.collection("stories").doc(storyId);

    try {
      const subsequentPrompt = `Create a children's book illustration based on the cover image's art style.

SCENE DESCRIPTION:
${imagePrompt}

CHARACTER REFERENCE (from cover image):
${characters.descriptions}

REQUIREMENTS:
• Match the exact art style and character designs from the cover image
• Only include characters explicitly mentioned in the scene description above
• Maintain consistent character appearances throughout
• Square format (1:1 aspect ratio)
• Child-friendly illustration style`;

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
            aspect_ratio: "1:1",
          })
        );
      } else if (imageProvider === "gpt-image-1") {
        const openai = getOpenAIClient();

        // Extract base64 data from the cover image
        const base64Data = consistencyInput.imageUrl.split(",")[1];
        if (!base64Data) {
          throw new Error(
            "Could not extract base64 data from cover image for GPT-4"
          );
        }

        // Create a readable stream and convert to File using toFile utility
        const imageBuffer = Buffer.from(base64Data, "base64");
        const imageStream = Readable.from(imageBuffer);
        const imageFile = await toFile(imageStream, "cover.png", {
          type: "image/png",
        });

        const response = await retryWithBackoff(() =>
          openai.images.edit({
            model: "gpt-image-1",
            image: imageFile,
            prompt: subsequentPrompt,
            quality: "medium",
            size: "1024x1024",
            n: 1,
          })
        );

        const imageData = response.data?.[0];
        if (!imageData?.b64_json) {
          throw new Error("No base64 image data returned from OpenAI");
        }

        finalImageUrl = `data:image/png;base64,${imageData.b64_json}`;
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
      await db.runTransaction(async (transaction) => {
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

        // Store the prompt used for this specific image
        const imageGenerationPrompt = subsequentPrompt;

        const updateData: { [key: string]: any } = {
          storyContent: newStoryContent,
          imagesGenerated: FieldValue.increment(1),
          // Store page-specific generation data
          [`generationMetadata.pageImageGenerationData.page${pageIndex + 1}`]: {
            prompt: imageGenerationPrompt,
            originalImagePrompt: imagePrompt,
            model: imageProvider,
            generatedAt: FieldValue.serverTimestamp(),
          },
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
