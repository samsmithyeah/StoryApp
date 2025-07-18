import { HttpsError, onCall } from "firebase-functions/v2/https";
import { openaiApiKey, getOpenAIClient } from "./utils/openai";
import { retryWithBackoff } from "./utils/retry";

export const generateThemeSuggestions = onCall(
  { secrets: [openaiApiKey] },
  async (request) => {
    console.log(
      "Function called with auth:",
      !!request.auth,
      "uid:",
      request.auth?.uid
    );

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { preferences } = request.data;

    if (
      !preferences ||
      !Array.isArray(preferences) ||
      preferences.length === 0
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Valid preferences array is required"
      );
    }

    try {
      const openai = getOpenAIClient();

      const preferencesText = preferences.join(", ");
      const prompt = `Based on these child preferences: "${preferencesText}", suggest 4 unique and creative bedtime story themes. Each theme should be:
- Age-appropriate for children 3-10
- Calming and suitable for bedtime
- Engaging and fun
- Related to the child's interests

Return a JSON object with a "themes" array containing exactly 4 themes. Each theme should have:
- id: a simple lowercase identifier (no spaces, use hyphens)
- name: a short, catchy theme name (2-3 words max)
- description: a brief description (8-12 words)
- icon: one of these icon names only: "airplane", "sparkles", "pawprint", "moon.stars", "drop.fill", "heart.fill", "moon.fill", "bolt.fill", "leaf.fill", "car.fill", "gamecontroller.fill", "book.fill", "music.note", "paintbrush.fill", "star.fill"

Example format:
{
  "themes": [
    {
      "id": "space-adventure",
      "name": "Space Adventure",
      "description": "Journey to distant planets and meet friendly aliens",
      "icon": "moon.stars"
    }
  ]
}`;

      const response = await retryWithBackoff(() =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a creative children's story consultant. Generate age-appropriate, calming bedtime story themes based on children's interests.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 500,
          response_format: { type: "json_object" },
        })
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch {
        console.error("Failed to parse OpenAI response:", content);
        throw new Error("Invalid JSON response from OpenAI");
      }

      // Extract themes array
      const themes = parsedResponse.themes;

      // Validate the response structure
      if (!themes || !Array.isArray(themes) || themes.length !== 4) {
        throw new Error("Invalid themes format");
      }

      // Validate each theme has required fields
      for (const theme of themes) {
        if (!theme.id || !theme.name || !theme.description || !theme.icon) {
          throw new Error("Theme missing required fields");
        }
      }

      return { success: true, themes };
    } catch (error: any) {
      console.error("Error generating theme suggestions:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        `Failed to generate theme suggestions: ${
          error.message || "Unknown error"
        }`
      );
    }
  }
);
