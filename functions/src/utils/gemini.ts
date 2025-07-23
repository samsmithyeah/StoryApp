import { defineSecret } from "firebase-functions/params";

export const geminiApiKey = defineSecret("GEMINI_API_KEY");

interface GeminiGenerateRequest {
  contents: {
    role?: "user";
    parts: {
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string; // base64 encoded image
      };
    }[];
  }[];
  generationConfig: {
    responseModalities: string[];
    temperature?: number;
  };
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string; // base64 encoded image
        };
      }[];
    };
  }[];
}

export class GeminiClient {
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private imageModel = "gemini-2.0-flash-preview-image-generation";
  private textModel = "gemini-2.5-pro";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.9
  ): Promise<string> {
    console.log(
      `[GeminiClient] Generating text with prompt: ${userPrompt.substring(0, 100)}...`
    );

    const request = {
      contents: [
        {
          role: "user" as const,
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
      generationConfig: {
        temperature,
      },
    };

    const response = await fetch(
      `${this.baseUrl}/models/${this.textModel}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[GeminiClient] Text API error: ${response.status} ${response.statusText}: ${errorText}`
      );
      throw new Error(
        `Gemini text API request failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = (await response.json()) as GeminiResponse;
    console.log(
      `[GeminiClient] Text response received with ${responseData.candidates?.length || 0} candidates`
    );

    const candidate = responseData.candidates?.[0];
    if (!candidate) {
      throw new Error("No candidates in Gemini text response");
    }

    const textPart = candidate.content.parts.find((part) => part.text);
    if (!textPart || !textPart.text) {
      throw new Error("No text data in Gemini response");
    }

    return textPart.text;
  }

  async generateImage(prompt: string): Promise<string> {
    console.log(
      `[GeminiClient] Generating image with prompt: ${prompt.substring(0, 100)}...`
    );

    const request: GeminiGenerateRequest = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        temperature: 0.9,
      },
    };

    const response = await fetch(
      `${this.baseUrl}/models/${this.imageModel}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[GeminiClient] API error: ${response.status} ${response.statusText}: ${errorText}`
      );
      throw new Error(
        `Gemini API request failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = (await response.json()) as GeminiResponse;
    console.log(
      `[GeminiClient] Response received with ${responseData.candidates?.length || 0} candidates`
    );

    // Find the image in the response
    const candidate = responseData.candidates?.[0];
    if (!candidate) {
      throw new Error("No candidates in Gemini response");
    }

    const imagePart = candidate.content.parts.find((part) => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      throw new Error("No image data in Gemini response");
    }

    // Convert base64 to data URL
    const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    console.log(
      `[GeminiClient] Image generated successfully, mime type: ${imagePart.inlineData.mimeType}`
    );

    return imageDataUrl;
  }

  async editImage(
    prompt: string,
    inputImageBase64: string,
    mimeType: string = "image/png"
  ): Promise<string> {
    console.log(
      `[GeminiClient] Editing image with prompt: ${prompt.substring(0, 100)}...`
    );

    const request: GeminiGenerateRequest = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: inputImageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        temperature: 0.9,
      },
    };

    const response = await fetch(
      `${this.baseUrl}/models/${this.imageModel}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[GeminiClient] API error: ${response.status} ${response.statusText}: ${errorText}`
      );
      throw new Error(
        `Gemini API request failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = (await response.json()) as GeminiResponse;
    console.log(
      `[GeminiClient] Edit response received with ${responseData.candidates?.length || 0} candidates`
    );

    // Find the image in the response
    const candidate = responseData.candidates?.[0];
    if (!candidate) {
      throw new Error("No candidates in Gemini response");
    }

    const imagePart = candidate.content.parts.find((part) => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      throw new Error("No image data in Gemini response");
    }

    // Convert base64 to data URL
    const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    console.log(
      `[GeminiClient] Image edited successfully, mime type: ${imagePart.inlineData.mimeType}`
    );

    return imageDataUrl;
  }
}

export function getGeminiClient(): GeminiClient {
  const apiKey = geminiApiKey.value();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY secret is not configured");
  }
  return new GeminiClient(apiKey);
}
