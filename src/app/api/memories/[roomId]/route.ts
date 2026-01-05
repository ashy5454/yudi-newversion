
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
    const topK = Math.min(parseInt(searchParams.get('top_k') || '5', 10), 20); // Max 20 for safety

    if (!PINECONE_API_KEY) {
        console.warn("[Memory API] PINECONE_API_KEY not configured - returning empty memories");
        return NextResponse.json({ memories: [] }, { status: 200 });
    }

    const PINECONE_HOST = process.env.PINECONE_HOST || "https://yudi-memories-e3sadus.svc.aped-4627-b74a.pinecone.io";

    if (!query || query.trim().length === 0) {
        console.warn("[Memory API] Empty query provided - returning empty memories");
        return NextResponse.json({ memories: [] }, { status: 200 });
    }

    try {
        console.log(`[Memory API] Retrieving memories for roomId: ${roomId}, query: "${query.substring(0, 50)}..."`);
        
        const vector = await getEmbeddings(query);
        if (!vector) {
            console.warn("[Memory API] Failed to generate embedding - returning empty memories");
            return NextResponse.json({ memories: [] }, { status: 200 });
        }

        console.log(`[Memory API] Generated embedding vector of length: ${vector.length}`);

        const pineconeResponse = await fetch(`${PINECONE_HOST}/query`, {
            method: 'POST',
            headers: {
                'Api-Key': PINECONE_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vector,
                topK: topK,
                includeMetadata: true,
                filter: { user_id: { "$eq": roomId } }
            })
        });

        if (!pineconeResponse.ok) {
            const errorText = await pineconeResponse.text().catch(() => 'Unknown error');
            console.error(`[Memory API] Pinecone query failed: ${pineconeResponse.status} - ${errorText}`);
            return NextResponse.json({ memories: [] }, { status: 200 }); // Return empty instead of error
        }

        const data = await pineconeResponse.json();
        const memories = data.matches?.map((m: any) => m.metadata) || [];
        
        console.log(`[Memory API] ✅ Retrieved ${memories.length} memories from Pinecone for roomId: ${roomId}`);
        
        return NextResponse.json({ memories });

    } catch (error) {
        console.error("[Memory API] Error retrieving memories:", error instanceof Error ? error.message : error);
        return NextResponse.json({ memories: [] }, { status: 200 }); // Return empty instead of error
    }
}
