
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
        return NextResponse.json({ success: false, error: "Pinecone API Key missing" }, { status: 503 });
    }

    try {
        const body = await req.json();
        const { user_id, user_message, yudi_response, emotion } = body;

        // Create embedding for the USER message (that's what we search by)
        const vector = await getEmbeddings(user_message);

        if (!vector) {
            return NextResponse.json({ success: false, error: "Failed to generate embedding" }, { status: 500 });
        }

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
            const errorText = await pineconeResponse.text();
            console.error("Pinecone Store Error:", errorText);
            return NextResponse.json({ success: false, error: `Pinecone error: ${errorText}` }, { status: 500 });
        }

        return NextResponse.json({ success: true, memory_id: uniqueId });

    } catch (error) {
        console.error("Memory store error:", error);
        return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
    }
}
