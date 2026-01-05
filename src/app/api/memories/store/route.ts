
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_HOST = process.env.PINECONE_HOST || "https://yudi-memories-e3sadus.svc.aped-4627-b74a.pinecone.io";

// Reuse embedding function (should be in a shared lib really)
async function getEmbeddings(text: string) {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text }] }
            })
        });
        const data = await response.json();
        return data.embedding?.values || null;
    } catch (e) {
        console.error("Embedding error:", e);
        return null;
    }
}

export async function POST(req: NextRequest) {
    if (!PINECONE_API_KEY) {
        console.warn("[Memory Store] PINECONE_API_KEY not configured");
        return NextResponse.json({ success: false, error: "Pinecone API Key missing" }, { status: 503 });
    }

    try {
        const body = await req.json();
        const { user_id, user_message, yudi_response, emotion } = body;

        if (!user_id || !user_message || !yudi_response) {
            console.warn("[Memory Store] Missing required fields:", { user_id: !!user_id, user_message: !!user_message, yudi_response: !!yudi_response });
            return NextResponse.json({ success: false, error: "user_id, user_message, and yudi_response are required" }, { status: 400 });
        }

        console.log(`[Memory Store] Storing memory for user_id: ${user_id}, message: "${user_message.substring(0, 50)}..."`);

        // Create embedding for the USER message (that's what we search by)
        const vector = await getEmbeddings(user_message);

        if (!vector) {
            console.error("[Memory Store] Failed to generate embedding");
            return NextResponse.json({ success: false, error: "Failed to generate embedding" }, { status: 500 });
        }

        console.log(`[Memory Store] Generated embedding vector of length: ${vector.length}`);

        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const pineconeResponse = await fetch(`${PINECONE_HOST}/vectors/upsert`, {
            method: 'POST',
            headers: {
                'Api-Key': PINECONE_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vectors: [{
                    id: uniqueId,
                    values: vector,
                    metadata: {
                        user_id,
                        user_message,
                        yudi_response,
                        emotion,
                        timestamp: Date.now(),
                        datetime: new Date().toISOString()
                    }
                }]
            })
        });

        if (!pineconeResponse.ok) {
            const errorText = await pineconeResponse.text().catch(() => 'Unknown error');
            console.error(`[Memory Store] Pinecone upsert failed: ${pineconeResponse.status} - ${errorText}`);
            return NextResponse.json({ success: false, error: `Pinecone error: ${errorText}` }, { status: 500 });
        }

        console.log(`[Memory Store] ✅ Successfully stored memory with id: ${uniqueId}`);
        return NextResponse.json({ success: true, memory_id: uniqueId });

    } catch (error) {
        console.error("[Memory Store] Error storing memory:", error instanceof Error ? error.message : error);
        return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
    }
}
