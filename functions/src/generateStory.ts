import { PubSub } from "@google-cloud/pubsub";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { TIMEOUTS } from "./constants";
import { DEFAULT_MODELS } from "./models";
import { StoryGenerationRequest, StoryPage } from "./types";
import { geminiApiKey, getGeminiClient } from "./utils/gemini";
import { logger } from "./utils/logger";
import { getOpenAIClient, openaiApiKey } from "./utils/openai";
import { retryWithBackoff, isJsonParseError } from "./utils/retry";
import { jsonrepair } from "jsonrepair";

// Safe JSON repair using the jsonrepair library
function repairJSON(jsonText: string): string {
  try {
    // Use the robust jsonrepair library which is designed for LLM outputs
    return jsonrepair(jsonText);
  } catch (error) {
    // If jsonrepair fails, return the original text to let JSON.parse fail naturally
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("jsonrepair library failed to repair JSON", { error: message });
    return jsonText;
  }
}

const pubsub = new PubSub();

// Helper function to calculate age from birthdate
function calculateAge(birthDateSeconds: number): number {
  const today = new Date();
  const birthDate = new Date(birthDateSeconds * 1000);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // For month/year dates, we only check if the birth month has passed this year
  return monthDiff < 0 ? age - 1 : age;
}

// Helper function to get art style descriptions in order of fallback preference
function getArtStyleDescriptions(data: StoryGenerationRequest): string[] {
  const descriptions: string[] = [];

  if (data.illustrationAiDescription) {
    descriptions.push(data.illustrationAiDescription);
  }
  if (data.illustrationAiDescriptionBackup1) {
    descriptions.push(data.illustrationAiDescriptionBackup1);
  }
  if (data.illustrationAiDescriptionBackup2) {
    descriptions.push(data.illustrationAiDescriptionBackup2);
  }

  return descriptions;
}

