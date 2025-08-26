import { defineSecret } from "firebase-functions/params";
import { logger } from "./logger";

export const fluxApiKey = defineSecret("FLUX_API_KEY");

interface FluxCreateRequest {
  prompt: string;
  input_image?: string | null;
  seed?: number | null;
  aspect_ratio?: string | null;
  output_format?: "jpeg" | "png";
  webhook_url?: string | null;
  webhook_secret?: string | null;
  prompt_upsampling?: boolean;
  safety_tolerance?: number;
}

interface FluxCreateResponse {
  id: string;
  polling_url?: string;
  status?: string;
  webhook_url?: string;
}

interface FluxPollResponse {
  id: string;
  status: "Pending" | "Request Accepted" | "Ready" | "Error";
  result?: {
    sample: string; // signed URL to the generated image
  };
  error?: string;
}

export class FluxClient {
  private apiKey: string;
  private baseUrl = "https://api.bfl.ai";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createImage(request: FluxCreateRequest): Promise<FluxCreateResponse> {
    const response = await fetch(`${this.baseUrl}/v1/flux-kontext-pro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Key": this.apiKey,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(
        `FLUX API create request failed: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as FluxCreateResponse;
  }

  async pollTask(pollingUrl: string): Promise<FluxPollResponse> {
    const response = await fetch(pollingUrl, {
      method: "GET",
      headers: {
        "X-Key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `FLUX API poll request failed: ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as FluxPollResponse;
  }

  async generateImageWithPolling(
    request: FluxCreateRequest,
    maxPollingTimeMs: number = 120000, // 2 minutes default
    pollingIntervalMs: number = 2000 // 2 seconds default
  ): Promise<string> {
    logger.debug("FluxClient starting image generation", {
      promptPreview: request.prompt.substring(0, 100),
      aspectRatio: request.aspect_ratio,
      hasInputImage: !!request.input_image,
    });

    // Start the image generation task
    const createResponse = await this.createImage(request);
    logger.debug("FluxClient create response", {
      id: createResponse.id,
      pollingUrl: createResponse.polling_url,
    });

    if (!createResponse.polling_url) {
      throw new Error(`FLUX API did not return a polling URL`);
    }

    const startTime = Date.now();
    let pollCount = 0;

    // Poll until completion or timeout
    while (Date.now() - startTime < maxPollingTimeMs) {
      pollCount++;
      logger.debug("FluxClient polling attempt", {
        pollCount,
        taskId: createResponse.id,
      });
      const pollResponse = await this.pollTask(createResponse.polling_url);
      logger.debug("FluxClient poll response", { status: pollResponse.status });

      if (pollResponse.status === "Error") {
        logger.error("FluxClient image generation failed", {
          error: pollResponse.error,
        });
        throw new Error(`FLUX image generation failed: ${pollResponse.error}`);
      }

      if (pollResponse.status === "Ready" && pollResponse.result?.sample) {
        logger.info("FluxClient image ready", {
          pollCount,
          timeMs: Date.now() - startTime,
          samplePreview: pollResponse.result.sample.substring(0, 50),
        });
        return pollResponse.result.sample;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollingIntervalMs));
    }

    logger.error("FluxClient image generation timed out", {
      timeoutMs: maxPollingTimeMs,
    });
    throw new Error(
      `FLUX image generation timed out after ${maxPollingTimeMs}ms`
    );
  }
}

export function getFluxClient(): FluxClient {
  const apiKey = fluxApiKey.value();
  if (!apiKey) {
    throw new Error("FLUX_API_KEY secret is not configured");
  }
  return new FluxClient(apiKey);
}
