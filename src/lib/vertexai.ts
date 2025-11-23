import { GoogleGenAI } from "@google/genai";

/**
 * Initialize GoogleGenAI client
 * Uses Gemini API for both development and production (simpler auth)
 */
export function getVertexAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  console.log(`Initializing Gemini Client. Cleaned Key Length: ${apiKey.length}`);

  return new GoogleGenAI({
    apiKey: apiKey,
  });
}
