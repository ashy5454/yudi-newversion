import { NextRequest, NextResponse } from "next/server";
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
        const isSystemEvent = !text && hiddenPrompt; // System events have empty text but hiddenPrompt

        // Allow empty text only if hiddenPrompt exists (system events)
        if ((!text && !hiddenPrompt) || !roomId || !personaId) {
            return NextResponse.json(
                { message: 'Text (or hiddenPrompt for system events), roomId, and personaId are required' },
                { status: 400 }
            );
        }

        console.log("text: ", text, roomId, personaId, senderType, messageType, metadata);

        // fetch persona with robust fallback
        let persona;
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
                // Try to get user profile from Firestore
                // For now, we'll create a basic profile structure
                // TODO: Create UserPersonalityAdminDb for proper storage
                const roomData = await RoomAdminDb.getById(roomId);
                if (roomData?.userId) {
                    // In a real implementation, fetch from user_personality collection
                    // For now, we'll create a default profile
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

        // Fetch chat history (last 50 messages) - CRITICAL for memory!
        // Note: We fetch 50 but the API will use up to 30 for context (Gemini's optimal limit)
        let history = null;
        let recentMessagesText = '';
        if (isFirebaseEnabled) {
            try {
                // Increased timeout to 2s and limit to 50 messages for proper context
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("History fetch timed out")), 2000));
                const fetchPromise = MessageAdminDb.getByRoomId(roomId, 50); // Fetch 50, use last 30 for context
                history = await Promise.race([fetchPromise, timeoutPromise]) as any;
                
                // Limit to last 40 messages for better memory (increased from 30)
                // This ensures we remember details like "clubbing" even if mentioned 20+ messages ago
                if (history?.messages && history.messages.length > 40) {
                    history.messages = history.messages.slice(-40);
                    console.log(`[Memory] Trimmed history to last 40 messages for better context`);
                }

                // Sort messages by timestamp (oldest first, newest last) - CRITICAL for Gemini!
                // Firestore returns messages in DESC order (newest first), but Gemini needs ASC order (oldest first)
                if (history?.messages && history.messages.length > 0) {
                    // Firestore's getByRoomId uses orderBy('createdAt', 'desc'), so messages come newest-first
                    // We MUST sort them oldest-first for Gemini's context window
                    history.messages.sort((a: Message, b: Message) => {
                        const timeA = a.createdAt instanceof Date
                            ? a.createdAt.getTime()
                            : new Date(a.createdAt as any).getTime();
                        const timeB = b.createdAt instanceof Date
                            ? b.createdAt.getTime()
                            : new Date(b.createdAt as any).getTime();
                        return timeA - timeB; // Ascending order (oldest first) - REQUIRED for Gemini
                    });

                    // Debug: Verify sorting worked correctly
                    if (history.messages.length > 0) {
                        const firstMsg = history.messages[0];
                        const lastMsg = history.messages[history.messages.length - 1];
                        const firstTime = firstMsg.createdAt instanceof Date
                            ? firstMsg.createdAt.getTime()
                            : new Date(firstMsg.createdAt as any).getTime();
                        const lastTime = lastMsg.createdAt instanceof Date
                            ? lastMsg.createdAt.getTime()
                            : new Date(lastMsg.createdAt as any).getTime();
                        const firstContent = firstMsg.content.substring(0, 40);
                        const lastContent = lastMsg.content.substring(0, 40);
                        console.log(`[Memory] ✅ Sorted: First="${firstContent}" at ${new Date(firstTime).toLocaleTimeString()}, Last="${lastContent}" at ${new Date(lastTime).toLocaleTimeString()}`);
                    }

                    console.log(`[Memory] Fetched ${history.messages.length} messages from history`);
                    
                    // 🛑 DEBUG LOG: Check if history exists (Anti-Amnesia Debug)
                    console.log("📤 Sending to AI. History Length:", history.messages.length);
                    if (history.messages.length > 0) {
                        // Show the LAST 3 messages (most recent)
                        const lastThree = history.messages.slice(-3).map((m: Message) => `${m.senderType}: ${m.content.substring(0, 50)}`);
                        console.log(`📜 Last 3 Messages (most recent):`, lastThree);
                        // Also show first 2 to verify we have full history
                        const firstTwo = history.messages.slice(0, 2).map((m: Message) => `${m.senderType}: ${m.content.substring(0, 50)}`);
                        console.log(`📜 First 2 Messages (oldest):`, firstTwo);
                    } else {
                        console.warn("⚠️ WARNING: History Length is 0! AI will act like it's a new conversation.");
                    }

                    // Build recent messages text for vibe analysis
                    recentMessagesText = history.messages
                        .slice(-5) // Last 5 messages for vibe context
                        .map((m: Message) => `${m.senderType}: ${m.content}`)
                        .join(' | ');
                }
            } catch (histError) {
                console.warn("Failed to fetch history (or timed out):", histError);
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
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:5002';
            // Build better memory query - include emotion AND recent user message content
            const emotionQuery = personalityEngine.getEmotionalMemoryQuery(vibe);
            const recentUserContent = history?.messages 
                ? history.messages
                    .filter((m: Message) => m.senderType === 'user')
                    .slice(-3)
                    .map((m: Message) => m.content)
                    .join(' ')
                : text;
            
            // Combine emotion with actual content for better memory retrieval
            // Include keywords like "clubbing", "samhita", etc. for semantic search
            const memoryQuery = `${emotionQuery} ${recentUserContent}`.substring(0, 500); // Limit to 500 chars

            // Query Pinecone for emotionally similar past conversations AND content-based matches
            const memoryResponse = await fetch(
                `${backendUrl}/api/memories/${roomId}?query=${encodeURIComponent(memoryQuery)}&top_k=5`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(2000) // Increased timeout to 2s
                }
            );

            if (memoryResponse.ok) {
                const memoryData = await memoryResponse.json();
                if (memoryData.memories && memoryData.memories.length > 0) {
                    emotionalMemories = memoryData.memories;
                    console.log(`[Soul Engine] ✅ Retrieved ${emotionalMemories.length} memories from Pinecone`);
                    console.log(`[Pinecone] Query: "${memoryQuery.substring(0, 100)}..."`);
                    emotionalMemories.forEach((mem: any, idx: number) => {
                        console.log(`[Pinecone Memory ${idx + 1}]: "${mem.user_message?.substring(0, 60)}..."`);
                    });
                } else {
                    console.log(`[Soul Engine] ⚠️  Pinecone returned 0 memories for query: "${memoryQuery.substring(0, 100)}..."`);
                }
            } else {
                console.warn(`[Soul Engine] ⚠️  Pinecone API returned status: ${memoryResponse.status}`);
            }
        } catch (memoryError) {
            console.warn("[Soul Engine] Pinecone memory retrieval failed (backend may not be running):", memoryError);
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
        
        if (history?.messages && history.messages.length > 0) {
            // Extract key information from recent messages (last 20)
            const recentMessages = history.messages.slice(-20);
            const userMessages = recentMessages.filter(m => m.senderType === 'user').map(m => m.content.toLowerCase());
            
            // Extract specific details user mentioned
            clubbingMention = userMessages.some(m => m.includes('club') || m.includes('clubbing') || m.includes('club ki') || m.includes('clubbing veltuna') || m.includes('clubbing place'));
            locationMentions = recentMessages
                .filter(m => m.senderType === 'user')
                .map(m => {
                    const content = m.content.toLowerCase();
                    if (content.includes('hitech')) return 'Hitech City';
                    if (content.includes('banjara')) return 'Banjara Hills';
                    if (content.includes('gachibowli')) return 'Gachibowli';
                    return null;
                })
                .filter((loc): loc is string => loc !== null);
            
            nameMentions = recentMessages
                .filter(m => m.senderType === 'user')
                .flatMap(m => {
                    const content = m.content;
                    const names = ['samhita', 'tara', 'aaryan', 'aditya'];
                    return names.filter(name => content.toLowerCase().includes(name));
                });
            
            // Extract questions AI already asked (to prevent repetition)
            aiQuestions = recentMessages
                .filter(m => m.senderType === 'persona')
                .map(m => m.content)
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
            
            memoryContext = `\n\n=== CRITICAL MEMORY CONTEXT ===
YOU HAVE ACCESS TO ${history.messages.length} PREVIOUS MESSAGES IN THE CONVERSATION HISTORY ABOVE.
${extractedContext}

**MANDATORY MEMORY RULES:**
1. **READ THE CONVERSATION HISTORY BEFORE REPLYING** - Scroll up and read the last 10-15 messages.
2. **NEVER REPEAT QUESTIONS YOU ALREADY ASKED** - Check history. If you asked "Ekkadiki veltunnav?" and got an answer, DON'T ask again.
3. **REMEMBER WHAT USER TOLD YOU** - If user said "clubbing veltuna", remember it. If they mention "going somewhere" later, you KNOW it's clubbing.
4. **REFERENCE SPECIFIC DETAILS** - When user mentions something, reference it directly:
   - User said "clubbing veltuna" → Later say "Clubbing ki veltunnava ra?" NOT "Ekkadiki veltunnav?"
   - User said "Hitech City lo" → Reference "Hitech City" directly, don't ask "Ekkada?" again.
5. **SHOW YOU REMEMBER** - Prove you read the history by referencing specific things they said:
   - Good: "Oh yeah, nuvvu cheppav ga clubbing ki veltunnav ani!"
   - Bad: "Ekkadiki veltunnav?" (Ignoring what they told you)
6. **CHECK YOUR OWN MESSAGES** - Don't repeat questions you already asked in this conversation.
7. **IF USER MENTIONS SOMETHING MULTIPLE TIMES, IT'S IMPORTANT** - If user said "clubbing" 3 times, they REALLY want you to remember it.
8. **ACTIVE RECALL** - Before asking "Where are you going?", check if they already told you. Use the specific word they used (e.g., "clubbing" not "going somewhere").`;
        }
        
        const memoryInstruction = memoryContext;
        
        // Log memory context for debugging
        if (memoryContext) {
            console.log(`[Memory Context] Built comprehensive memory context with ${history?.messages.length || 0} messages`);
            if (clubbingMention) console.log(`[Memory Context] ✅ Detected clubbing mention in conversation`);
            if (locationMentions.length > 0) console.log(`[Memory Context] ✅ Detected locations: ${locationMentions.join(', ')}`);
            if (nameMentions.length > 0) console.log(`[Memory Context] ✅ Detected people: ${nameMentions.join(', ')}`);
            if (aiQuestions.length > 0) console.log(`[Memory Context] ✅ Found ${aiQuestions.length} questions AI already asked`);
        }

        // Generate dynamic system instruction based on vibe analysis
        const baseSystemInstruction = personalityEngine.getSystemInstruction(
            vibeCheck.mood,
            vibeCheck.verbosity,
            userProfile,
            persona as Persona,
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
            timeZone: 'Asia/Kolkata' // IST
        }); // Example: "Wednesday, 31 December 2025"

        const timeString = today.toLocaleTimeString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        }); // Example: "11:30 PM"

        const dateContext = `

### CURRENT REAL-WORLD DATE & TIME
Today is: ${dateString}.
Current time: ${timeString} IST.
- **CRITICAL:** You MUST act as if this is the current date and time.
- If today is December 31, 2025, then it IS 2025. Do NOT say "That's in the future" or "You are ahead of time."
- If the user asks "How was 2025?" on December 31, 2025, respond in the PAST TENSE (e.g., "It was crazy ra, startup funding vachindi").
- When users explicitly mention dates (e.g., "On January 1st", "Last week", "Next month"), understand them in relation to TODAY (${dateString}).
- Be smart about date calculations: "Last week" = 7 days ago from ${dateString}, "Next month" = January 2026, etc.
- Do NOT hallucinate dates. If you don't know a specific date, ask or say "Emo macha, exact date teliyadu" instead of guessing.
`;

        const systemInstruction = baseSystemInstruction + dateContext;

        console.log(`[Soul Engine] Stage 2: Using ${vibeCheck.mood} mode (${vibeCheck.verbosity} verbosity) for response generation`);
        console.log(`[Date Context] Injected: ${dateString} ${timeString} IST`);

        // Get API key
        const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
        const apiKey = rawKey.replace(/\s/g, '');

        if (!apiKey) {
            return NextResponse.json(
                { message: 'GEMINI_API_KEY is not configured' },
                { status: 500 }
            );
        }

        // Build contents array with history - CRITICAL for memory!
        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

        if (history?.messages && history.messages.length > 0) {
            // Messages are already sorted by timestamp (oldest first) - Gemini expects chronological order
            history.messages.forEach((m: Message) => {
                contents.push({
                    role: m.senderType === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                });
            });

            // Log the LAST few messages to verify we're getting recent context (these should be the newest)
            const lastFew = history.messages.slice(-5).map((m: Message) => {
                const time = m.createdAt instanceof Date ? m.createdAt.toLocaleTimeString() : new Date(m.createdAt as any).toLocaleTimeString();
                return `${time} ${m.senderType}: ${m.content.substring(0, 60)}`;
            });
            console.log(`[Memory] Added ${contents.length} historical messages to Gemini context`);
            console.log(`[Memory] Last 5 messages sent to Gemini (newest, should include date mention):`, lastFew);

            // Also check if "date" is mentioned in any message to verify memory
            const hasDateMention = history.messages.some((m: Message) =>
                m.content.toLowerCase().includes('date')
            );
            if (hasDateMention) {
                const dateMessages = history.messages.filter((m: Message) =>
                    m.content.toLowerCase().includes('date')
                ).map((m: Message) => {
                    const time = m.createdAt instanceof Date ? m.createdAt.toLocaleTimeString() : new Date(m.createdAt as any).toLocaleTimeString();
                    return `${time} ${m.senderType}: ${m.content.substring(0, 80)}`;
                });
                console.log(`[Memory] ✅ Found ${dateMessages.length} message(s) mentioning "date":`, dateMessages);
            } else {
                console.log(`[Memory] ⚠️  WARNING: No messages found mentioning "date" in history!`);
            }
        } else {
            console.log(`[Memory] No history found, starting fresh conversation`);
        }

        // Add current user message (use textForAI for AI context if provided, otherwise clean text)
        contents.push({
            role: 'user',
            parts: [{ text: textForAI }] // Use textForAI (with time context) for AI generation
        });
        // Note: The 'text' variable (clean text) is still used for database saving below

        console.log(`[Memory] Total messages in context: ${contents.length} (including current message)`);

        // Determine model name - Use fastest model for low latency
        const modelName = persona.model?.textModel || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
        console.log(`Using model: ${modelName} (Streaming)`);

        // Use streamGenerateContent via REST with SSE (Server-Sent Events)
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
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: { message: errorText } };
            }
            console.error('Gemini API error:', errorData, 'Status:', response.status);
            return NextResponse.json(
                { message: `Gemini API error: ${errorData.error?.message || 'Unknown error'}` },
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
                let chunkCount = 0;

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;

                        // Split by double newline (SSE format) first
                        let lines = buffer.split("\n\n");

                        // If no double newlines found, try single newline (some APIs use this)
                        if (lines.length === 1 && buffer.includes('\n')) {
                            lines = buffer.split('\n');
                        }

                        // Keep the last incomplete part in buffer
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine) continue;

                            // Handle SSE format: "data: {...}"
                            if (trimmedLine.startsWith("data:")) {
                                const jsonStr = trimmedLine.replace(/^data:\s*/, "").trim();
                                if (jsonStr === "[DONE]" || jsonStr === "") continue;

                                try {
                                    const data = JSON.parse(jsonStr);
                                    const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (textChunk) {
                                        fullResponseText += textChunk;
                                        controller.enqueue(encoder.encode(textChunk));
                                        chunkCount++;
                                    }
                                } catch (e) {
                                    // Skip invalid JSON chunks gracefully (might be partial)
                                    // Only log if it looks like complete JSON that failed to parse
                                    if (jsonStr.length > 10 && jsonStr.startsWith('{')) {
                                        console.error("Error parsing SSE data chunk (skipping):", (e as Error).message, "Preview:", jsonStr.substring(0, 50));
                                    }
                                }
                            } else if (trimmedLine.startsWith("{")) {
                                // Handle direct JSON (not SSE format)
                                try {
                                    // Try to extract complete JSON object in case there's trailing text
                                    const jsonMatch = trimmedLine.match(/\{[\s\S]*\}/);
                                    if (jsonMatch) {
                                        const data = JSON.parse(jsonMatch[0]);
                                        const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                        if (textChunk) {
                                            fullResponseText += textChunk;
                                            controller.enqueue(encoder.encode(textChunk));
                                            chunkCount++;
                                        }
                                    }
                                } catch (e) {
                                    // Skip invalid JSON chunks gracefully
                                    if (trimmedLine.length > 10) {
                                        console.error("Error parsing JSON chunk (skipping):", (e as Error).message, "Preview:", trimmedLine.substring(0, 50));
                                    }
                                }
                            }
                        }
                    }

                    // Final flush - handle remaining buffer
                    const trimmedBuffer = buffer.trim();
                    if (trimmedBuffer) {
                        // Try to parse each line separately (in case multiple objects are concatenated)
                        const lines = trimmedBuffer.split('\n');
                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine) continue;

                            // Handle SSE format: "data: {...}"
                            if (trimmedLine.startsWith("data:")) {
                                const jsonStr = trimmedLine.replace(/^data:\s*/, "").trim();
                                if (jsonStr === "[DONE]") continue;

                                // Try to parse as JSON
                                try {
                                    const data = JSON.parse(jsonStr);
                                    const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (textChunk) {
                                        fullResponseText += textChunk;
                                        controller.enqueue(encoder.encode(textChunk));
                                        chunkCount++;
                                    }
                                } catch (e) {
                                    // Skip invalid JSON chunks gracefully
                                    console.error("Error parsing final SSE chunk (skipping):", (e as Error).message);
                                }
                            } else if (trimmedLine.startsWith("{")) {
                                // Handle direct JSON (not SSE format)
                                try {
                                    // Try to extract JSON object (in case there's trailing text)
                                    const jsonMatch = trimmedLine.match(/\{[\s\S]*\}/);
                                    if (jsonMatch) {
                                        const data = JSON.parse(jsonMatch[0]);
                                        const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                        if (textChunk) {
                                            fullResponseText += textChunk;
                                            controller.enqueue(encoder.encode(textChunk));
                                            chunkCount++;
                                        }
                                    }
                                } catch (e) {
                                    // Skip invalid JSON chunks gracefully
                                    console.error("Error parsing final JSON chunk (skipping):", (e as Error).message);
                                }
                            }
                        }
                    }

                    console.log(`Stream completed: ${chunkCount} chunks, ${fullResponseText.length} total characters`);
                    controller.close();

                    // --- Save to DB After Stream ---
                    // IMPORTANT: Save both user and persona messages to Firestore
                    // Split response into multiple messages if it contains newlines (AI sends one sentence per line)
                    if (fullResponseText) {
                        try {
                            // Split by newlines to create separate messages (AI formats as one sentence per line)
                            const sentences = fullResponseText
                                .split(/\n+/)
                                .map(s => s.trim())
                                .filter(s => s.length > 0);

                            // Save user message first
                            const messageData2: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
                                roomId,
                                personaId: personaId,
                                senderType: 'user',
                                content: text,
                                messageType,
                                isRead: true,
                                status: 'sent',
                                isSent: true,
                                isReceived: true,
                                isDelivered: true,
                                isEdited: false,
                                isDeleted: false,
                                isSystemMessage: false,
                                isError: false
                            };

                            if (metadata !== undefined && metadata !== null) {
                                messageData2.metadata = metadata;
                            }

                            // 🛑 CRITICAL: Frontend handles message formatting (spam vs paragraph)
                            // Backend should NOT save persona messages - frontend creates local messages and handles DB saves
                            // Only save the user message here to prevent duplicates from backend subscription
                            // The frontend will save persona messages individually (spam format) or as one (paragraph format)

                            // 🛑 CRITICAL: Frontend now handles user message saving (with locked timestamps)
                            // Backend should NOT save user messages to prevent duplicates
                            // Only save user messages for system events (which frontend doesn't handle)
                            if (isSystemEvent) {
                                console.log("✅ System event (check-in) - no user message saved to Firestore");
                            } else {
                                // Frontend handles user message saving - backend skips it
                                console.log("✅ User message will be saved by frontend (backend skipping to prevent duplicates)");
                                // Still update room's last message
                                if (isFirebaseEnabled && text) {
                                    await RoomAdminDb.updateLastMessage(roomId, text.slice(0, 50));
                                }
                            }

                            // Note: Persona messages are NOT saved here - frontend handles saving after format decision

                            // Also save to Pinecone for long-term memory (call backend)
                            try {
                                const backendUrl = process.env.BACKEND_URL || 'http://localhost:5002';
                                await fetch(`${backendUrl}/api/memories/store`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        user_id: roomId, // Using roomId as user_id for persona-specific memory
                                        user_message: text,
                                        yudi_response: fullResponseText,
                                        emotion: vibe.emotion // Store detected emotion for future retrieval
                                    })
                                });
                                console.log(`✅ Conversation saved to Pinecone memory (emotion: ${vibe.emotion})`);
                            } catch (pineconeError) {
                                console.warn("⚠️  Pinecone save failed (backend may not be running):", pineconeError);
                            }

                            // Update user personality profile asynchronously (don't block response)
                            if (isFirebaseEnabled && userProfile) {
                                try {
                                    // Update profile based on this interaction
                                    // Increase sarcasm level if sarcastic mode was used
                                    if (vibeCheck.mood === 'sarcastic_friend') {
                                        userProfile.sarcasm_level = Math.min(10, (userProfile.sarcasm_level || 5) + 0.5);
                                    }
                                    userProfile.last_emotion = vibe.emotion;
                                    userProfile.preferred_language_style = vibe.language_style;
                                    userProfile.updatedAt = new Date();

                                    // TODO: Save to Firestore user_personality collection
                                    // await UserPersonalityAdminDb.update(userProfile.userId, userProfile);
                                    console.log(`[Soul Engine] Updated user profile (sarcasm: ${userProfile.sarcasm_level}, emotion: ${vibe.emotion}, mood: ${vibeCheck.mood})`);
                                } catch (profileError) {
                                    console.warn("Could not update user profile:", profileError);
                                }
                            }
                        } catch (e) {
                            console.error('❌ Error saving messages:', e);
                            // Don't throw - messages are already streamed to user
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
