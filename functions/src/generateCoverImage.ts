import { PubSub } from "@google-cloud/pubsub";
import { getFirestore } from "firebase-admin/firestore";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { IMAGE_SETTINGS, TIMEOUTS } from "./constants";
import { getGeminiClient } from "./utils/gemini";
import { logger } from "./utils/logger";
import { getOpenAIClient } from "./utils/openai";
import { retryWithBackoff } from "./utils/retry";
import { uploadImageToStorage } from "./utils/storage";

const pubsub = new PubSub();

interface CoverImageGenerationPayload {
  storyId: string;
  userId: string;
  title: string;
  coverImagePrompt: string;
  coverImageModel: "gemini-2.5-flash-image-preview" | "gpt-image-1";
  artStyle: string;
  artStyleBackup1?: string;
  artStyleBackup2?: string;
  // Data needed for page image generation after cover is complete
  pageImageModel?: string;
  pagePrompts?: string[];
  characterNames?: string;
  characterDescriptions?: string;
  enablePageIllustrations?: boolean;
}

export const generateCoverImage = onMessagePublished(
  {
    topic: "generate-cover-image",
    secrets: ["GEMINI_API_KEY", "OPENAI_API_KEY"],
    timeoutSeconds: TIMEOUTS.COVER_GENERATION,
    memory: "1GiB",
  },
  async (event) => {
    const payload = event.data.message.json as CoverImageGenerationPayload;
    const {
      storyId,
      userId,
      title,
      coverImagePrompt,
      coverImageModel,
      artStyle,
      artStyleBackup1,
      artStyleBackup2,
    } = payload;

    const db = getFirestore();
    const storyRef = db.collection("stories").doc(storyId);

    try {
      // Get art style descriptions in order of preference
      const artStyleDescriptions = [artStyle];
      if (artStyleBackup1) artStyleDescriptions.push(artStyleBackup1);
      if (artStyleBackup2) artStyleDescriptions.push(artStyleBackup2);

      // Define primary and fallback models
      const primaryModel = coverImageModel;
      const fallbackModel =
        coverImageModel === "gpt-image-1"
          ? "gemini-2.5-flash-image-preview"
          : coverImageModel === "gemini-2.5-flash-image-preview"
            ? "gpt-image-1"
            : null;

      const modelsToTry = fallbackModel
        ? [primaryModel, fallbackModel]
        : [primaryModel];

      let coverImageGenerated = false;
      let coverImageUrl = "";
      let finalCoverPrompt = "";
      let lastError: any = null;

      // Try each model
      for (const currentModel of modelsToTry) {
        let currentStyleIndex = 0;

        // Try each art style description for this model
        while (
          !coverImageGenerated &&
          currentStyleIndex < artStyleDescriptions.length
        ) {
          const currentStyleDescription =
            artStyleDescriptions[currentStyleIndex];
          finalCoverPrompt = `Aspect ratio: ${IMAGE_SETTINGS.COVER_ASPECT_RATIO}. ${coverImagePrompt}. Style: ${currentStyleDescription}. Create a well-composed children's book cover illustration in ${IMAGE_SETTINGS.COVER_ASPECT_RATIO} aspect ratio format. Add the book title "${title}" to the image. Do not add the name of the author or any other text to the image.`;

          try {
            logger.debug("Attempting cover image generation", {
              storyId,
              model: currentModel,
              isPrimary: currentModel === primaryModel,
              styleIndex: currentStyleIndex,
              promptLength: finalCoverPrompt.length,
            });

            if (currentModel === "gemini-2.5-flash-image-preview") {
              const geminiClient = getGeminiClient();
              const startTime = Date.now();

              coverImageUrl = await retryWithBackoff(() =>
                geminiClient.generateImage(finalCoverPrompt)
              );

              const duration = Date.now() - startTime;
              logger.debug("Gemini cover image generation completed", {
                storyId,
                duration,
                imageUrlLength: coverImageUrl.length,
              });

              coverImageGenerated = true;
            } else if (currentModel === "gpt-image-1") {
              const openai = getOpenAIClient();
              const startTime = Date.now();

              const dalleResponse = await retryWithBackoff(() =>
                openai.images.generate({
                  model: currentModel,
                  prompt: finalCoverPrompt,
                  size: IMAGE_SETTINGS.COVER_IMAGE_SIZE,
                  quality: "medium",
                  n: 1,
                  // Use low moderation for gpt-image-1 to reduce false positives
                  moderation: "low",
                })
              );

              const duration = Date.now() - startTime;
              logger.debug("OpenAI cover image generation completed", {
                storyId,
                model: currentModel,
                duration,
              });

              // Both models now return base64 for consistency
              const imageData = dalleResponse.data?.[0];
              if (!imageData?.b64_json) {
                throw new Error("No base64 image data returned from OpenAI");
              }

              // Convert base64 to data URL for both models
              coverImageUrl = `data:image/png;base64,${imageData.b64_json}`;
              coverImageGenerated = true;
            }

            if (coverImageGenerated) {
              logger.info("Cover image generated successfully", {
                storyId,
                model: currentModel,
                wasFailover: currentModel !== primaryModel,
                styleIndex: currentStyleIndex,
              });
              break; // Break out of style loop
            }
          } catch (error: any) {
            lastError = error;
            logger.warn("Cover image generation attempt failed", {
              storyId,
              model: currentModel,
              styleIndex: currentStyleIndex,
              error: error.message,
            });

            // Check if it's a safety system rejection from OpenAI - try next style
            if (
              error.status === 400 &&
              error.message?.includes("safety system") &&
              currentStyleIndex < artStyleDescriptions.length - 1
            ) {
              logger.debug("Safety system rejection, trying next style", {
                storyId,
                model: currentModel,
                nextStyleIndex: currentStyleIndex + 1,
              });
              currentStyleIndex++;
              continue;
            } else {
              // Other errors - break out of style loop and try next model
              break;
            }
          }
        }

        if (coverImageGenerated) {
          break; // Break out of model loop
        }

        // Log failover attempt
        if (currentModel === primaryModel && fallbackModel) {
          logger.info("Primary model failed, attempting fallback", {
            storyId,
            primaryModel,
            fallbackModel,
            lastError: lastError?.message,
          });
        }
      }

      if (!coverImageGenerated) {
        throw new Error(
          "Failed to generate cover image with all available art style descriptions"
        );
      }

      const coverImageStoragePath = await uploadImageToStorage(
        coverImageUrl,
        userId,
        storyId,
        "cover"
      );

      // Update the story document with the cover image URL
      await storyRef.update({
        coverImageUrl: coverImageStoragePath,
        generationPhase: "cover_complete",
        "generationMetadata.coverImagePrompt": finalCoverPrompt,
      });

      // Trigger page image generation if needed
      if (
        payload.enablePageIllustrations &&
        payload.pagePrompts &&
        payload.pagePrompts.length > 0
      ) {
        const publishPromises = payload.pagePrompts.map(
          (imagePrompt, index) => {
            const pagePayload = {
              storyId,
              userId,
              pageIndex: index,
              imagePrompt,
              imageProvider: payload.pageImageModel || "gpt-image-1",
              consistencyInput: {
                imageUrl: coverImageUrl, // Use the generated cover for consistency
                text: coverImagePrompt,
              },
              characters: {
                names: payload.characterNames || "",
                descriptions: payload.characterDescriptions || "",
              },
              artStyle,
              artStyleBackup1,
              artStyleBackup2,
            };
            return pubsub
              .topic("generate-story-image")
              .publishMessage({ json: pagePayload });
          }
        );

        await Promise.all(publishPromises);
      } else {
        // No page illustrations needed, story is complete
        await storyRef.update({
          generationPhase: "all_complete",
        });
      }
    } catch (error: any) {
      logger.error("Error generating cover image", error, { storyId, userId });

      // Update story document to indicate failure
      await storyRef.update({
        "generationMetadata.coverImageError": error.message || "Unknown error",
        coverImageGenerationFailed: true,
      });

      throw error;
    }
  }
);
