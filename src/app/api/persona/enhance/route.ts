import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime so process.env works

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 },
      );
    }

    // ─── 1) Read & validate API key ────────────────────────────────────────────
    const rawKey = process.env.GEMINI_API_KEY ?? "";
    const apiKey = rawKey.trim(); // only trim; don't mutate chars

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured or is empty");
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Please add it to your .env file.",
        },
        { status: 500 },
      );
    }

    console.log("Persona Enhance Route: GEMINI_API_KEY present:", !!apiKey);

    // ─── 2) Prompt ─────────────────────────────────────────────────────────────
    const prompt = `Based on this basic persona information, generate detailed characteristics:

Name: ${name}
Basic Description: ${description}

Please provide a JSON response with these fields:
1. age: estimated age (number between 18-80)
2. gender: inferred gender (male/female/neutral)
3. category: role type (Therapist/Friend/Tutor/Coach/Mentor/Companion/Expert/Assistant/Entertainer/Other)
4. personality: detailed personality traits (2-3 sentences)
5. enhancedDescription: comprehensive description (3-4 sentences about background, expertise, approach)
6. tags: array of 3-5 relevant tags
7. language: appropriate language code (default en-US unless context suggests otherwise)

Return ONLY valid JSON, no markdown or explanation.`;

    // ─── 3) Choose model ───────────────────────────────────────────────────────
    // .env -> GEMINI_MODEL=gemini-2.5-flash (optional)
    const rawModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const modelName = rawModel.trim();

    console.log(`Calling Gemini API with model: ${modelName}`);

    // ─── 4) Call Gemini REST API ───────────────────────────────────────────────
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user", // 👈 add role (recommended by API)
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    console.log("Gemini response status:", response.status, "ok:", response.ok);

    // ─── 5) Handle non-200 responses ───────────────────────────────────────────
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let errorMessage = "Unknown error";

      try {
        const errorJson = JSON.parse(text);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        if (text) errorMessage = text;
      }

      console.error("Gemini API error raw:", text || errorMessage);

      if (
        typeof errorMessage === "string" &&
        errorMessage.toLowerCase().includes("api key")
      ) {
        errorMessage =
          "Invalid API key. Please check your GEMINI_API_KEY in .env file and ensure it is correct. You may need to restart your development server after updating .env.";
      }

      return NextResponse.json(
        { error: `Gemini API error: ${errorMessage}` },
        { status: response.status || 500 },
      );
    }

    // ─── 6) Parse success payload ──────────────────────────────────────────────
    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error(
        "No generated text from Gemini:",
        JSON.stringify(data, null, 2),
      );
      return NextResponse.json(
        { error: "No response from Gemini API" },
        { status: 500 },
      );
    }

    let enhancedData: any;
    try {
      let jsonText = generatedText.trim();
      jsonText = jsonText
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      enhancedData = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse AI response text:", generatedText);
      return NextResponse.json(
        { error: "AI generated invalid response format" },
        { status: 500 },
      );
    }

    // ─── 7) Normalize and return result ────────────────────────────────────────
    const result = {
      age:
        typeof enhancedData.age === "number" &&
          enhancedData.age >= 18 &&
          enhancedData.age <= 80
          ? enhancedData.age
          : 25,
      gender: enhancedData.gender || "neutral",
      category: enhancedData.category || "Other",
      personality: enhancedData.personality || description,
      enhancedDescription: enhancedData.enhancedDescription || description,
      tags: Array.isArray(enhancedData.tags) ? enhancedData.tags : [],
      language: enhancedData.language || "en-US",
    };

    console.log("Enhanced persona data:", result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error enhancing persona:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to enhance persona",
      },
      { status: 500 },
    );
  }
}
