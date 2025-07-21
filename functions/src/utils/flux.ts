import { defineSecret } from "firebase-functions/params";

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
    console.log(`[FluxClient] Starting image generation with prompt: ${request.prompt.substring(0, 100)}...`);
    console.log(`[FluxClient] Request params: aspect_ratio=${request.aspect_ratio}, has_input_image=${!!request.input_image}`);
    
    // Start the image generation task
    const createResponse = await this.createImage(request);
    console.log(`[FluxClient] Create response: id=${createResponse.id}, polling_url=${createResponse.polling_url}`);
    
    if (!createResponse.polling_url) {
      throw new Error(`FLUX API did not return a polling URL`);
    }

    const startTime = Date.now();
    let pollCount = 0;

    // Poll until completion or timeout
    while (Date.now() - startTime < maxPollingTimeMs) {
      pollCount++;
      console.log(`[FluxClient] Polling attempt ${pollCount} for task ${createResponse.id}`);
      const pollResponse = await this.pollTask(createResponse.polling_url);
      console.log(`[FluxClient] Poll response: status=${pollResponse.status}`);

      if (pollResponse.status === "Error") {
        console.error(`[FluxClient] Image generation failed: ${pollResponse.error}`);
        throw new Error(`FLUX image generation failed: ${pollResponse.error}`);
      }

      if (pollResponse.status === "Ready" && pollResponse.result?.sample) {
        console.log(`[FluxClient] Image ready after ${pollCount} polls (${Date.now() - startTime}ms): ${pollResponse.result.sample.substring(0, 50)}...`);
        return pollResponse.result.sample;
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
    }

    console.error(`[FluxClient] Image generation timed out after ${maxPollingTimeMs}ms`);
    throw new Error(`FLUX image generation timed out after ${maxPollingTimeMs}ms`);
  }
}

export function getFluxClient(): FluxClient {
  const apiKey = fluxApiKey.value();
  if (!apiKey) {
    throw new Error("FLUX_API_KEY secret is not configured");
  }
  return new FluxClient(apiKey);
}