import { PubSub } from "@google-cloud/pubsub";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { fluxApiKey } from "./utils/flux";
import { geminiApiKey } from "./utils/gemini";
import { logger } from "./utils/logger";
import { openaiApiKey } from "./utils/openai";
import { TIMEOUTS } from "./constants";

const pubsub = new PubSub();

interface RetryImageGenerationRequest {
  storyId: string;
}

// Helper function to convert Firebase Storage URL to base64 data URL
async function convertStorageUrlToBase64(storageUrl: string): Promise<string> {
  if (!storageUrl) {
    return "";
  }

  try {
    const storage = getStorage();
    const bucket = storage.bucket();

    // Extract the file path from the storage URL
    // Format: gs://bucket-name/path/to/file or just path/to/file
    const filePath = storageUrl.replace(/^gs:\/\/[^\/]+\//, "");

    const file = bucket.file(filePath);
    const [buffer] = await file.download();

    // Convert to base64 data URL
    const base64 = buffer.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    logger.error("Error converting storage URL to base64", {
      storageUrl,
      error,
    });
    return ""; // Return empty string if conversion fails
  }
}

export const retryImageGeneration = onCall(
  {
    secrets: [openaiApiKey, fluxApiKey, geminiApiKey],
    timeoutSeconds: TIMEOUTS.STORY_GENERATION,
    memory: "512MiB",
  },
  async (request: CallableRequest<RetryImageGenerationRequest>) => {
    // 1. Authenticate the user
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    const { storyId } = request.data;

    if (!storyId) {
      throw new HttpsError("invalid-argument", "Story ID is required");
    }

    try {
      const db = getFirestore();

      // 2. Verify the story exists and belongs to the user
      const storyRef = db.collection("stories").doc(storyId);
      const storyDoc = await storyRef.get();

      if (!storyDoc.exists) {
        throw new HttpsError("not-found", "Story not found");
      }

      const storyData = storyDoc.data();
      if (!storyData || storyData.userId !== userId) {
        throw new HttpsError(
          "permission-denied",
          "Access denied to this story"
        );
      }

      // 3. Check if retry is needed (only retry if failed)
      if (storyData.imageGenerationStatus !== "failed") {
        throw new HttpsError(
          "failed-precondition",
          `Cannot retry image generation. Current status: ${storyData.imageGenerationStatus}`
        );
      }

      // 4. Reset the story's image generation status and clear failed images
      const updateData: any = {
        imageGenerationStatus: "pending",
        imagesGenerated: 0,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Clear imageUrl from pages that don't have images (indicating they failed)
      if (storyData.storyContent && Array.isArray(storyData.storyContent)) {
        const updatedContent = storyData.storyContent.map((page: any) => {
          // Keep imageUrl if it exists, otherwise ensure it's cleared
          return {
            ...page,
            imageUrl: page.imageUrl || null,
          };
        });
        updateData.storyContent = updatedContent;
      }

      await storyRef.update(updateData);

      // 5. Get the story data needed for image generation
      const updatedStoryDoc = await storyRef.get();
      const updatedStoryData = updatedStoryDoc.data();

      if (!updatedStoryData || !updatedStoryData.storyContent) {
        throw new HttpsError(
          "internal",
          "Story content not found after update"
        );
      }

      // 6. Re-trigger image generation for each page
      const pages = updatedStoryData.storyContent;
      const artStyleDescriptions = [
        updatedStoryData.illustrationAiDescription,
        updatedStoryData.illustrationAiDescriptionBackup1,
        updatedStoryData.illustrationAiDescriptionBackup2,
      ].filter(Boolean);

      // Update status to generating
      await storyRef.update({
        imageGenerationStatus: "generating",
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`Updated story status to generating for ${storyId}`);

      // Convert cover image storage URL to base64 for consistency input
      const coverImageBase64 = await convertStorageUrlToBase64(
        updatedStoryData.coverImageUrl || ""
      );

      // Publish image generation messages for each page
      const publishPromises = pages.map(async (page: any, index: number) => {
        // Get the model and prompt from pageImageGenerationData
        const pageData =
          updatedStoryData.pageImageGenerationData?.page?.[index];
        const imageModel = pageData?.model || "gpt-image-1";
        const imagePrompt =
          pageData?.prompt ||
          page.imagePrompt ||
          `Illustration for: ${page.text}`;

        // Use the converted base64 cover image for consistency
        const consistencyInput = {
          imageUrl: coverImageBase64,
          text: updatedStoryData.consistencyPrompt || "",
        };

        const imageGenerationPayload = {
          storyId,
          userId,
          pageIndex: index,
          imagePrompt,
          imageProvider: imageModel,
          consistencyInput,
          characters: {
            names: updatedStoryData.characterNames || "",
            descriptions: updatedStoryData.characterDescriptions || "",
          },
          artStyle: artStyleDescriptions[0] || "",
          artStyleBackup1: artStyleDescriptions[1] || "",
          artStyleBackup2: artStyleDescriptions[2] || "",
        };

        const messageBuffer = Buffer.from(
          JSON.stringify(imageGenerationPayload)
        );
        return pubsub.topic("generate-story-image").publishMessage({
          data: messageBuffer,
        });
      });

      await Promise.all(publishPromises);

      // Log the models being used for each page
      const pageModels = pages.map((_page: any, index: number) => {
        const pageData =
          updatedStoryData.pageImageGenerationData?.page?.[index];
        return pageData?.model || "gpt-image-1";
      });

      logger.info(`Image generation retry initiated for story ${storyId}`, {
        userId,
        storyId,
        pagesCount: pages.length,
        pageModels,
        publishedMessages: publishPromises.length,
        hasCoverImageBase64: coverImageBase64.length > 0,
        coverImageStorageUrl: updatedStoryData.coverImageUrl,
      });

      return {
        success: true,
        message: "Image generation retry initiated successfully",
        storyId,
      };
    } catch (error) {
      logger.error("Error retrying image generation", {
        userId,
        storyId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Re-throw HttpsErrors as-is, wrap others
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to retry image generation");
    }
  }
);
