import { PubSub } from "@google-cloud/pubsub";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { StoryGenerationRequest, StoryPage } from "./types";
import { fluxApiKey } from "./utils/flux";
import { geminiApiKey, getGeminiClient } from "./utils/gemini";
import { getOpenAIClient, openaiApiKey } from "./utils/openai";
import { retryWithBackoff } from "./utils/retry";
import { uploadImageToStorage } from "./utils/storage";

const pubsub = new PubSub();
const topicName = "generate-story-image";

export const generateStory = onCall(
  {
    secrets: [openaiApiKey, fluxApiKey, geminiApiKey],
    timeoutSeconds: 540, // 9-minute timeout to allow for cover generation
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
        .map((child: any) => {
          const today = new Date();
          const birthDate = new Date(child.dateOfBirth.seconds * 1000);
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          const dayDiff = today.getDate() - birthDate.getDate();

          // Adjust age if birthday hasn't occurred this year
          return monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)
            ? age - 1
            : age;
        });

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

      // Debug logging for page image model
      console.log(`[DEBUG] Received pageImageModel: ${data.pageImageModel}`);
      console.log(
        `[DEBUG] Final imageProvider will be: ${data.pageImageModel || "gemini"}`
      );
      const systemPrompt = `You are a creative children's story writer specializing in personalized bedtime stories. Create engaging, age-appropriate stories that will delight young readers without relying on cliches. Be creative and inventive.`;

      // Build character info from character selection screen
      const allCharacters = data.characters || [];

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
                const today = new Date();
                const birthDate = new Date(
                  childData.dateOfBirth.seconds * 1000
                );
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                const dayDiff = today.getDate() - birthDate.getDate();

                // Adjust age if birthday hasn't occurred this year
                const adjustedAge =
                  monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)
                    ? age - 1
                    : age;

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

      // Separate character names with ages from full appearance details
      const characterNamesWithAges = await Promise.all(
        allCharacters.map(async (char) => {
          if (char.isChild && char.childId) {
            const childData = allRelevantChildren.find(
              (c: any) => c.id === char.childId
            );
            if (childData && childData.dateOfBirth) {
              const today = new Date();
              const birthDate = new Date(childData.dateOfBirth.seconds * 1000);
              const age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              const dayDiff = today.getDate() - birthDate.getDate();

              const adjustedAge =
                monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)
                  ? age - 1
                  : age;

              return `${char.name} (${adjustedAge} years old)`;
            }
          }
          return char.name;
        })
      );

      const characterNamesString = characterNamesWithAges.join(", ");

      const userPrompt = `Create a personalized bedtime story with the following details:
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

Requirements:
1. The story should be divided into exactly ${pageCount} pages.
2. Each page should be an appropriate length for a ${ageRangeStr} reader.
3. ${data.storyAbout ? `The story should incorporate the concept: ${data.storyAbout}` : "Feel free to create any engaging storyline within the theme."}
4. ${data.mood ? `The story should have a ${data.mood} mood throughout.` : "Keep the mood appropriate for bedtime."}
5. ${data.shouldRhyme ? "The story should rhyme like a poem or nursery rhyme. Make it flow nicely with a consistent rhyme scheme." : "Write in natural prose (no rhyming required)."}
6. ${
        data.enableIllustrations
          ? `For each page, include an image prompt description - a visual description of how you envisage the scene. Include who and what should appear in the image. When describing characters in image prompts, use all character details: ${characterInfo || "create appropriate character descriptions"}. You must also describe, in detail, the visual appearance of any objects, settings, or actions on the page. This is important for visual consistency across the pages story - each image will be generated separately. There is no need to describe the style of the illustrations in the image prompts, as that will be handled by the illustration model.`
          : "No image prompts needed."
      }
7. Make sure the story has a clear beginning, middle, and end.
8. IMPORTANT: Character ages can be used in both story text and image prompts. Physical appearance details (hair color, eye color, etc.) should generally only be used in image prompts. The story text should focus on actions, dialogue, and plot.

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
        const geminiClient = getGeminiClient();
        const geminiResponse = await retryWithBackoff(() =>
          geminiClient.generateText(
            systemPrompt,
            userPrompt +
              "\n\nIMPORTANT: Return ONLY valid JSON in the exact format specified above.",
            temperature,
            data.geminiThinkingBudget
          )
        );

        // Clean the response to extract JSON
        let jsonText = geminiResponse;
        if (jsonText.includes("```json")) {
          const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }
        }

        try {
          storyContent = JSON.parse(jsonText.trim());
        } catch (error) {
          console.error("Failed to parse Gemini response as JSON:", jsonText);
          throw new HttpsError("internal", "Invalid JSON response from Gemini");
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

      // 5. Generate and Upload Cover Image to its FINAL path
      let coverImageStoragePath = "";
      let coverImageUrlForWorkers = "";
      let coverPrompt = "";

      if (data.enableIllustrations) {
        console.log(
          `[Orchestrator] Generating cover image for final storyId: ${storyId}`
        );
        const selectedCoverImageModel =
          data.coverImageModel || "gemini-2.0-flash-preview-image-generation";
        const illustrationStyleDescription =
          data.illustrationAiDescription || data.illustrationStyle;
        coverPrompt = `Aspect ratio: Square (1:1). ${storyContent.coverImagePrompt}. Style: ${illustrationStyleDescription}. Create a well-composed children's book cover illustration in 1:1 aspect ratio format. Add the book title "${storyContent.title}" to the image. Do not add the name of the author or any other text to the image.`;

        if (
          selectedCoverImageModel ===
          "gemini-2.0-flash-preview-image-generation"
        ) {
          const geminiClient = getGeminiClient();
          coverImageUrlForWorkers = await retryWithBackoff(() =>
            geminiClient.generateImage(coverPrompt)
          );
        } else if (
          selectedCoverImageModel === "dall-e-3" ||
          selectedCoverImageModel === "gpt-image-1"
        ) {
          const openai = getOpenAIClient();
          const dalleResponse = await retryWithBackoff(() =>
            openai.images.generate({
              model: selectedCoverImageModel,
              prompt: coverPrompt,
              size: "1024x1024",
              quality: "medium",
              n: 1,
              // Use base64 for both models for consistency
              ...(selectedCoverImageModel === "dall-e-3" && {
                response_format: "b64_json",
              }),
              // Use low moderation for gpt-image-1 to reduce false positives
              ...(selectedCoverImageModel === "gpt-image-1" && {
                moderation: "low",
              }),
            })
          );

          // Both models now return base64 for consistency
          const imageData = dalleResponse.data?.[0];
          if (!imageData?.b64_json) {
            throw new Error("No base64 image data returned from OpenAI");
          }

          // Convert base64 to data URL for both models
          coverImageUrlForWorkers = `data:image/png;base64,${imageData.b64_json}`;
        }

        console.log(
          `[Orchestrator] Cover image generated. Uploading to final path...`
        );
        coverImageStoragePath = await uploadImageToStorage(
          coverImageUrlForWorkers,
          userId,
          storyId,
          "cover"
        );
        console.log(
          `[Orchestrator] Cover image uploaded to: ${coverImageStoragePath}`
        );
      }

      // 6. Create the Story Document in Firestore with the FINAL data
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
        coverImageUrl: coverImageStoragePath,
        storyConfiguration: data,
        imageGenerationStatus: data.enableIllustrations
          ? "generating"
          : "not_requested",
        imagesGenerated: 0,
        totalImages: data.enableIllustrations ? storyPages.length : 0,
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
          coverImageModel: data.enableIllustrations
            ? data.coverImageModel ||
              "gemini-2.0-flash-preview-image-generation"
            : null,
          coverImagePrompt: data.enableIllustrations ? coverPrompt : null,
          // Page image generation details
          pageImageModel: data.enableIllustrations
            ? data.pageImageModel || "gemini"
            : null,
          pageImagePrompts: data.enableIllustrations
            ? storyContent.pages.map((p: any) => p.imagePrompt)
            : null,
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
            enableIllustrations: data.enableIllustrations,
          },
          // Computed values
          averageChildAge: averageAge,
          selectedChildrenIds: data.selectedChildren,
        },
      };

      await storyRef.set(storyDocData);

      // 7. Fan-out jobs for ALL pages
      if (data.enableIllustrations && coverImageUrlForWorkers) {
        const publishPromises = storyContent.pages.map(
          (page: any, index: number) => {
            const payload = {
              storyId,
              userId,
              pageIndex: index,
              imagePrompt: page.imagePrompt,
              imageProvider: data.pageImageModel || "gemini",
              consistencyInput: {
                imageUrl: coverImageUrlForWorkers,
                text: storyContent.coverImagePrompt,
              },
              characters: {
                names: characterNamesString,
                descriptions: characterInfo,
              },
            };
            return pubsub.topic(topicName).publishMessage({ json: payload });
          }
        );
        await Promise.all(publishPromises);
        console.log(
          `[Orchestrator] Published jobs for all ${storyContent.pages.length} pages.`
        );
      }

      // 8. Return the story ID to the client
      console.log(
        `[Orchestrator] Process complete. Returning storyId: ${storyId}`
      );
      return { success: true, storyId };
    } catch (error: any) {
      console.error("Error in generateStory orchestrator:", error);

      // If it's already an HttpsError, just re-throw it
      if (error instanceof HttpsError) {
        throw error;
      }

      // Handle specific OpenAI API errors
      if (error.name === "BadRequestError" || error.status === 400) {
        if (error.message && error.message.includes("safety system")) {
          throw new HttpsError(
            "invalid-argument",
            "Your story content doesn't meet our content guidelines. Please try a different theme, characters, or story concept that's more appropriate for children's stories, and/or doesn't infringe on any copyright."
          );
        }
      }

      // Handle rate limiting
      if (error.status === 429) {
        throw new HttpsError(
          "resource-exhausted",
          "The AI service is currently busy. Please try again in a few minutes."
        );
      }

      // Handle authentication errors
      if (error.status === 401 || error.status === 403) {
        throw new HttpsError(
          "permission-denied",
          "There was an issue with the AI service. Please try again later."
        );
      }

      // Handle network/timeout errors
      if (
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT" ||
        error.message?.includes("timeout")
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