export const generateStory = onCall(
  {
    secrets: [openaiApiKey, geminiApiKey],
    timeoutSeconds: TIMEOUTS.STORY_GENERATION,
    memory: "1GiB",
  },
  // Added the correct type for the request object
  async (request: CallableRequest<StoryGenerationRequest>) => {
    // 1. Authenticate the user
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    // request.data is now correctly typed as StoryGenerationRequest
    const data = request.data;

    // Start timing for performance analytics
    const generationStartTime = Date.now();

    // Metric helper for server-side logging
    const logMetric = async (eventName: string, params: any) => {
      try {
        logger.info(`Metric: ${eventName}`, { userId, ...params });
        // In production, you might want to send these to a separate analytics service
      } catch (error) {
        logger.error("Metric logging failed", error);
      }
    };

    // Track story generation started
    await logMetric("story_generation_server_started", {
      page_count: data.pageCount,
      has_illustrations:
        !!data.illustrationStyle && data.illustrationStyle !== "none",
      character_count: data.characters?.length || 0,
      model_primary: DEFAULT_MODELS.TEXT,
      theme: data.theme,
      mood: data.mood,
      timestamp: new Date().toISOString(),
    });

    try {
      // 2. Fetch user and children data for personalization
      const db = getFirestore();
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      if (!userData) {
        throw new HttpsError("not-found", "User not found");
      }

      const children = userData.children || [];

      // Get audience children (those who will read/hear the story)
      const audienceChildren = children.filter(
        (child: any) =>
          child && child.id && data.selectedChildren.includes(child.id)
      );

      // Get all children who appear as characters (may include non-audience children)
      const allCharacterChildIds = (data.characters || [])
        .filter((char) => char.isChild && char.childId)
        .map((char) => char.childId);

      const allRelevantChildren = children.filter(
        (child: any) =>
          child &&
          child.id &&
          (data.selectedChildren.includes(child.id) || // audience children
            allCharacterChildIds.includes(child.id)) // character children
      );

      const pageCount = data.pageCount;

      // Calculate age range based on AUDIENCE children only
      const audienceAges = audienceChildren
        .filter((child: any) => child.dateOfBirth)
        .map((child: any) => calculateAge(child.dateOfBirth.seconds));

      // Create age range string
      let ageRangeStr: string;
      let averageAge: number;
      if (audienceAges.length === 0) {
        ageRangeStr = "5 years old";
        averageAge = 5;
      } else if (audienceAges.length === 1) {
        ageRangeStr = `${audienceAges[0]} years old`;
        averageAge = audienceAges[0];
      } else {
        const minAge = Math.min(...audienceAges);
        const maxAge = Math.max(...audienceAges);
        ageRangeStr =
          minAge === maxAge
            ? `${minAge} years old`
            : `${minAge} to ${maxAge} years old`;
        averageAge = Math.round(
          audienceAges.reduce((sum: number, age: number) => sum + age, 0) /
            audienceAges.length
        );
      }

      // 3. Generate story text and prompts using selected model
      const selectedTextModel = data.textModel || "gpt-4o";
      const temperature = data.temperature ?? 0.9; // Use user preference or default

      const systemPrompt = `You are a world-class creative children's story writer. Create engaging, age-appropriate stories that will delight young readers without relying on cliches. Be creative and inventive.`;

      // Build character info from character selection screen
      const allCharacters = data.characters || [];

      logger.debug("Full request data", {
        selectedChildren: data.selectedChildren,
        characters: data.characters,
        theme: data.theme,
        mood: data.mood,
        storyAbout: data.storyAbout,
      });

      // Get appearance details for children who are characters
      const characterDescriptions = await Promise.all(
        allCharacters.map(async (char) => {
          if (char.isChild && char.childId) {
            // Use allRelevantChildren to include both audience and character children
            const childData = allRelevantChildren.find(
              (c: any) => c.id === char.childId
            );

            if (childData) {
              const characterDetails: string[] = [];

              // Calculate age if dateOfBirth is available
              if (childData.dateOfBirth) {
                const adjustedAge = calculateAge(childData.dateOfBirth.seconds);
                characterDetails.push(`${adjustedAge} years old`);
              }

              // Add appearance details
              if (childData.hairColor)
                characterDetails.push(`${childData.hairColor} hair`);
              if (childData.hairStyle)
                characterDetails.push(`${childData.hairStyle} hairstyle`);
              if (childData.eyeColor)
                characterDetails.push(`${childData.eyeColor} eyes`);
              if (childData.skinColor)
                characterDetails.push(`${childData.skinColor} skin`);
              if (childData.appearanceDetails)
                characterDetails.push(childData.appearanceDetails);

              const details =
                characterDetails.length > 0
                  ? ` (${characterDetails.join(", ")})`
                  : "";

              return `${char.name}${details}`;
            }
          }
          // Combine description and appearance for custom characters
          const fullDescription = [char.description, char.appearance]
            .filter(Boolean)
            .join("; ");
          return `${char.name}${fullDescription ? ` (${fullDescription})` : ""}`;
        })
      );

      const characterInfo = characterDescriptions.join(", ");

      logger.debug("Character descriptions built", { characterDescriptions });

      // Separate character names with ages from full appearance details
      const characterNamesWithAges = await Promise.all(
        allCharacters.map(async (char) => {
          if (char.isChild && char.childId) {
            const childData = allRelevantChildren.find(
              (c: any) => c.id === char.childId
            );
            if (childData && childData.dateOfBirth) {
              const adjustedAge = calculateAge(childData.dateOfBirth.seconds);
              return `${char.name} (${adjustedAge} years old)`;
            }
          }
          return char.name;
        })
      );

      const characterNamesString = characterNamesWithAges.join(", ");

      logger.debug("Character names with ages", {
        characterNamesWithAges,
        characterNamesString,
      });

      const userPrompt = `Create a personalized story with the following details:
${
  characterNamesString
    ? `- Main character(s): ${characterNamesString}`
    : "- Create engaging characters for the story"
}
- Reader age level: ${ageRangeStr}
- Theme: ${data.theme}
${data.mood ? `- Mood: ${data.mood}` : ""}
- Story length: ${pageCount} pages
${data.storyAbout ? `- Story concept: ${data.storyAbout}` : ""}
- Illustration art style: ${data.illustrationAiDescription || data.illustrationStyle}

Requirements:
1. The story should be divided into exactly ${pageCount} pages.
2. Each page should be an appropriate length for a ${ageRangeStr} reader.
3. ${data.storyAbout ? `The story should incorporate the concept: ${data.storyAbout}` : "Feel free to create any engaging storyline within the theme."}
4. ${data.mood ? `The story should have a ${data.mood} mood throughout.` : "Keep the mood appropriate for bedtime."}
5. ${data.shouldRhyme ? "The story should rhyme like a poem or nursery rhyme. Make it flow nicely with a consistent rhyme scheme." : "Write in natural prose (no rhyming required)."}
6. For each page, include an "imagePrompt" field with a detailed visual description of the scene. The image prompts should:
   - Describe exactly who appears in the scene and what they are doing
   - Include all relevant character details: ${characterInfo || "create appropriate character descriptions"}
   - Describe the setting, objects, and visual elements in detail
   - Be written specifically for the "${data.illustrationAiDescription || data.illustrationStyle}" art style, although you should not mention the art style directly in the prompt.
   - Ensure visual consistency. Each image will be generated separately, so it is good to repeat visual details across pages.
   - Focus on visual elements that work well with the chosen art style
7. Make sure the story has a clear beginning, middle, and end.

Return the story in this JSON format:
{
  "title": "Story Title",
  "coverImagePrompt": "A detailed description for the book cover. It should describe the main characters' appearances (e.g., 'a brave knight with a shiny silver helmet and a blue cape, and a friendly dragon with green scales and a happy smile stand at the top of a mountain. The dragon is wearing a blue scarf and has big, friendly eyes.')",
  "pages": [
    {
      "page": 1,
      "text": "Page text here",
      "imagePrompt": "A detailed visual description of the scene on this page, including characters, objects and setting."
    }
  ]
}`;

      let storyContent: any;

      if (selectedTextModel === "gpt-4o") {
        const openai = getOpenAIClient();
        const chatResponse = await retryWithBackoff(() =>
          openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature,
            response_format: { type: "json_object" },
          })
        );
        storyContent = JSON.parse(
          chatResponse.choices[0].message.content || "{}"
        );
      } else if (selectedTextModel === "gemini-2.5-pro") {
        try {
          const geminiClient = getGeminiClient();
          storyContent = await retryWithBackoff(async () => {
            const geminiResponse = await geminiClient.generateText(
              systemPrompt,
              userPrompt +
                "\n\nIMPORTANT: Return ONLY valid JSON in the exact format specified above.",
              temperature,
              data.geminiThinkingBudget
            );

            // Clean the response to extract JSON
            let jsonText = geminiResponse;
            if (jsonText.includes("```json")) {
              const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
              if (jsonMatch) {
                jsonText = jsonMatch[1];
              }
            }

            // Attempt to repair the JSON. jsonrepair is safe to run on valid JSON.
            const repairedJSON = repairJSON(jsonText);
            if (repairedJSON !== jsonText) {
              logger.info("Successfully repaired malformed JSON", {
                original: jsonText.substring(0, 200) + "...",
                repaired: repairedJSON.substring(0, 200) + "...",
              });
            }

            // This will throw if the repaired JSON is still invalid, triggering a retry.
            return JSON.parse(repairedJSON.trim());
          });
        } catch (error: any) {
          // Log JSON parsing failures that persisted through all retries
          if (isJsonParseError(error)) {
            logger.error(
              "Failed to parse Gemini response as JSON after retries",
              {
                error: error.message,
              }
            );

            await logMetric("story_generation_failed", {
              error_type: "json_parse_failure",
              error_message:
                error instanceof Error ? error.message : "JSON parse failed",
              model_attempted: "gemini",
              generation_time_ms: Date.now() - generationStartTime,
              story_config: {
                page_count: data.pageCount,
                theme: data.theme,
                mood: data.mood,
                character_count: data.characters?.length || 0,
              },
            });

            throw new HttpsError(
              "internal",
              "Invalid JSON response from Gemini after multiple attempts"
            );
          }

          // Check if this is a Gemini safety filter error
          if (error.message && error.message.includes("safety filter")) {
            logger.info(
              "Gemini safety filter blocked content, falling back to GPT-4o"
            );

            await logMetric("story_generation_safety_blocked", {
              model_blocked: "gemini",
              attempting_fallback: "gpt4o",
              content_type: "story_text",
              story_config: {
                theme: data.theme,
                mood: data.mood,
                character_count: data.characters?.length || 0,
                page_count: data.pageCount,
              },
            });

            // Fallback to GPT-4o (proven to work well for children's stories)
            try {
              const openai = getOpenAIClient();
              const chatResponse = await retryWithBackoff(() =>
                openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                  ],
                  temperature,
                  response_format: { type: "json_object" },
                })
              );
              storyContent = JSON.parse(
                chatResponse.choices[0].message.content || "{}"
              );

              logger.info("Successfully generated story using GPT-4o fallback");
            } catch (fallbackError: any) {
              await logMetric("story_generation_fallback_failed", {
                primary_model: "gemini",
                fallback_model: "gpt4o",
                error_type: fallbackError.name,
                both_models_failed: true,
                generation_time_ms: Date.now() - generationStartTime,
                final_error: fallbackError.message?.includes("safety system")
                  ? "safety_filter"
                  : "other",
              });

              // If GPT-4o also blocks content, show friendly error
              if (
                fallbackError.name === "BadRequestError" &&
                fallbackError.message?.includes("safety system")
              ) {
                logger.warn("Both Gemini and GPT-4o blocked content");
                throw new HttpsError(
                  "invalid-argument",
                  "Your story content doesn't meet our content guidelines. Please try a different theme, characters, or story concept that's more appropriate for children's stories.\n\nYour credits have not been used for this attempt. If you believe this filtering is in error, please contact support@dreamweaver-app.com"
                );
              }
              // Re-throw other GPT-4o errors
              throw fallbackError;
            }
          } else {
            // Re-throw non-safety filter errors
            throw error;
          }
        }
      }
      if (
        !storyContent.title ||
        !storyContent.pages ||
        !storyContent.coverImagePrompt
      ) {
        throw new HttpsError(
          "internal",
          "Invalid story structure from AI provider."
        );
      }

      // 4. Generate the final Story ID *before* any uploads or writes
      const storyRef = db.collection("stories").doc();
      const storyId = storyRef.id;

      // 5. Create the Story Document with just text data first (for granular UI feedback)
      const storyPages: StoryPage[] = storyContent.pages.map((page: any) => ({
        page: page.page,
        text: page.text,
        imageUrl: "",
      }));

      const storyDocData = {
        userId,
        title: storyContent.title,
        createdAt: FieldValue.serverTimestamp(),
        storyContent: storyPages,
        coverImageUrl: null as any, // Will be updated after cover generation - null instead of "" to avoid truthy check issues
        storyConfiguration: data,
        imageGenerationStatus: "generating",
        generationPhase: "text_complete", // New field to track phases
        imagesGenerated: 0,
        totalImages: storyPages.length,
        // Store generation metadata
        generationMetadata: {
          // Text generation details
          textModel: selectedTextModel,
          textPrompts: {
            system: systemPrompt,
            user: userPrompt,
          },
          temperature,
          geminiThinkingBudget:
            selectedTextModel === "gemini-2.5-pro"
              ? data.geminiThinkingBudget
              : undefined,
          // Cover image generation details
          coverImageModel: data.coverImageModel || DEFAULT_MODELS.COVER_IMAGE,
          coverImagePrompt: "", // Will be updated after cover generation
          // Page image generation details
          pageImageModel: data.pageImageModel || DEFAULT_MODELS.PAGE_IMAGE,
          pageImagePrompts: storyContent.pages.map((p: any) => p.imagePrompt),
          pageImageGenerationData: {}, // Will be populated as individual pages are generated
          illustrationStyle: data.illustrationStyle,
          illustrationAiDescription: data.illustrationAiDescription,
          // Character information used
          charactersUsed: allCharacters,
          characterDescriptions: characterInfo,
          // User preferences captured
          userPreferences: {
            theme: data.theme,
            mood: data.mood,
            pageCount: data.pageCount,
            shouldRhyme: data.shouldRhyme,
            storyAbout: data.storyAbout,
          },
          // Computed values
          averageChildAge: averageAge,
          selectedChildrenIds: data.selectedChildren,
        },
      };

      logger.info("Creating story document with text data", {
        storyId,
        hasTitle: !!storyContent.title,
        hasStoryContent: storyPages.length > 0,
        coverImageUrl: storyDocData.coverImageUrl,
        generationPhase: storyDocData.generationPhase,
        timestamp: new Date().toISOString(),
      });
      await storyRef.set(storyDocData);
      logger.info("Story document created successfully", {
        timestamp: new Date().toISOString(),
      });

      // 6. Publish Cover Image Generation Task to Pub/Sub
      logger.info("Publishing cover image generation task", { storyId });

      const selectedCoverImageModel =
        data.coverImageModel || DEFAULT_MODELS.COVER_IMAGE;

      const artStyleDescriptions = getArtStyleDescriptions(data);

      // Publish cover generation task to Pub/Sub
      const coverPayload = {
        storyId,
        userId,
        title: storyContent.title,
        coverImagePrompt: storyContent.coverImagePrompt,
        coverImageModel: selectedCoverImageModel,
        artStyle: artStyleDescriptions[0],
        artStyleBackup1: artStyleDescriptions[1],
        artStyleBackup2: artStyleDescriptions[2],
        // Include data needed for page generation after cover completes
        pageImageModel: data.pageImageModel,
        pagePrompts: storyContent.pages.map((p: any) => p.imagePrompt),
        characterNames: characterNamesString,
        characterDescriptions: characterInfo,
        enablePageIllustrations: true,
      };

      await pubsub
        .topic("generate-cover-image")
        .publishMessage({ json: coverPayload });
      logger.info("Cover image generation task published successfully");

      // 7. Page image generation will be triggered by the cover generation function
      // after the cover is successfully generated (to maintain consistency)

      // 9. Return the story ID to the client
      const generationTimeMs = Date.now() - generationStartTime;

      await logMetric("story_generation_completed", {
        story_id: storyId,
        generation_time_ms: generationTimeMs,
        generation_time_seconds: Math.round(generationTimeMs / 1000),
        page_count: data.pageCount,
        has_illustrations:
          !!data.illustrationStyle && data.illustrationStyle !== "none",
        character_count: data.characters?.length || 0,
        model_used: selectedTextModel,
        required_fallback: selectedTextModel !== DEFAULT_MODELS.TEXT,
      });

      logger.info("Process complete", { storyId });
      return { success: true, storyId };
    } catch (error: unknown) {
      logger.error("Error in generateStory orchestrator", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : "unknown";

      // Track the error for analytics
      await logMetric("story_generation_failed", {
        error_type: error instanceof HttpsError ? error.code : errorName,
        error_message: errorMessage,
        generation_time_ms: Date.now() - generationStartTime,
        model_attempted: DEFAULT_MODELS.TEXT,
        story_config: {
          page_count: data.pageCount,
          theme: data.theme,
          mood: data.mood,
          character_count: data.characters?.length || 0,
        },
      });

      // If it's already an HttpsError, just re-throw it
      if (error instanceof HttpsError) {
        throw error;
      }

      // Handle Gemini safety filter errors (fallback should have handled this, but just in case)
      if (errorMessage.includes("safety filter")) {
        logger.error(
          "Gemini safety filter error reached global handler - fallback may have failed"
        );
        throw new HttpsError(
          "invalid-argument",
          "Your story content doesn't meet our content guidelines. Please try a different theme, characters, or story concept that's more appropriate for children's stories.\n\nYour credits have not been used for this attempt. If you believe this filtering is in error, please contact support@dreamweaver-app.com"
        );
      }

      // Handle specific OpenAI API errors
      const errorStatus =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status: unknown }).status
          : undefined;
      const errorCode =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code: unknown }).code
          : undefined;

      if (errorName === "BadRequestError" || errorStatus === 400) {
        if (errorMessage.includes("safety system")) {
          throw new HttpsError(
            "invalid-argument",
            "Your story content doesn't meet our content guidelines. Please try a different theme, characters, or story concept that's more appropriate for children's stories, and/or doesn't infringe on any copyright.\n\nYour credits have not been used for this attempt. If you believe this filtering is in error, please contact support@dreamweaver-app.com"
          );
        }
      }

      // Handle rate limiting
      if (errorStatus === 429) {
        throw new HttpsError(
          "resource-exhausted",
          "The AI service is currently busy. Please try again in a few minutes."
        );
      }

      // Handle authentication errors
      if (errorStatus === 401 || errorStatus === 403) {
        throw new HttpsError(
          "permission-denied",
          "There was an issue with the AI service. Please try again later."
        );
      }

      // Handle network/timeout errors
      if (
        errorCode === "ECONNRESET" ||
        errorCode === "ETIMEDOUT" ||
        errorMessage.includes("timeout")
      ) {
        throw new HttpsError(
          "deadline-exceeded",
          "The story generation is taking longer than expected. Please try again."
        );
      }

      // Generic fallback error
      throw new HttpsError(
        "internal",
        "We're having trouble generating your story right now. Please try again in a few moments."
      );
    }
  }
);
