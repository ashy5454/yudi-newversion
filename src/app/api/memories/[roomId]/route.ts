
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/genai";

export const dynamic = 'force-dynamic';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
// You might need to add PINECONE_HOST to your .env / apphosting.yaml if it's not standard
// Typically: https://your-index-name-project-id.svc.gcp-starter.pinecone.io
// Only found PINECONE_API_KEY in configs so far considering standard index name or hardcoded url in main.py?
// Based on typical behavior, I will assume a standard host or try to find it. 
// WAIT: The Python backend might have had the host hardcoded. 
// I will start by just logging a warning that PINECONE_HOST is needed if I can't find it.
// Actually, looking at main.py would contain the host. 

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
    const roomId = (await params).roomId;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!PINECONE_API_KEY) {
        return NextResponse.json({ memories: [] }, { status: 200 });
    }

    // Ideally we need the Pinecone Host. Since I don't see it in env, I will try to infer or use a placeholder
    // User might need to check logs.
    const PINECONE_HOST = process.env.PINECONE_HOST || "https://yudi-memories-e3sadus.svc.aped-4627-b74a.pinecone.io";

    try {
        const vector = await getEmbeddings(query || "");
        if (!vector) return NextResponse.json({ memories: [] });

        const pineconeResponse = await fetch(`${PINECONE_HOST}/query`, {
            method: 'POST',
            headers: {
                'Api-Key': PINECONE_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vector,
                topK: 5,
                includeMetadata: true,
                filter: { user_id: { "$eq": roomId } }
            })
        });

        if (!pineconeResponse.ok) {
            console.error("Pinecone Error:", await pineconeResponse.text());
            return NextResponse.json({ memories: [] });
        }

        const data = await pineconeResponse.json();
        const memories = data.matches?.map((m: any) => m.metadata) || [];

        return NextResponse.json({ memories });

    } catch (error) {
        console.error("Memory fetch error:", error);
        return NextResponse.json({ memories: [] });
    }
}
