"use client";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "../ui/button";
import CallInput from "./CallInput";
import { useLiveAPIContext } from "../audio/LiveAPIContext";
import { useEffect, useRef, useState } from "react";
import { useRoom } from "@/hooks/useRoom";
import { usePersona } from "@/hooks/usePersona";
import { useAuth } from "@/components/AuthContext";
import { Room, Persona } from "@/lib/firebase/dbTypes";
import { Modality, LiveConnectConfig } from '@google/genai';

import { generateSystemInstruction, UserContext } from "@/lib/audio/system-instruction";

interface CallInterfaceProps {
    room: Room;
    persona: Persona;
}

export default function CallInterface({ room, persona }: CallInterfaceProps) {
    const router = useRouter();
    const params = useParams();
    const roomId = params?.roomId as string;
    const { connected, client, setConfig, disconnect } = useLiveAPIContext();
    const videoRef = useRef<HTMLVideoElement>(null);

    const { user } = useAuth();

    // Track transcript timestamps to pair user/AI messages correctly
    const lastUserTranscriptTimeRef = useRef<number>(0);
    const pendingUserTranscriptRef = useRef<string | null>(null);

    // Handle voice transcript saving to database
    useEffect(() => {
        if (!roomId || !persona?.id) return;

        const handleInputTranscript = async (text: string) => {
            if (!text.trim()) return;

            console.log('💾 Saving user voice transcript to database:', text);
            try {
                const { MessageClientDb } = await import('@/lib/firebase/clientDb');
                const timestamp = Date.now();
                lastUserTranscriptTimeRef.current = timestamp;
                pendingUserTranscriptRef.current = text;

                // ✅ CORRECT PATH: MessageClientDb.create saves to rooms/{roomId}/messages subcollection
                // This ensures voice transcripts are stored in the same location as text messages
                await MessageClientDb.create({
                    roomId,
                    personaId: persona.id,
                    senderType: 'user',
                    content: text,
                    messageType: 'voice_transcript',
                    type: 'voice', // 👈 KEY: This tag enables filtering in admin dashboard
                    isSent: true,
                }, new Date(timestamp));

                console.log('✅ User voice transcript saved to database (subcollection)');
            } catch (error) {
                console.error('❌ Failed to save user voice transcript:', error);
            }
        };

        const handleOutputTranscript = async (text: string) => {
            if (!text.trim()) return;

            console.log('💾 Saving AI voice transcript to database:', text);
            try {
                const { MessageClientDb } = await import('@/lib/firebase/clientDb');
                // Use timestamp slightly after user message (if exists) or current time
                const timestamp = lastUserTranscriptTimeRef.current > 0
                    ? lastUserTranscriptTimeRef.current + 1000 // 1 second after user message
                    : Date.now();

                // ✅ CORRECT PATH: MessageClientDb.create saves to rooms/{roomId}/messages subcollection
                // This ensures voice transcripts are stored in the same location as text messages
                await MessageClientDb.create({
                    roomId,
                    personaId: persona.id,
                    senderType: 'persona',
                    content: text,
                    messageType: 'voice_transcript',
                    type: 'voice', // 👈 KEY: This tag enables filtering in admin dashboard
                    isSent: true,
                }, new Date(timestamp));

                // Reset user transcript tracking
                pendingUserTranscriptRef.current = null;
                lastUserTranscriptTimeRef.current = 0;

                console.log('✅ AI voice transcript saved to database (subcollection)');
            } catch (error) {
                console.error('❌ Failed to save AI voice transcript:', error);
            }
        };

        client.on('inputTranscript', handleInputTranscript);
        client.on('outputTranscript', handleOutputTranscript);

        return () => {
            client.off('inputTranscript', handleInputTranscript);
            client.off('outputTranscript', handleOutputTranscript);
        };
    }, [client, roomId, persona?.id]);

    const handleBackToChat = () => {
        router.push(`/m/${roomId}/chat`);
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = new MediaStream();
        }
    }, []);

    // Configure Voice and System Instruction
    useEffect(() => {
        if (!room || !persona) return;

        const setupConfig = async () => {
            try {
                // Helper to map persona language to ISO 639-1 codes (Gemini Live API requirement)
                // CRITICAL FIX: Must return base ISO codes like "hi", "te", "en" (without locale suffix)
                // The new model gemini-2.5-flash-native-audio-preview-12-2025 doesn't support locale suffixes like "en-IN"
                const getSupportedLanguage = (lang?: string): string => {
                    if (!lang) return "en"; // Default to English
                    const normalized = lang.toLowerCase();
                    // Return base ISO 639-1 language codes (without locale suffix)
                    if (normalized.includes("tamil") || normalized.includes("ta")) return "ta";
                    if (normalized.includes("telugu") || normalized.includes("te")) return "te";
                    if (normalized.includes("hindi") || normalized.includes("hi")) return "hi";
                    if (normalized.includes("english") || normalized.includes("en")) return "en";
                    // Default to English
                    return "en";
                };

                // Fetch conversation history and memories
                let conversationHistory = '';
                let memoryContext = '';

                if (room?.userId && user?.uid) {
                    try {
                        // Fetch recent conversation history (last 30 messages)
                        // Note: This runs on client, so we'll use client-side DB access
                        const { MessageClientDb } = await import('@/lib/firebase/clientDb');
                        const history = await MessageClientDb.getByRoomId(roomId, 30);
                        if (history?.messages && history.messages.length > 0) {
                            // Sort oldest first for context
                            history.messages.sort((a: any, b: any) => {
                                const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
                                const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
                                return timeA - timeB;
                            });

                            conversationHistory = history.messages
                                .slice(-20) // Last 20 messages for context
                                .map((msg: any) => `${msg.senderType === 'user' ? 'User' : persona.name}: ${msg.content}`)
                                .join('\n');
                        }

                        // Fetch memories from Pinecone backend
                        try {
                            // Use the same backend URL pattern as text chat
                            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
                            const memoryQuery = conversationHistory.substring(0, 200) || 'general conversation'; // Use recent context as query

                            // Try both userId and roomId (backend might use either)
                            const memoryResponse = await fetch(
                                `${backendUrl}/api/memories/${room.userId || roomId}?query=${encodeURIComponent(memoryQuery)}&top_k=5`,
                                {
                                    method: 'GET',
                                    signal: AbortSignal.timeout(2000) // 2s timeout
                                }
                            );

                            if (memoryResponse.ok) {
                                const memoryData = await memoryResponse.json();
                                if (memoryData.memories && memoryData.memories.length > 0) {
                                    const memoryEntries = memoryData.memories.slice(0, 5).map((mem: any, idx: number) => {
                                        const userMsg = mem.user_message || mem.userMessage || '';
                                        const response = mem.yudi_response || mem.yudiResponse || mem.value || '';
                                        return `${idx + 1}. User said: "${userMsg}" → You responded: "${response}"`;
                                    }).join('\n');

                                    memoryContext = '\n\n📚 PREVIOUS CONVERSATION MEMORIES (Use these to remember past discussions):\n' +
                                        memoryEntries +
                                        '\n\nIMPORTANT: Reference these memories naturally when relevant. Remember what you have discussed before. Build on previous conversations.';
                                    console.log(`✅ Loaded ${memoryData.memories.length} memories for voice chat`);
                                }
                            } else {
                                console.log('Memory API returned non-OK status:', memoryResponse.status);
                            }
                        } catch (memoryError) {
                            // Silently fail - memories are optional for voice chat
                            console.log('Memories not available (backend may not be running):', memoryError);
                        }
                    } catch (historyError) {
                        console.warn('Could not fetch conversation history:', historyError);
                    }
                }

                // Create dynamic user context for Antigravity prompt
                const userContext: UserContext = {
                    userName: user?.displayName || "Friend",
                    userMood: "neutral",
                    companionName: persona.name,
                    companionAge: persona.age || 20,
                    companionCollege: "IIT Delhi",
                    recentHistory: conversationHistory, // Add conversation history
                    // For system instruction generation, use full name format
                    nativeLanguage: (() => {
                        const lang = persona.language?.toLowerCase() || '';
                        if (lang.includes("tamil")) return "Tamil";
                        if (lang.includes("telugu")) return "Telugu";
                        if (lang.includes("english")) return "English";
                        return "Hindi"; // Default
                    })(),
                    personality: persona.personality || "friendly, supportive, and slightly playful",
                };

                // Generate base Antigravity prompt
                let baseSystemInstruction = generateSystemInstruction(userContext);

                // Add memory context to system instruction
                if (memoryContext) {
                    baseSystemInstruction += memoryContext;
                }

                // Build specific persona details (TRUNCATED to prevent 1007 errors from oversized config)
                const specificParts = [];

                // Add model's base system prompt if available (limit length)
                if (persona.model?.systemPrompt) {
                    const truncatedSystemPrompt = persona.model.systemPrompt.substring(0, 2000); // Limit to 2KB
                    specificParts.push(`\n${truncatedSystemPrompt}`);
                }

                // Add user's custom prompt if provided (limit length)
                if (persona.userPrompt) {
                    const truncatedUserPrompt = persona.userPrompt.substring(0, 1000); // Limit to 1KB
                    specificParts.push(`\nAdditional instructions: ${truncatedUserPrompt}`);
                }

                if (persona.description) {
                    specificParts.push(`About you: ${persona.description.substring(0, 500)}`); // Limit to 500 chars
                }

                if (persona.category) {
                    specificParts.push(`Your role: ${persona.category}`);
                }

                // Add concise voice-specific instructions (keep short to prevent timeouts)
                specificParts.push(`\nResponse: Casual=1-3 sentences. Advice=story(2-4s) + detailed(5-8s). Deep talks=8-12s. Always respond. Connection stays open.

🚨🚨🚨 CRITICAL VOICE SLANG RULES (MANDATORY):
- **MAXIMUM 1 slang word per ENTIRE response** (NOT per sentence, NOT 2-3 slangs)
- **ABSOLUTELY FORBIDDEN:** Never use "no cap", "real talk", or "for real" repeatedly - these are BANNED from repeated use
- **MANDATORY ROTATION:** Use DIFFERENT slangs every time. Rotate through: bet, valid, facts, rizz, wild, damn, yooo, bruh, slay, fire, lit, bussin, slaps, sus, mid, based, drip, cap, yaar, bhai, arre, macha, ra, da, le, thopu, keka, mast, jhakaas, etc.
- **NEVER repeat the same slang twice in a row** - Always use a different slang from the dictionary
- **80% Normal Language / 20% Slang:** Sound like a real person, not a slang dictionary
                
ASKING ABOUT PAST SITUATIONS FROM TEXT CHAT (MAKE IT FUNNY):
- Reference text chat incidents naturally and make it funny.
- Use PAST TENSE for past events: "Hey remember that day in text when you went outside? What did you do?" (past tense)
- Don't ask immediately after discussing - wait for natural break.
- Make it sound like you're remembering something funny from your text chats.`);

                // Combine them: Antigravity Base + Specific Persona Details
                // CRITICAL: Truncate total instruction to prevent oversized config
                let finalSystemInstruction = baseSystemInstruction + "\n\n" + specificParts.join('\n');

                // 🚨 CRITICAL: Reduce system instruction size to prevent "Deadline expired" (1011) errors
                // Large system instructions cause server timeouts
                const MAX_INSTRUCTION_LENGTH = 4000; // ~4KB max (reduced from 8KB to prevent timeouts)
                if (finalSystemInstruction.length > MAX_INSTRUCTION_LENGTH) {
                    console.warn(`⚠️ System instruction is too long (${finalSystemInstruction.length} chars), truncating to ${MAX_INSTRUCTION_LENGTH} to prevent 1011 errors...`);
                    finalSystemInstruction = finalSystemInstruction.substring(0, MAX_INSTRUCTION_LENGTH) + '\n[Instruction truncated to prevent server timeout]';
                }

                console.log("Combined Voice System Instruction:", finalSystemInstruction.substring(0, 200) + "...");

                // 🚨 CRITICAL: Only use voices CONFIRMED to work with gemini-2.5-flash-native-audio-preview-12-2025
                // These are the officially supported voices for this model version
                // IMPORTANT: The Indian accent comes from languageCode (en-IN, hi-IN, etc.), NOT from voice name
                // Voice names determine timbre/character: warmer, clearer, deeper, etc.
                // DO NOT use: Achernar, Achird, Algenib, Algieba, Alnilam, Leda (not available)

                // Voice selection for more natural, less robotic sound (Indian accent optimized):
                // - Callirrhoe: Warmer, more natural female voice (best for Indian English - less robotic)
                // - Aoede: Clearer, more articulate female voice (good for Indian accent)
                // - Kore: Softer, gentler female voice (natural for Indian accent)
                // - Fenrir: Clear, natural male voice (best for Indian English - less robotic)
                // - Charon: Deeper, more dramatic male voice (use sparingly)
                // - Puck: Neutral, safe default (works well with Indian accent)
                const femaleVoices = ["Callirrhoe", "Aoede", "Kore"]; // Prioritize Indian accent-friendly voices
                const maleVoices = ["Fenrir", "Charon"]; // Prioritize Indian accent-friendly voices
                const neutralVoices = ["Puck", "Kore"]; // Puck is safest default

                // 🎯 CRITICAL: Assign consistent voice per persona (not random each time)
                // Use persona.id to hash and assign a voice, so each persona always has the same voice
                // This ensures variety across personas but consistency for each persona
                let voiceName = "Puck"; // Safest default - always available
                const gender = persona.gender?.toLowerCase();

                // Hash persona.id to get a consistent index for voice selection
                const hashPersonaId = (id: string): number => {
                    let hash = 0;
                    for (let i = 0; i < id.length; i++) {
                        const char = id.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash; // Convert to 32-bit integer
                    }
                    return Math.abs(hash);
                };

                const personaHash = hashPersonaId(persona.id || persona.name || 'default');

                if (gender === 'female') {
                    // Assign consistent voice per persona (use hash to pick from array)
                    const voiceIndex = personaHash % femaleVoices.length;
                    voiceName = femaleVoices[voiceIndex];
                } else if (gender === 'male') {
                    // Assign consistent voice per persona (use hash to pick from array)
                    const voiceIndex = personaHash % maleVoices.length;
                    voiceName = maleVoices[voiceIndex];
                } else {
                    // Assign consistent voice per persona (use hash to pick from array)
                    const voiceIndex = personaHash % neutralVoices.length;
                    voiceName = neutralVoices[voiceIndex];
                }

                // NOTE: languageCode is not used for gemini-2.5-flash-native-audio-preview-12-2025
                // The model auto-detects language, so we don't include languageCode in the config
                console.log(`Selected voice: ${voiceName} for gender: ${persona.gender || 'neutral'}`);

                // FIXED: Use correct Gemini Live API config format
                // CRITICAL: Only include valid LiveConnectConfig properties (prevents 1007 error)
                // NOTE: languageCode is optional for gemini-2.5-flash-native-audio-preview-12-2025
                // The model may auto-detect language or not require explicit language codes
                const cleanConfig: LiveConnectConfig = {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        // Try without languageCode first - the preview model may not support it
                        // languageCode: getSupportedLanguage(persona.language), // Commented out - model doesn't support 'en'
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voiceName
                            }
                        }
                        // 🚨 REMOVED: voiceActivityDetection is not a supported property in Gemini Live API
                        // This was causing Error 1011 (Server internal error)
                    },
                    systemInstruction: {
                        parts: [
                            {
                                text: finalSystemInstruction + "\n\nFINAL RULES: Don't repeat user's words. Always respond - never silent. Connection stays open until user disconnects. Response lengths: casual=1-3 sentences, advice=story+5-8 sentences, deep talks=8-12+ sentences."
                            }
                        ]
                    }
                };

                console.log('✅ Setting clean Gemini Live API config:', JSON.stringify(cleanConfig, null, 2));
                setConfig(cleanConfig);

            } catch (err) {
                console.error("Error setting call config:", err);
            }
        };

        setupConfig();
    }, [room, persona, user, setConfig]);



    return (
        <div className="fixed left-0 right-0 h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
            <div className="max-w-md w-full mx-4 p-8 rounded-3xl bg-background/80 backdrop-blur-sm border border-primary/20 shadow-2xl flex flex-col items-center gap-8">

                <div className="text-center">
                    <h2 className="text-2xl font-bold">{persona.name}</h2>
                    <p className="text-muted-foreground text-sm">{persona.category || 'AI Assistant'}</p>
                </div>

                {/* Visualizer / Status Area */}
                <div className="w-full aspect-square bg-secondary/30 rounded-full flex items-center justify-center relative overflow-hidden">
                    {connected ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 bg-primary/20 rounded-full animate-pulse"></div>
                            <div className="w-24 h-24 bg-primary/40 rounded-full animate-ping absolute"></div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground text-center p-4">
                            Ready to connect
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="w-full flex flex-col items-center gap-4">
                    <CallInput roomId={roomId} />

                    <Button
                        onClick={handleBackToChat}
                        variant="ghost"
                        className="mt-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Back to Text Chat
                    </Button>
                </div>
            </div>
        </div>
    );
}
