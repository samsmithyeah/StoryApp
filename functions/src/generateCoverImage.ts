import { PubSub } from "@google-cloud/pubsub";
import { getFirestore } from "firebase-admin/firestore";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { IMAGE_SETTINGS, TIMEOUTS } from "./constants";
import { CoverImageModel, FALLBACK_MODELS, IMAGE_MODELS } from "./models";
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
  coverImageModel: CoverImageModel;
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

    // Analytics tracking setup
    const coverGenStartTime = Date.now();
    let totalAttempts = 0;
    let modelFallbackUsed = false;
    let styleFallbacksUsed = 0;

    // Variables needed for error tracking
    let modelsToTry: string[] = [];
    let artStyleDescriptions: string[] = [];
    let lastError: any = null;

    const logAnalytics = async (eventName: string, params: any) => {
      try {
        logger.info(`Analytics: ${eventName}`, { userId, storyId, ...params });
      } catch (error) {
        logger.error("Analytics logging failed", error);
      }
    };

    try {
      // Get art style descriptions in order of preference
      artStyleDescriptions = [artStyle];
      if (artStyleBackup1) artStyleDescriptions.push(artStyleBackup1);
      if (artStyleBackup2) artStyleDescriptions.push(artStyleBackup2);

      // Define primary and fallback models
      const primaryModel = coverImageModel;
      const fallbackModel =
        FALLBACK_MODELS.COVER_IMAGE[coverImageModel] || null;

      modelsToTry = fallbackModel
        ? [primaryModel, fallbackModel]
        : [primaryModel];

      let coverImageGenerated = false;
      let coverImageUrl = "";
      let finalCoverPrompt = "";

      // Track cover generation started
      await logAnalytics("cover_image_generation_started", {
        primary_model: primaryModel,
        fallback_model: fallbackModel || "none",
        art_styles_available: artStyleDescriptions.length,
        timestamp: new Date().toISOString(),
      });

      // Try each model
      for (const currentModel of modelsToTry) {
        const isUsingFallbackModel = currentModel !== primaryModel;

        if (isUsingFallbackModel && !modelFallbackUsed) {
          modelFallbackUsed = true;
          await logAnalytics("cover_image_model_fallback_attempt", {
            primary_model: primaryModel,
            fallback_model: currentModel,
            primary_failure_reason: lastError?.message || "unknown",
          });
        }

        let currentStyleIndex = 0;

        // Try each art style description for this model
        while (
          !coverImageGenerated &&
          currentStyleIndex < artStyleDescriptions.length
        ) {
          totalAttempts++;
          const currentStyleDescription =
            artStyleDescriptions[currentStyleIndex];
          const isUsingStyleFallback = currentStyleIndex > 0;

          if (isUsingStyleFallback) {
            styleFallbacksUsed++;
            await logAnalytics("cover_image_style_fallback_attempt", {
              model: currentModel,
              primary_style_index: 0,
              fallback_style_index: currentStyleIndex,
              previous_failure_reason: lastError?.message || "unknown",
            });
          }

          finalCoverPrompt = `Aspect ratio: ${IMAGE_SETTINGS.COVER_ASPECT_RATIO}. ${coverImagePrompt}. Style: ${currentStyleDescription}. Create a well-composed children's book cover illustration in ${IMAGE_SETTINGS.COVER_ASPECT_RATIO} aspect ratio format. Add the book title "${title}" to the image. Do not add the name of the author or any other text to the image.`;

          try {
            logger.debug("Attempting cover image generation", {
              storyId,
              model: currentModel,
              isPrimary: currentModel === primaryModel,
              styleIndex: currentStyleIndex,
              promptLength: finalCoverPrompt.length,
            });

            if (currentModel === IMAGE_MODELS.GEMINI_2_5_FLASH_IMAGE_PREVIEW) {
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
            } else if (currentModel === IMAGE_MODELS.GPT_IMAGE_1) {
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
              await logAnalytics("cover_image_generation_success", {
                model_used: currentModel,
                required_model_fallback: isUsingFallbackModel,
                style_index_used: currentStyleIndex,
                required_style_fallback: isUsingStyleFallback,
                total_attempts: totalAttempts,
                generation_time_ms: Date.now() - coverGenStartTime,
                final_prompt_length: finalCoverPrompt.length,
              });

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

            await logAnalytics("cover_image_generation_attempt_failed", {
              model: currentModel,
              style_index: currentStyleIndex,
              attempt_number: totalAttempts,
              error_type:
                error.status === 400 && error.message?.includes("safety system")
                  ? "safety_filter"
                  : error.name || "unknown",
              error_message: error.message,
              will_try_next_style:
                currentStyleIndex < artStyleDescriptions.length - 1,
              will_try_fallback_model:
                currentModel === primaryModel && fallbackModel,
            });

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
      await logAnalytics("cover_image_generation_final_failure", {
        models_attempted: modelsToTry,
        styles_attempted: artStyleDescriptions.length,
        total_attempts: totalAttempts,
        used_model_fallback: modelFallbackUsed,
        style_fallbacks_used: styleFallbacksUsed,
        generation_time_ms: Date.now() - coverGenStartTime,
        final_error: lastError?.message || error.message || "unknown",
      });

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
