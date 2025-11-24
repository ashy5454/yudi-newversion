import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { name, description } = await req.json();

        if (!name || !description) {
            return NextResponse.json(
                { error: 'Name and description are required' },
                { status: 400 }
            );
        }

        // Get API key
        // The .replace() removes ALL whitespace characters (including \r\n embedded in the string)
        const rawKey = process.env.GEMINI_API_KEY || '';
        const apiKey = rawKey.replace(/\s/g, ''); // Remove ALL whitespace
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not configured' },
                { status: 500 }
            );
        }
        console.log("Persona Enhance Route Key Length:", apiKey.length); // Should be 39

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

        // Call Gemini API directly using REST
        console.log('Calling Gemini API with model: gemini-2.5-flash');
        console.log('API Key present:', !!apiKey, 'Length:', apiKey?.length);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            }
        );

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', JSON.stringify(errorData, null, 2));
            return NextResponse.json(
                { error: `Gemini API error: ${errorData.error?.message || 'Unknown error'}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return NextResponse.json(
                { error: 'No response from Gemini API' },
                { status: 500 }
            );
        }

        let enhancedData;
        try {
            // Clean the response text - remove markdown code blocks if present
            let jsonText = generatedText.trim();
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
            enhancedData = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("Failed to parse AI response:", generatedText);
            return NextResponse.json(
                { error: 'AI generated invalid response format' },
                { status: 500 }
            );
        }

        // Validate and provide defaults
        const result = {
            age: typeof enhancedData.age === 'number' ? enhancedData.age : 25,
            gender: enhancedData.gender || 'neutral',
            category: enhancedData.category || 'Other',
            personality: enhancedData.personality || description,
            enhancedDescription: enhancedData.enhancedDescription || description,
            tags: Array.isArray(enhancedData.tags) ? enhancedData.tags : [],
            language: enhancedData.language || 'en-US'
        };

        console.log("Enhanced persona data:", result);

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('Error enhancing persona:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to enhance persona' },
            { status: 500 }
        );
    }
}
