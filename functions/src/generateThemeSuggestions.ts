import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getOpenAIClient, openaiApiKey } from "./utils/openai";
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

    const { childrenInfo } = request.data;

    if (
      !childrenInfo ||
      !Array.isArray(childrenInfo) ||
      childrenInfo.length === 0
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Valid childrenInfo array is required"
      );
    }

    try {
      const openai = getOpenAIClient();

      const preferencesText = childrenInfo
        .map((child: any) => child.preferences)
        .join(", ");
      const ages = childrenInfo.map((child: any) => child.age);
      const ageRange =
        ages.length > 1
          ? `${Math.min(...ages)}-${Math.max(...ages)}`
          : ages[0]?.toString() || "5";

      const prompt = `Based on these child preferences: "${preferencesText}" for children aged ${ageRange}, suggest 4 unique and creative bedtime story themes.

Important: The themes should be RELATED to their interests but NOT the exact same words. Think about what emotions, concepts, or related topics their interests might connect to.

For example:
- If they like "sharks" → suggest themes like "monsters", "dinosaurs", or "ocean"
- If they like "princesses" → suggest themes like "magic", "castles", or "fairytales"
- If they like "trucks" → suggest themes like "construction", "vehicles", or "machines"

CRITICAL: Do NOT suggest any of these existing preset themes:
- adventure
- magical
- animals
- space
- underwater
- friendship
- bedtime
- superhero

Each theme should be:
- ONE WORD ONLY
- Age-appropriate specifically for ${ageRange} year olds
- Developmentally suitable (e.g., simpler concepts for younger kids, more complex for older)
- Calming and suitable for bedtime
- Engaging and fun for their age group
- Thematically related to their interests but not identical
- Completely different from the preset themes listed above

Return a JSON object with a "themes" array containing exactly 4 themes. Each theme should have:
- id: a simple lowercase identifier (the theme word itself)
- name: the theme (ONE WORD ONLY)
- description: a brief description (8-12 words)
- icon: one of these icon names only: "airplane", "sparkles", "pawprint", "moon.stars", "drop.fill", "heart.fill", "moon.fill", "bolt.fill", "leaf.fill", "car.fill", "gamecontroller.fill", "book.fill", "music.note", "paintbrush.fill", "star.fill"

Example format:
{
  "themes": [
    {
      "id": "giants",
      "name": "Giants",
      "description": "Meet friendly giants in a magical land",
      "icon": "sparkles"
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
                "You are a creative children's story consultant. Generate age-appropriate bedtime story themes based on children's interests.",
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
