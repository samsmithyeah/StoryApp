import Constants from "expo-constants";

export const OPENAI_API_KEY =
  Constants.expoConfig?.extra?.openaiApiKey ||
  process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("OpenAI API key not found in environment variables");
}

export const OPENAI_CONFIG = {
  apiKey: OPENAI_API_KEY,
  models: {
    text: "gpt-4o",
    image: "dall-e-3",
  },
  endpoints: {
    chat: "https://api.openai.com/v1/chat/completions",
    images: "https://api.openai.com/v1/images/generations",
  },
};
