import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { toFile } from "openai";
import { Readable } from "stream";
import { getGeminiClient } from "./utils/gemini";
import { logger } from "./utils/logger";
import { getOpenAIClient } from "./utils/openai";
import { retryWithBackoff } from "./utils/retry";
import { uploadImageToStorage } from "./utils/storage";
import { sendStoryCompleteNotification } from "./sendStoryCompleteNotification";
import { TIMEOUTS } from "./constants";
import { FALLBACK_MODELS, IMAGE_MODELS, PageImageModel } from "./models";

interface ImageGenerationPayload {
  storyId: string;
  userId: string;
  pageIndex: number;
  imagePrompt: string;
  imageProvider: PageImageModel;
  consistencyInput: {
    imageUrl: string;
    text: string;
  };
  characters: {
    names: string;
    descriptions: string;
  };
  artStyle?: string;
  artStyleBackup1?: string;
  artStyleBackup2?: string;
}

export const generateSingleImage = onMessagePublished(
  {
    topic: "generate-story-image",
    secrets: ["GEMINI_API_KEY", "OPENAI_API_KEY"],
    timeoutSeconds: TIMEOUTS.SINGLE_IMAGE_GENERATION,
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
      artStyle,
      artStyleBackup1,
      artStyleBackup2,
    } = payload;

    const db = getFirestore();
    const storyRef = db.collection("stories").doc(storyId);

    // Analytics tracking setup
    let pageAttempts = 0;
    let pageModelFallbackUsed = false;
    let pageStyleFallbacksUsed = 0;
    let modelsToTry: string[] = [];
    let artStyleOptions: (string | undefined)[] = [];

    const logMetric = async (eventName: string, params: any) => {
      try {
        logger.info(`Metric: ${eventName}`, {
          userId,
          storyId,
          pageIndex,
          ...params,
        });
      } catch (error) {
        logger.error("Metric logging failed", error);
      }
    };

    try {
      // Helper function to create prompt with specific art style
      const createPrompt = (styleDescription?: string) => {
        return `Create a children's book illustration based on the cover image's art style.

SCENE DESCRIPTION:
${imagePrompt}

CHARACTER REFERENCE (from cover image):
${characters.descriptions}

ART STYLE:
${styleDescription ? `Create the illustration in the "${styleDescription}" art style to match the story's chosen aesthetic.` : "Follow the art style from the cover image."}

REQUIREMENTS:
• Match the exact art style and character designs from the cover image
• ${styleDescription ? `Ensure the illustration matches the "${styleDescription}" art style` : "Maintain consistent art style from cover"}
• Only include characters explicitly mentioned in the scene description above
• Maintain consistent character appearances throughout
• Square format (1:1 aspect ratio)
• Child-friendly illustration style`;
      };

      // Define primary and fallback models
      const primaryModel = imageProvider;
      const fallbackModel = FALLBACK_MODELS.PAGE_IMAGE[imageProvider] || null;

      modelsToTry = fallbackModel
        ? [primaryModel, fallbackModel]
        : [primaryModel];

      let finalImageUrl: string = "";
      let actualModelUsed = imageProvider;
      let imageGenerated = false;
      let lastError: any = null;

      // Track page image generation started
      await logMetric("page_image_generation_started", {
        primary_model: primaryModel,
        fallback_model: fallbackModel || "none",
        art_styles_available: [
          artStyle,
          artStyleBackup1,
          artStyleBackup2,
        ].filter(Boolean).length,
      });
      let finalPromptUsed = "";

      // Extract base64 data from the cover image (needed for both models)
      const base64Data = consistencyInput.imageUrl.split(",")[1];
      if (!base64Data) {
        throw new Error("Could not extract base64 data from cover image");
      }

      // Try each model
      for (const currentModel of modelsToTry) {
        const isUsingFallbackModel = currentModel !== primaryModel;

        if (isUsingFallbackModel && !pageModelFallbackUsed) {
          pageModelFallbackUsed = true;
          await logMetric("page_image_model_fallback_attempt", {
            primary_model: primaryModel,
            fallback_model: currentModel,
            primary_failure_reason: lastError?.message || "unknown",
          });
        }

        // Prepare art style descriptions in fallback order
        artStyleOptions = [artStyle, artStyleBackup1, artStyleBackup2];
        let currentStyleIndex = 0;

        // Try each art style description for this model
        while (!imageGenerated && currentStyleIndex < artStyleOptions.length) {
          pageAttempts++;
          const currentStyle = artStyleOptions[currentStyleIndex];
          const currentPrompt = createPrompt(currentStyle);
          const isUsingStyleFallback = currentStyleIndex > 0;

          if (isUsingStyleFallback) {
            pageStyleFallbacksUsed++;
            await logMetric("page_image_style_fallback_attempt", {
              model: currentModel,
              style_fallback_index: currentStyleIndex,
              previous_failure_reason: lastError?.message || "safety_filter",
            });
          }

          try {
            logger.debug("Attempting page image generation", {
              storyId,
              pageIndex: pageIndex + 1,
              model: currentModel,
              isPrimary: currentModel === primaryModel,
              styleIndex: currentStyleIndex,
            });

            if (currentModel === IMAGE_MODELS.GPT_IMAGE_1) {
              const openai = getOpenAIClient();

              // The stream and file must be created inside the retry callback
              // because the OpenAI SDK consumes the stream on each API call
              const imageBuffer = Buffer.from(base64Data, "base64");
              const response = await retryWithBackoff(async () => {
                const imageStream = Readable.from(imageBuffer);
                const imageFile = await toFile(imageStream, "cover.png", {
                  type: "image/png",
                });
                return openai.images.edit({
                  model: IMAGE_MODELS.GPT_IMAGE_1,
                  image: imageFile,
                  prompt: currentPrompt,
                  quality: "medium",
                  size: "1024x1024",
                  n: 1,
                });
              });

              const imageData = response.data?.[0];
              if (!imageData?.b64_json) {
                throw new Error("No base64 image data returned from OpenAI");
              }

              finalImageUrl = `data:image/png;base64,${imageData.b64_json}`;
              imageGenerated = true;
              actualModelUsed = currentModel;
              finalPromptUsed = currentPrompt;
            } else if (currentModel === IMAGE_MODELS.GEMINI) {
              const geminiClient = getGeminiClient();

              finalImageUrl = await retryWithBackoff(() =>
                geminiClient.editImage(currentPrompt, base64Data)
              );

              imageGenerated = true;
              actualModelUsed = currentModel;
              finalPromptUsed = currentPrompt;
            }

            if (imageGenerated) {
              logger.info("Page image generated successfully", {
                storyId,
                pageIndex: pageIndex + 1,
                model: currentModel,
                wasFailover: currentModel !== primaryModel,
                styleIndex: currentStyleIndex,
              });
              break; // Break out of style loop
            }
          } catch (error: any) {
            lastError = error;
            logger.warn("Page image generation attempt failed", {
              storyId,
              pageIndex: pageIndex + 1,
              model: currentModel,
              styleIndex: currentStyleIndex,
              error: error.message,
            });

            // Check if it's a safety system rejection - try next style
            if (
              error.status === 400 &&
              error.message?.includes("safety system") &&
              currentStyleIndex < artStyleOptions.length - 1
            ) {
              logger.debug("Safety system rejection, trying next style", {
                storyId,
                pageIndex: pageIndex + 1,
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

        if (imageGenerated) {
          break; // Break out of model loop
        }

        // Log failover attempt
        if (currentModel === primaryModel && fallbackModel) {
          logger.info(
            "Primary model failed for page image, attempting fallback",
            {
              storyId,
              pageIndex: pageIndex + 1,
              primaryModel,
              fallbackModel,
              lastError: lastError?.message,
            }
          );
        }
      }

      if (!imageGenerated) {
        throw new Error(
          `Failed to generate image for page ${pageIndex + 1} with all available models and art style descriptions`
        );
      }

      if (!finalImageUrl) {
        throw new Error(
          `Failed to generate image URL for page ${pageIndex + 1}`
        );
      }

      const storagePath = await uploadImageToStorage(
        finalImageUrl,
        userId,
        storyId,
        `page-${pageIndex + 1}`
      );

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
        const imageGenerationPrompt = finalPromptUsed;

        const updateData: { [key: string]: any } = {
          storyContent: newStoryContent,
          imagesGenerated: FieldValue.increment(1),
          // Store page-specific generation data
          [`generationMetadata.pageImageGenerationData.page${pageIndex + 1}`]: {
            prompt: imageGenerationPrompt,
            originalImagePrompt: imagePrompt,
            model: actualModelUsed,
            originalModel: imageProvider,
            usedFallback: actualModelUsed !== imageProvider,
            generatedAt: FieldValue.serverTimestamp(),
          },
        };

        const currentImagesGenerated = storyData.imagesGenerated || 0;
        const totalImages = storyData.totalImages || 0;

        if (totalImages > 0 && currentImagesGenerated + 1 >= totalImages) {
          updateData.imageGenerationStatus = "completed";
          updateData.generationPhase = "all_complete";

          // Send notification when story is fully complete (after this transaction commits)
          // We'll do this after the transaction to ensure the data is persisted
        }

        transaction.update(storyRef, updateData);
      });

      // Check if this was the final image and send notification
      const currentImagesGenerated =
        (await storyRef.get()).data()?.imagesGenerated || 0;
      const totalImages = (await storyRef.get()).data()?.totalImages || 0;

      if (totalImages > 0 && currentImagesGenerated >= totalImages) {
        // Story is fully complete - send notification
        const finalStoryData = (await storyRef.get()).data();
        if (finalStoryData) {
          await sendStoryCompleteNotification(userId, {
            id: storyId,
            title: finalStoryData.title,
            ...finalStoryData,
          });
        }
      }
    } catch (error) {
      // Track page image generation failure
      await logMetric("page_image_generation_failed", {
        total_attempts: pageAttempts,
        style_fallbacks_used: pageStyleFallbacksUsed,
        models_tried: modelsToTry,
        art_styles_tried: artStyleOptions.filter(Boolean).length,
        error_message: error instanceof Error ? error.message : "unknown",
      });

      logger.error("Failed to process page", error, {
        pageIndex: pageIndex + 1,
        storyId,
        userId,
      });
      await storyRef.update({
        imageGenerationStatus: "failed",
        imageGenerationError: `Failed on page ${pageIndex + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }
);
