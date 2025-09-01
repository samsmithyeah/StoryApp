import { defineSecret } from "firebase-functions/params";
import { logger } from "./logger";

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
  private imageModel = "gemini-2.5-flash-image-preview";
  private textModel = "gemini-2.5-pro";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.9,
    thinkingBudget?: number
  ): Promise<string> {
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
        ...(thinkingBudget !== undefined && {
          thinking_config: {
            thinking_budget: thinkingBudget,
          },
        }),
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    };

    logger.debug("GeminiClient sending request", {
      textModel: this.textModel,
      request,
    });

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
      logger.error("GeminiClient text API error", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(
        `Gemini text API request failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = (await response.json()) as GeminiResponse;

    // Enhanced logging to debug the "No candidates" issue
    logger.debug("GeminiClient text response received", {
      candidatesCount: responseData.candidates?.length || 0,
      responseData,
    });

    // Check for content blocked by safety filters
    if ((responseData as any).promptFeedback?.blockReason) {
      const blockReason = (responseData as any).promptFeedback.blockReason;
      logger.error("GeminiClient content blocked by safety filter", {
        blockReason,
      });
      throw new Error(
        `Gemini blocked content due to safety filter: ${blockReason}`
      );
    }

    const candidate = responseData.candidates?.[0];
    if (!candidate) {
      logger.error("GeminiClient no candidates found in response", {
        hasCandidates: !!responseData.candidates,
        candidatesLength: responseData.candidates?.length,
        responseKeys: Object.keys(responseData),
        fullResponse: responseData,
      });
      throw new Error("No candidates in Gemini text response");
    }

    const textPart = candidate.content.parts.find((part) => part.text);
    if (!textPart || !textPart.text) {
      throw new Error("No text data in Gemini response");
    }

    return textPart.text;
  }

  async generateImage(prompt: string): Promise<string> {
    logger.debug("GeminiClient generating image", {
      promptPreview: prompt.substring(0, 100),
      imageModel: this.imageModel,
      promptLength: prompt.length,
    });

    // Simplified request format based on official API docs
    const request = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    logger.debug("GeminiClient image request", {
      url: `${this.baseUrl}/models/${this.imageModel}:generateContent`,
      requestBody: request,
    });

    const fetchStartTime = Date.now();

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.imageModel}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey, // Use header instead of URL param
          },
          body: JSON.stringify(request),
        }
      );

      const fetchDuration = Date.now() - fetchStartTime;
      logger.debug("GeminiClient fetch completed", {
        duration: fetchDuration,
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("GeminiClient image API error", {
          status: response.status,
          statusText: response.statusText,
          errorText,
          duration: fetchDuration,
          url: `${this.baseUrl}/models/${this.imageModel}:generateContent`,
        });
        throw new Error(
          `Gemini image API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const responseData = (await response.json()) as GeminiResponse;
      logger.debug("GeminiClient image response received", {
        candidatesCount: responseData.candidates?.length || 0,
        duration: fetchDuration,
        responseKeys: Object.keys(responseData),
      });

      // Log the full response structure for debugging
      if (responseData.candidates && responseData.candidates.length > 0) {
        const candidate = responseData.candidates[0];
        logger.debug("GeminiClient candidate details", {
          partsCount: candidate.content.parts.length,
          partTypes: candidate.content.parts.map((part) =>
            part.text ? "text" : part.inlineData ? "inlineData" : "unknown"
          ),
        });
      } else {
        logger.error("GeminiClient no candidates in response", {
          fullResponse: responseData,
        });
      }

      // Find the image in the response
      const candidate = responseData.candidates?.[0];
      if (!candidate) {
        throw new Error("No candidates in Gemini image response");
      }

      const imagePart = candidate.content.parts.find((part) => part.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        logger.error("GeminiClient no image data found", {
          partsCount: candidate.content.parts.length,
          partTypes: candidate.content.parts.map((part) =>
            part.text ? "text" : part.inlineData ? "inlineData" : "unknown"
          ),
          textParts: candidate.content.parts
            .filter((part) => part.text)
            .map((part) => part.text?.substring(0, 100)),
        });
        throw new Error("No image data in Gemini response");
      }

      // Convert base64 to data URL
      const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      logger.debug("GeminiClient image generated successfully", {
        mimeType: imagePart.inlineData.mimeType,
        dataSizeKB: Math.round(imagePart.inlineData.data.length / 1024),
        totalDuration: fetchDuration,
      });

      return imageDataUrl;
    } catch (error: any) {
      const fetchDuration = Date.now() - fetchStartTime;
      logger.error("GeminiClient image generation error", {
        error: error.message,
        duration: fetchDuration,
        errorType: error.constructor.name,
        stack: error.stack,
      });
      throw error;
    }
  }

  async editImage(
    prompt: string,
    inputImageBase64: string,
    mimeType: string = "image/png"
  ): Promise<string> {
    logger.debug("GeminiClient editing image", {
      promptPreview: prompt.substring(0, 100),
    });

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
      logger.error("GeminiClient API error", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(
        `Gemini API request failed: ${response.status} ${response.statusText}`
      );
    }

    const responseData = (await response.json()) as GeminiResponse;
    logger.debug("GeminiClient edit response received", {
      candidatesCount: responseData.candidates?.length || 0,
    });

    // Find the image in the response
    const candidate = responseData.candidates?.[0];
    if (!candidate) {
      logger.error("GeminiClient no candidates in edit response", {
        fullResponse: responseData,
      });
      throw new Error("No candidates in Gemini edit response");
    }

    // Check if candidate has content property
    if (!candidate.content) {
      logger.error("GeminiClient edit candidate has no content", {
        candidate,
        candidateKeys: Object.keys(candidate),
      });
      throw new Error("No content in Gemini edit candidate");
    }

    // Check if content has parts property
    if (!candidate.content.parts) {
      logger.error("GeminiClient edit candidate content has no parts", {
        content: candidate.content,
        contentKeys: Object.keys(candidate.content),
      });
      throw new Error("No parts in Gemini edit candidate content");
    }

    const imagePart = candidate.content.parts.find((part) => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      logger.error("GeminiClient edit no image data found", {
        partsCount: candidate.content.parts.length,
        partTypes: candidate.content.parts.map((part) =>
          part.text ? "text" : part.inlineData ? "inlineData" : "unknown"
        ),
        textParts: candidate.content.parts
          .filter((part) => part.text)
          .map((part) => part.text?.substring(0, 100)),
      });
      throw new Error("No image data in Gemini edit response");
    }

    // Convert base64 to data URL
    const imageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    logger.debug("GeminiClient image edited successfully", {
      mimeType: imagePart.inlineData.mimeType,
    });

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
