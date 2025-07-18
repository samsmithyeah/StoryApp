import { defineSecret } from "firebase-functions/params";
import { HttpsError } from "firebase-functions/v2/https";
import OpenAI from "openai";

// Define secret parameter
export const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Initialize OpenAI client lazily
export const getOpenAIClient = () => {
  const apiKey = openaiApiKey.value();
  if (!apiKey) {
    throw new HttpsError("internal", "OpenAI API key not configured");
  }
  return new OpenAI({ apiKey });
};