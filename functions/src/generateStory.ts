import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { StoryGenerationRequest, StoryPage, GeneratedStory } from "./types";
import { openaiApiKey, getOpenAIClient } from "./utils/openai";
import { retryWithBackoff } from "./utils/retry";
import { generateImagesInBackground } from "./generateImagesInBackground";

export const generateStory = onCall(
  {
    secrets: [openaiApiKey],
    timeoutSeconds: 540, // 9 minutes timeout
    memory: "1GiB",
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const data = request.data as StoryGenerationRequest;

    try {
      const userId = request.auth.uid;

      // Get user and children data from Firestore
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError("not-found", "User not found");
      }

      const children = userData.children || [];
      const selectedChildrenData = children.filter((child: any) =>
        data.selectedChildren.includes(child.id)
      );

      if (
        selectedChildrenData.length === 0 &&
        data.selectedChildren.length > 0
      ) {
        throw new HttpsError("invalid-argument", "Selected children not found");
      }

      // Calculate story parameters
      const pageCount =
        data.length === "short" ? 4 : data.length === "medium" ? 6 : 8;
      const childNames = selectedChildrenData
        .map((child: any) => child.childName)
        .join(" and ");
      const preferences = selectedChildrenData
        .map((child: any) => child.childPreferences)
        .filter((pref: string) => pref.trim())
        .join(", ");

      // Calculate average age for appropriate content
      const ages = selectedChildrenData.map((child: any) => {
        const today = new Date();
        const birthDate = new Date(child.dateOfBirth.seconds * 1000);
        return today.getFullYear() - birthDate.getFullYear();
      });
      const averageAge =
        ages.length > 0
          ? Math.round(
              ages.reduce((sum: number, age: number) => sum + age, 0) /
                ages.length
            )
          : 5;

      // Get OpenAI client
      const openai = getOpenAIClient();

      // Generate story with OpenAI
      const systemPrompt = `You are a creative children's story writer specializing in personalized bedtime stories. Create engaging, age-appropriate stories that are magical, gentle, and educational.`;

      const userPrompt = `Create a personalized bedtime story with the following details:
${
  data.childrenAsCharacters && childNames
    ? `- Main character(s): ${childNames}`
    : "- Generic child character"
}
- Age level: ${averageAge} years old
- Theme: ${data.theme}
- Story length: ${pageCount} pages
${preferences ? `- Child interests: ${preferences}` : ""}

Requirements:
1. The story should be divided into exactly ${pageCount} pages
2. Each page should be 2-3 sentences suitable for a ${averageAge}-year-old
3. ${
        data.childrenAsCharacters && childNames
          ? `Include ${childNames} as the main character(s)`
          : "Use a generic child character"
      }
4. Make it gentle and perfect for bedtime
5. End with a peaceful, sleep-inducing conclusion
6. ${
        data.enableIllustrations
          ? "For each page, include an image prompt description"
          : "No image prompts needed"
      }

Return the story in this JSON format:
{
  "title": "Story Title",
  "pages": [
    {
      "page": 1,
      "text": "Page text here",
      ${
        data.enableIllustrations
          ? '"imagePrompt": "A gentle, child-friendly illustration of [scene description]"'
          : ""
      }
    }
  ]
}`;

      const chatResponse = await retryWithBackoff(() =>
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.9,
          response_format: { type: "json_object" },
        })
      );

      const storyContent = JSON.parse(
        chatResponse.choices[0].message.content || "{}"
      );

      // Create story pages with placeholder images
      const storyPages: StoryPage[] = [];
      for (const page of storyContent.pages) {
        storyPages.push({
          page: page.page,
          text: page.text,
          imageUrl: "", // Empty for now, will be filled by background task
        });
      }

      // Save story to Firestore immediately with text only
      const storyData = {
        userId,
        title: storyContent.title,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        storyContent: storyPages,
        coverImageUrl: "", // Empty for now
        storyConfiguration: data,
        imageGenerationStatus: data.enableIllustrations
          ? "pending"
          : "not_requested",
        imagesGenerated: 0,
        totalImages: data.enableIllustrations ? storyPages.length + 1 : 0, // +1 for cover
      };

      const storyRef = await admin
        .firestore()
        .collection("stories")
        .add(storyData);

      // Start image generation in background if enabled
      if (data.enableIllustrations) {
        // Don't await this - let it run in background
        generateImagesInBackground(
          storyRef.id,
          storyContent,
          storyPages,
          data,
          averageAge,
          openai,
          userId
        ).catch((error) => {
          console.error(
            `Background image generation failed for story ${storyRef.id}:`,
            error
          );
          // Update status to failed
          storyRef.update({
            imageGenerationStatus: "failed",
            imageGenerationError: error.message || "Unknown error",
          });
        });
      }

      const result: GeneratedStory = {
        title: storyContent.title,
        pages: storyPages,
        coverImageUrl: "",
      };

      return {
        success: true,
        storyId: storyRef.id,
        story: result,
        imageGenerationStatus: data.enableIllustrations
          ? "pending"
          : "not_requested",
      };
    } catch (error: any) {
      console.error("Error generating story:", error);

      // Provide more specific error messages
      if (
        error.message?.includes("timeout") ||
        error.message?.includes("DEADLINE")
      ) {
        throw new HttpsError(
          "deadline-exceeded",
          "Story generation took too long. Please try again with fewer pages or simpler settings."
        );
      }

      if (error.message?.includes("API key")) {
        throw new HttpsError(
          "failed-precondition",
          "OpenAI API key configuration error"
        );
      }

      if (error.code === "resource-exhausted") {
        throw new HttpsError(
          "resource-exhausted",
          "AI service is temporarily unavailable. Please try again later."
        );
      }

      throw new HttpsError(
        "internal",
        `Failed to generate story: ${error.message || "Unknown error"}`
      );
    }
  }
);
