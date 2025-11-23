import { GoogleGenAI } from "@google/genai";

/**
 * Initialize GoogleGenAI client
 * Uses Gemini API for both development and production (simpler auth)
 */
export function getVertexAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // This uses your API key directly, which works perfectly in any environment.
  return new GoogleGenAI({
    apiKey: apiKey,
  });
}
