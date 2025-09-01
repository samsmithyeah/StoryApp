import { PubSub } from "@google-cloud/pubsub";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { TIMEOUTS } from "./constants";
import { geminiApiKey } from "./utils/gemini";
import { logger } from "./utils/logger";
import { openaiApiKey } from "./utils/openai";

const pubsub = new PubSub();

interface RetryImageGenerationRequest {
  storyId: string;
  pageIndex: number;
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
    secrets: [openaiApiKey, geminiApiKey],
    timeoutSeconds: TIMEOUTS.STORY_GENERATION,
    memory: "512MiB",
  },
  async (request: CallableRequest<RetryImageGenerationRequest>) => {
    // 1. Authenticate the user
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    const { storyId, pageIndex } = request.data;

    if (!storyId) {
      throw new HttpsError("invalid-argument", "Story ID is required");
    }

    if (typeof pageIndex !== "number" || pageIndex < 0) {
      throw new HttpsError("invalid-argument", "Valid page index is required");
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

      // 3. Validate the page index and check if retry is needed
      if (!storyData.storyContent || !Array.isArray(storyData.storyContent)) {
        throw new HttpsError("not-found", "Story content not found");
      }

      if (pageIndex >= storyData.storyContent.length) {
        throw new HttpsError(
          "invalid-argument",
          `Page index ${pageIndex} is out of range. Story has ${storyData.storyContent.length} pages.`
        );
      }

      const targetPage = storyData.storyContent[pageIndex];
      if (targetPage.imageUrl) {
        throw new HttpsError(
          "failed-precondition",
          `Page ${pageIndex} already has an image. No retry needed.`
        );
      }

      // 4. Update story status to generating for this retry
      await storyRef.update({
        imageGenerationStatus: "generating",
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 5. Get the story data needed for image generation
      const artStyleDescriptions = [
        storyData.illustrationAiDescription,
        storyData.illustrationAiDescriptionBackup1,
        storyData.illustrationAiDescriptionBackup2,
      ].filter(Boolean);

      logger.info(
        `Updated story status to generating for ${storyId} page ${pageIndex}`
      );

      // Convert cover image storage URL to base64 for consistency input
      let coverImageBase64 = "";
      try {
        coverImageBase64 = await convertStorageUrlToBase64(
          storyData.coverImageUrl || ""
        );
        if (!coverImageBase64 && storyData.coverImageUrl) {
          logger.warn(
            `Failed to convert cover image to base64 for story ${storyId}`,
            {
              coverImageUrl: storyData.coverImageUrl,
            }
          );
        }
      } catch (error) {
        logger.error(
          `Critical error converting cover image to base64 for story ${storyId}`,
          {
            coverImageUrl: storyData.coverImageUrl,
            error: error instanceof Error ? error.message : String(error),
          }
        );
        // Continue with empty consistency input rather than failing entire retry
        coverImageBase64 = "";
      }

      // Generate image for the specific page
      const pageKey = `page${pageIndex + 1}`;
      const targetPageData =
        storyData.generationMetadata?.pageImageGenerationData?.[pageKey];

      logger.info(`Looking for page data with key: ${pageKey}`, {
        hasGenerationMetadata: !!storyData.generationMetadata,
        hasPageImageGenerationData:
          !!storyData.generationMetadata?.pageImageGenerationData,
        pageDataFound: !!targetPageData,
        pageDataModel: targetPageData?.model,
        pageDataPrompt: targetPageData?.prompt ? "present" : "missing",
      });

      const imageModel = targetPageData?.model || "gpt-image-1";
      const imagePrompt =
        targetPageData?.prompt ||
        targetPage.imagePrompt ||
        `Illustration for: ${targetPage.text}`;

      // Use the converted base64 cover image for consistency
      const consistencyInput = {
        imageUrl: coverImageBase64,
        text: storyData.consistencyPrompt || "",
      };

      const imageGenerationPayload = {
        storyId,
        userId,
        pageIndex,
        imagePrompt,
        imageProvider: imageModel,
        consistencyInput,
        characters: {
          names: storyData.characterNames || "",
          descriptions: storyData.characterDescriptions || "",
        },
        artStyle: artStyleDescriptions[0] || "",
        artStyleBackup1: artStyleDescriptions[1] || "",
        artStyleBackup2: artStyleDescriptions[2] || "",
      };

      const messageBuffer = Buffer.from(JSON.stringify(imageGenerationPayload));
      const publishPromise = pubsub
        .topic("generate-story-image")
        .publishMessage({
          data: messageBuffer,
        });

      // Execute the single page publish
      try {
        await publishPromise;

        logger.info(
          `Image generation retry initiated for story ${storyId} page ${pageIndex}`,
          {
            userId,
            storyId,
            pageIndex,
            pageKey,
            imageModel,
            imagePrompt: imagePrompt.substring(0, 100) + "...", // First 100 chars
            usingStoredData: !!targetPageData,
            hasCoverImageBase64: coverImageBase64.length > 0,
            coverImageStorageUrl: storyData.coverImageUrl,
          }
        );

        return {
          success: true,
          message: `Image generation retry initiated for page ${pageIndex}`,
          storyId,
          pageIndex,
        };
      } catch (error) {
        // Revert story status to failed if publish fails
        await storyRef.update({
          imageGenerationStatus: "failed",
          updatedAt: FieldValue.serverTimestamp(),
          "generationMetadata.retryError": `Failed to publish retry message for page ${pageIndex}`,
        });

        logger.error(
          `Failed to publish retry message for page ${pageIndex} in story ${storyId}`,
          {
            error: error instanceof Error ? error.message : String(error),
            pageIndex,
          }
        );

        throw new HttpsError(
          "internal",
          `Failed to publish retry message for page ${pageIndex}. Story status reverted to failed.`
        );
      }
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
