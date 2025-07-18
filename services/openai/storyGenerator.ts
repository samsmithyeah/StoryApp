import { OPENAI_CONFIG } from "./config";

interface StoryGenerationParams {
  childName: string;
  childAge: number;
  theme: string;
  characters: string[];
  setting: string;
  mood: string;
  lesson?: string;
  preferences?: string;
}

interface GeneratedStory {
  title: string;
  pages: {
    text: string;
    imagePrompt: string;
  }[];
}

export const generateStory = async (
  params: StoryGenerationParams
): Promise<GeneratedStory> => {
  const {
    childName,
    childAge,
    theme,
    characters,
    setting,
    mood,
    lesson,
    preferences,
  } = params;

  const systemPrompt = `You are a creative children's story writer specializing in personalized bedtime stories. Create engaging, age-appropriate stories that are magical, gentle, and educational.`;

  const userPrompt = `Create a personalized bedtime story with the following details:
- Child's name: ${childName}
- Age: ${childAge} years old
- Theme: ${theme}
- Main characters: ${characters.join(", ")}
- Setting: ${setting}
- Mood: ${mood}
${lesson ? `- Lesson/moral: ${lesson}` : ""}
${preferences ? `- Child's interests: ${preferences}` : ""}

Requirements:
1. The story should be divided into 6-8 pages
2. Each page should be 2-3 sentences suitable for a ${childAge}-year-old
3. Include ${childName} as a character in the story
4. Make it ${mood} and engaging
5. End with a peaceful, sleep-inducing conclusion
6. For each page, include an image prompt description

Return the story in this JSON format:
{
  "title": "Story Title",
  "pages": [
    {
      "text": "Page text here",
      "imagePrompt": "A gentle, child-friendly illustration of [scene description]"
    }
  ]
}`;

  try {
    const response = await fetch(OPENAI_CONFIG.endpoints.chat, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.models.text,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const storyContent = JSON.parse(data.choices[0].message.content);

    return storyContent as GeneratedStory;
  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

export const generateStoryImage = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(OPENAI_CONFIG.endpoints.images, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.models.image,
        prompt: `${prompt}. Style: Soft, dreamy, child-friendly illustration with gentle colors and rounded shapes.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
