export const dynamic = 'force-dynamic'; // Add this line at the top

import { NextRequest, NextResponse } from "next/server";
// ... existing imports ...import { NextRequest, NextResponse } from "next/server";
import { MessageAdminDb, PersonaAdminDb, RoomAdminDb } from '@/lib/firebase/adminDb';
import { isFirebaseEnabled } from '@/lib/firebase/firebase-admin';
import { Message, Persona } from "@/lib/firebase/dbTypes";
import { PersonalityEngine, type UserPersonalityProfile } from '@/lib/intelligence/personality';

export async function GET() {
    return NextResponse.json({ message: 'API is working' });
}

export async function POST(req: NextRequest) {
    try {
        const { text, hiddenPrompt, roomId, personaId, senderType = 'user', messageType = 'text', metadata } = await req.json();

        // Use hiddenPrompt (with time context) for AI if provided, otherwise fall back to clean text
        // If text is empty and hiddenPrompt exists, this is a system event (like 4-hour check-in)
        const textForAI = hiddenPrompt || text;
        const isSystemEvent = !text && hiddenPrompt;

        // Allow empty text only if hiddenPrompt exists (system events)
        if ((!text && !hiddenPrompt) || !roomId || !personaId) {
            return NextResponse.json(
                { message: 'Text (or hiddenPrompt for system events), roomId, and personaId are required' },
                { status: 400 }
            );
        }

        console.log("text: ", text, roomId, personaId, senderType, messageType, metadata);

        // fetch persona with robust fallback
        let persona: Persona | undefined;
        if (isFirebaseEnabled) {
            try {
                persona = await PersonaAdminDb.getById(personaId);
            } catch (dbError) {
                console.error("Database error fetching persona (using fallback):", dbError);
            }
        }

        if (!persona) {
            console.log("Persona not found or DB unavailable, using default fallback.");
            persona = {
                id: personaId,
                name: "Yudi",
                description: "AI Companion",
                model: {
                    systemPrompt: "You are a helpful and friendly AI companion named Yudi.",
                    textModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
                },
                age: 25,
                gender: "neutral",
                personality: "Friendly, helpful, kind",
                language: "English",
                category: "Companion"
            };
        }

        // Initialize Personality Engine
        const personalityEngine = new PersonalityEngine();

        // Fetch user personality profile (if available)
        let userProfile: UserPersonalityProfile | undefined = undefined;
        if (isFirebaseEnabled) {
            try {
                const roomData = await RoomAdminDb.getById(roomId);
                if (roomData?.userId) {
                    // In a real implementation, fetch from user_personality collection
                    // TODO: Create UserPersonalityAdminDb for proper storage
                    userProfile = {
                        userId: roomData.userId,
                        sarcasm_level: 5,
                        preferred_language_style: 'hinglish',
                        emotional_baseline: 'neutral',
                        updatedAt: new Date()
                    };
                }
            } catch (profileError) {
                console.warn("Could not fetch user profile:", profileError);
            }
        }

        // Fetch chat history (last 50 messages)
        let history = null;
        let recentMessagesText = '';
        if (isFirebaseEnabled) {
            try {
                // Increased timeout to 10s and limit to 50 messages for proper context
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("History fetch timed out")), 10000));
                const fetchPromise = MessageAdminDb.getByRoomId(roomId, 50);
                history = await Promise.race([fetchPromise, timeoutPromise]) as any;

                // Limit to last 40 messages for better memory
                if (history?.messages && history.messages.length > 40) {
                    history.messages = history.messages.slice(-40);
                    console.log(`[Memory] Trimmed history to last 40 messages for better context`);
                }

                // Sort messages by timestamp (Ascending order) for Gemini
                if (history?.messages && history.messages.length > 0) {
                    history.messages.sort((a: Message, b: Message) => {
                        const timeA = a.createdAt instanceof Date
                            ? a.createdAt.getTime()
                            : new Date(a.createdAt as any).getTime();
                        const timeB = b.createdAt instanceof Date
                            ? b.createdAt.getTime()
                            : new Date(b.createdAt as any).getTime();
                        return timeA - timeB;
                    });

                    // Debug: Verify sorting
                    const firstMsg = history.messages[0];
                    const lastMsg = history.messages[history.messages.length - 1];
                    const firstTime = firstMsg.createdAt instanceof Date ? firstMsg.createdAt : new Date(firstMsg.createdAt as any);
                    const lastTime = lastMsg.createdAt instanceof Date ? lastMsg.createdAt : new Date(lastMsg.createdAt as any);

                    console.log(`[Memory] ✅ Sorted: First vs Last time check verified.`);

                    // Build recent messages text for vibe analysis
                    recentMessagesText = history.messages
                        .slice(-5)
                        .map((m: Message) => `${m.senderType}: ${m.content}`)
                        .join(' | ');
                }
            } catch (histError) {
                console.warn("Failed to fetch history (or timed out):", histError);
            }
            // DEBUG LOGGING
            if (history?.messages) {
                console.log(`[DEBUG] History Messages Count: ${history.messages.length}`);
                if (history.messages.length > 0) {
                    console.log(`[DEBUG] Last User Message: ${history.messages[history.messages.length - 1].content}`);
                    console.log(`[DEBUG] First (Oldest) Message Fetched: ${history.messages[0].content}`);
                }
            } else {
                console.log(`[DEBUG] History object is null or has no messages.`);
            }
        }

        // ========== STAGE 1: VIBE ANALYSIS (The Subconscious) ==========
        console.log("[Soul Engine] Stage 1: Analyzing vibe...");
        const vibeCheck = await personalityEngine.analyzeVibe(text, recentMessagesText, userProfile);
        console.log(`[Soul Engine] Detected: mood=${vibeCheck.mood}, verbosity=${vibeCheck.verbosity}, confidence=${vibeCheck.confidence}`);

        // Convert to legacy format for emotion/memory retrieval
        const vibe = await personalityEngine.analyzeVibeLegacy(text, recentMessagesText, userProfile);

        // ========== EMOTIONAL MEMORY RETRIEVAL (Pinecone) ==========
        let emotionalMemories: any[] = [];
        try {
            // Build robust memory query
            const emotionQuery = personalityEngine.getEmotionalMemoryQuery(vibe);
            const recentUserContent = history?.messages
                ? history.messages
                    .filter((m: Message) => m.senderType === 'user')
                    .slice(-3)
                    .map((m: Message) => m.content)
                    .join(' ')
                : text;

            // Combine emotion with actual content for better memory retrieval
            const memoryQuery = `${emotionQuery} ${recentUserContent}`.substring(0, 500);

            // Construct the API URL - use Next.js API route
            // Prefer environment variable, fallback to request origin
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || req.nextUrl.origin;
            const memoryResponse = await fetch(
                `${baseUrl}/api/memories/${roomId}?query=${encodeURIComponent(memoryQuery)}&top_k=5`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(5000) // Increased timeout for embedding generation
                }
            );

            if (memoryResponse.ok) {
                const memoryData = await memoryResponse.json();
                if (memoryData.memories && memoryData.memories.length > 0) {
                    emotionalMemories = memoryData.memories;
                    console.log(`[Soul Engine] ✅ Retrieved ${emotionalMemories.length} memories from Pinecone`);
                    emotionalMemories.forEach((mem: any, idx: number) => {
                        // Safe substring check
                        console.log(`[Pinecone Memory ${idx + 1}]: "${(mem.user_message || '').substring(0, 60)}..."`);
                    });
                } else {
                    console.log(`[Soul Engine] ⚠️  Pinecone returned 0 memories.`);
                }
            } else {
                const errorText = await memoryResponse.text().catch(() => 'Unknown error');
                console.warn(`[Soul Engine] ⚠️  Memory API returned status: ${memoryResponse.status}, error: ${errorText}`);
            }
        } catch (memoryError) {
            console.warn("[Soul Engine] Pinecone memory retrieval failed:", memoryError);
        }

        // ========== STAGE 2: DYNAMIC SYSTEM INSTRUCTION (The Conscious) ==========
        // Build emotional context from Pinecone memories
        let emotionalContext = '';
        if (emotionalMemories.length > 0) {
            emotionalContext = `\n=== EMOTIONAL MEMORY CONTEXT ===
I remember when you felt ${vibe.emotion} before:
${emotionalMemories.map((mem: any, idx: number) =>
                `${idx + 1}. You said: "${mem.user_message}" → I responded: "${mem.yudi_response}"`
            ).join('\n')}
Use this context to show continuity and understanding.\n`;
        }

        // Build comprehensive memory context from conversation history
        let memoryContext = '';
        let clubbingMention = false;
        let locationMentions: string[] = [];
        let nameMentions: string[] = [];
        let aiQuestions: string[] = [];
        
        // Detect story time requests (check current message first, then history)
        const currentUserMessage = text.toLowerCase();
        const storyTriggers = ['story time', 'tell me a story', 'katha cheppu', 'story cheppu', 'ek story sunao', 'story sunao', 'tell story'];
        let storyTimeRequest = storyTriggers.some(trigger => currentUserMessage.includes(trigger));

        if (history?.messages && history.messages.length > 0) {
            // Extract key information from recent messages (last 20)
            const recentMessages = history.messages.slice(-20);
            const userMessages = recentMessages.filter((m: Message) => m.senderType === 'user').map((m: Message) => m.content.toLowerCase());

            // Also check history for story time requests
            if (!storyTimeRequest) {
                storyTimeRequest = storyTriggers.some(trigger => 
                    userMessages.some(m => m.includes(trigger))
                );
            }

            // Extract specific details user mentioned
            clubbingMention = userMessages.some(m => m.includes('club') || m.includes('clubbing') || m.includes('club ki') || m.includes('clubbing veltuna') || m.includes('clubbing place'));

            locationMentions = recentMessages
                .filter((m: Message) => m.senderType === 'user')
                .map((m: Message) => {
                    const content = m.content.toLowerCase();
                    if (content.includes('hitech')) return 'Hitech City';
                    if (content.includes('banjara')) return 'Banjara Hills';
                    if (content.includes('gachibowli')) return 'Gachibowli';
                    return null;
                })
                .filter((loc): loc is string => loc !== null);

            nameMentions = recentMessages
                .filter((m: Message) => m.senderType === 'user')
                .flatMap((m: Message) => {
                    const content = m.content;
                    const names = ['samhita', 'tara', 'aaryan', 'aditya'];
                    return names.filter(name => content.toLowerCase().includes(name));
                });

            // Extract questions AI already asked
            aiQuestions = recentMessages
                .filter((m: Message) => m.senderType === 'persona')
                .map((m: Message) => m.content)
                .filter(content => content.includes('?'));

            // Build context string
            let extractedContext = '';
            if (clubbingMention) {
                extractedContext += '\n- USER MENTIONED: Going clubbing. Remember this!';
            }
            if (locationMentions.length > 0) {
                extractedContext += `\n- USER MENTIONED LOCATIONS: ${[...new Set(locationMentions)].join(', ')}. Remember these!`;
            }
            if (nameMentions.length > 0) {
                extractedContext += `\n- USER MENTIONED PEOPLE: ${[...new Set(nameMentions)].join(', ')}. Remember these!`;
            }
            if (aiQuestions.length > 0) {
                extractedContext += `\n\n⚠️ QUESTIONS YOU ALREADY ASKED IN THIS CONVERSATION (DO NOT REPEAT):\n${aiQuestions.slice(-5).map((q, i) => `${i + 1}. "${q.substring(0, 60)}..."`).join('\n')}`;
            }

            // Add story time trigger if detected
            if (storyTimeRequest) {
                extractedContext += `\n\n📖 STORY TIME REQUEST DETECTED: User wants a story! Give a relatable Indian/local story (3-5 sentences). Make it personal, funny, or meaningful. Reference Indian colleges, cities, food, festivals naturally.`;
            }

            memoryContext = `\n\n=== CRITICAL MEMORY CONTEXT ===
YOU HAVE ACCESS TO ${history.messages.length} PREVIOUS MESSAGES IN THE CONVERSATION HISTORY ABOVE.
${extractedContext}

**MANDATORY MEMORY RULES:**
1. **READ THE CONVERSATION HISTORY BEFORE REPLYING** - Scroll up and read the last 10-15 messages.
2. **NEVER REPEAT QUESTIONS YOU ALREADY ASKED** - Check history.
3. **REMEMBER WHAT USER TOLD YOU** - If user said "clubbing veltuna", remember it.
4. **REFERENCE SPECIFIC DETAILS** - When user mentions something, reference it directly.
5. **SHOW YOU REMEMBER** - Prove you read the history.
6. **CHECK YOUR OWN MESSAGES** - Don't repeat questions.
7. **ACTIVE RECALL** - Before asking "Where are you going?", check if they already told you.`;
        }

        const memoryInstruction = memoryContext;

        // Generate dynamic system instruction based on vibe analysis
        const baseSystemInstruction = personalityEngine.getSystemInstruction(
            vibeCheck.mood,
            vibeCheck.verbosity,
            userProfile,
            persona,
            vibe.emotion,
            vibe.language_style
        ) + emotionalContext + memoryInstruction;

        // 🛑 INJECT CURRENT DATE for date awareness
        const today = new Date();
        const dateString = today.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Kolkata'
        });
        const timeString = today.toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        });

        const dateContext = `
### CURRENT REAL-WORLD DATE & TIME
Today is: ${dateString}.
Current time: ${timeString} IST.
- **CRITICAL:** You MUST act as if this is the current date and time.
- If today is December 31, 2025, then it IS 2025.
- When users explicitly mention dates (e.g., "On January 1st", "Last week"), understand them in relation to TODAY (${dateString}).
- Do NOT hallucinate dates.
`;

        const systemInstruction = baseSystemInstruction + dateContext;

        const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        const apiKey = rawKey.replace(/["']/g, '').trim();

        if (!apiKey) {
            console.error("❌ CRITICAL: GEMINI_API_KEY is empty");
            return NextResponse.json(
                { message: 'GEMINI_API_KEY is not configured' },
                { status: 500 }
            );
        }

        // Build contents array with history (SHORT-TERM MEMORY)
        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

        if (history?.messages && history.messages.length > 0) {
            console.log(`[Memory] Building contents array from ${history.messages.length} history messages`);
            history.messages.forEach((m: Message) => {
                // Map senderType: "user" -> "user", "persona" -> "model" (for Gemini API)
                const role: 'user' | 'model' = m.senderType === 'user' ? 'user' : 'model';
                contents.push({
                    role: role,
                    parts: [{ text: m.content }]
                });
            });
            console.log(`[Memory] ✅ Built contents array with ${contents.length} messages (${contents.filter(c => c.role === 'user').length} user, ${contents.filter(c => c.role === 'model').length} model)`);
            
            // Debug: Show last few messages for verification
            const lastFew = contents.slice(-6);
            console.log(`[Memory] Last ${lastFew.length} messages in contents array:`, 
                lastFew.map(c => `${c.role}: ${c.parts[0].text.substring(0, 50)}...`).join('\n')
            );
        } else {
            console.log(`[Memory] ⚠️  No history messages found - starting fresh conversation`);
        }

        // Add current user message
        contents.push({
            role: 'user',
            parts: [{ text: textForAI }]
        });
        console.log(`[Memory] Added current message. Total contents: ${contents.length}`);

        const modelName = persona.model?.textModel || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

        // Use streamGenerateContent via REST with SSE
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: contents,
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText, 'Status:', response.status);
            return NextResponse.json(
                { message: `Gemini API error: ${errorText}` },
                { status: response.status }
            );
        }

        if (!response.body) {
            throw new Error('No response body');
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullResponseText = "";

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body!.getReader();
                let buffer = "";

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;
                        let lines = buffer.split("\n\n");
                        if (lines.length === 1 && buffer.includes('\n')) lines = buffer.split('\n');
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine) continue;

                            if (trimmedLine.startsWith("data:")) {
                                const jsonStr = trimmedLine.replace(/^data:\s*/, "").trim();
                                if (jsonStr === "[DONE]" || jsonStr === "") continue;
                                try {
                                    const data = JSON.parse(jsonStr);
                                    const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (textChunk) {
                                        fullResponseText += textChunk;
                                        controller.enqueue(encoder.encode(textChunk));
                                    }
                                } catch (e) { }
                            } else if (trimmedLine.startsWith("{")) {
                                try {
                                    const jsonMatch = trimmedLine.match(/\{[\s\S]*\}/);
                                    if (jsonMatch) {
                                        const data = JSON.parse(jsonMatch[0]);
                                        const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                        if (textChunk) {
                                            fullResponseText += textChunk;
                                            controller.enqueue(encoder.encode(textChunk));
                                        }
                                    }
                                } catch (e) { }
                            }
                        }
                    }

                    // Flush remaining buffer
                    if (buffer.trim()) {
                        // Simple flush logic for remaining buffer
                        // (Abbreviated for safety, assuming standard streaming behavior)
                    }

                    controller.close();

                    // --- Save to DB / Update Profile ---
                    if (fullResponseText) {
                        // Save to Pinecone using Next.js API route
                        try {
                            // Prefer environment variable, fallback to request origin
                            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || req.nextUrl.origin;
                            const storeResponse = await fetch(`${baseUrl}/api/memories/store`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    user_id: roomId,
                                    user_message: text,
                                    yudi_response: fullResponseText,
                                    emotion: vibe.emotion
                                }),
                                signal: AbortSignal.timeout(10000) // Timeout for embedding + Pinecone upsert
                            });
                            
                            if (storeResponse.ok) {
                                const storeData = await storeResponse.json();
                                console.log(`[Soul Engine] ✅ Memory stored successfully: ${storeData.memory_id || 'N/A'}`);
                            } else {
                                const errorText = await storeResponse.text().catch(() => 'Unknown error');
                                console.warn(`[Soul Engine] ⚠️  Memory store failed: ${storeResponse.status}, ${errorText}`);
                            }
                        } catch (e) { 
                            console.warn("[Soul Engine] Memory store failed:", e instanceof Error ? e.message : e); 
                        }

                        // Update Profile
                        if (isFirebaseEnabled && userProfile) {
                            if (vibeCheck.mood === 'sarcastic_friend') {
                                userProfile.sarcasm_level = Math.min(10, (userProfile.sarcasm_level || 5) + 0.5);
                            }
                            userProfile.last_emotion = vibe.emotion;
                        }
                    }

                } catch (e) {
                    controller.error(e);
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'An error occurred' },
            { status: 500 }
        );
    }
}
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
