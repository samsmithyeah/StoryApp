import { PubSub } from "@google-cloud/pubsub";
import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { StoryGenerationRequest, StoryPage } from "./types";
import { fluxApiKey, getFluxClient } from "./utils/flux";
import { geminiApiKey, getGeminiClient } from "./utils/gemini";
import { getOpenAIClient, openaiApiKey } from "./utils/openai";
import { retryWithBackoff } from "./utils/retry";

const pubsub = new PubSub();
const topicName = "generate-story-image";

export const generateStory = onCall(
  {
    secrets: [openaiApiKey, fluxApiKey, geminiApiKey],
    timeoutSeconds: 540, // 9 minutes timeout
    memory: "1GiB",
  },
  async (request) => {
    // 1. Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    const data = request.data as StoryGenerationRequest;

    try {
      // 2. Get user and children data from Firestore
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

      const pageCount =
        data.length === "short" ? 4 : data.length === "medium" ? 6 : 8;
      const childNames = selectedChildrenData
        .map((child: any) => child.childName)
        .join(" and ");
      const preferences = selectedChildrenData
        .map((child: any) => child.childPreferences)
        .filter((pref: string) => pref.trim())
        .join(", ");

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

      // 3. Generate story text with OpenAI
      const openai = getOpenAIClient();
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
1. The story should be divided into exactly ${pageCount} pages.
2. Each page should be 2-3 sentences suitable for a ${averageAge}-year-old.
3. ${
        data.childrenAsCharacters && childNames
          ? `Include ${childNames} as the main character(s).`
          : "Use a generic child character."
      }
4. Make it gentle and perfect for bedtime.
5. End with a peaceful, sleep-inducing conclusion.
6. ${
        data.enableIllustrations
          ? "For each page, include an image prompt description."
          : "No image prompts needed."
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
          ? '"imagePrompt": "A gentle, child-friendly illustration of [scene description]."'
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

      // 4. Create initial Firestore document
      const storyPages: StoryPage[] = storyContent.pages.map((page: any) => ({
        page: page.page,
        text: page.text,
        imageUrl: "", // All are placeholders initially
      }));

      const storyDocData = {
        userId,
        title: storyContent.title,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        storyContent: storyPages,
        coverImageUrl: "",
        storyConfiguration: data,
        imageGenerationStatus: data.enableIllustrations
          ? "generating"
          : "not_requested",
        imagesGenerated: 0,
        totalImages: data.enableIllustrations ? storyPages.length : 0,
      };
      const storyRef = await admin
        .firestore()
        .collection("stories")
        .add(storyDocData);
      const storyId = storyRef.id;

      // 5. Orchestrate Image Generation (if enabled)
      if (data.enableIllustrations) {
        console.log(
          `[Orchestrator] Starting image orchestration for story ${storyId}`
        );
        const imageProvider = data.imageProvider || "flux";
        const firstPagePrompt = `${storyContent.pages[0].imagePrompt}. Style: ${data.illustrationStyle}, gentle colors, child-friendly, perfect for a bedtime story.`;

        // KEY OPTIMIZATION: Generate the first image directly in the orchestrator
        let firstPageImageUrl: string;
        if (imageProvider === "flux") {
          const fluxClient = getFluxClient();
          firstPageImageUrl = await retryWithBackoff(() =>
            fluxClient.generateImageWithPolling({
              prompt: firstPagePrompt,
              aspect_ratio: "1:1",
            })
          );
        } else {
          // Gemini
          const geminiClient = getGeminiClient();
          firstPageImageUrl = await retryWithBackoff(() =>
            geminiClient.generateImage(firstPagePrompt)
          );
        }
        console.log(
          `[Orchestrator] Generated first page image URL/Data directly.`
        );

        // Publish jobs for ALL pages at once
        const publishPromises = storyContent.pages.map(
          (page: any, index: number) => {
            const isFirst = index === 0;
            const payload = {
              storyId,
              userId,
              pageIndex: index,
              imagePrompt: page.imagePrompt,
              imageProvider,
              // For the first page, pass its own pre-generated URL
              sourceImageUrl: isFirst ? firstPageImageUrl : undefined,
              // For subsequent pages, pass the reference image info for consistency
              consistencyInput: !isFirst
                ? {
                    imageUrl: firstPageImageUrl,
                    text: storyContent.pages[0].text,
                  }
                : undefined,
            };
            return pubsub.topic(topicName).publishMessage({ json: payload });
          }
        );

        await Promise.all(publishPromises);
        console.log(
          `[Orchestrator] Successfully published jobs for all ${storyContent.pages.length} pages.`
        );
      }

      // 6. Return to Client Immediately
      return {
        success: true,
        storyId,
        imageGenerationStatus: data.enableIllustrations
          ? "generating"
          : "not_requested",
      };
    } catch (error: any) {
      console.error("Error in generateStory orchestrator:", error);
      throw new HttpsError(
        "internal",
        `Failed to generate story: ${error.message || "Unknown error"}`
      );
    }
  }
);
