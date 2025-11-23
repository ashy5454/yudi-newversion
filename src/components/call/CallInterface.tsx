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

export default function CallInterface() {
    const router = useRouter();
    const params = useParams();
    const roomId = params?.roomId as string;
    const { connected, client, setConfig } = useLiveAPIContext();
    const videoRef = useRef<HTMLVideoElement>(null);

    const { user } = useAuth();
    const { fetchRoom } = useRoom();
    const { fetchPersona } = usePersona();
    const [room, setRoom] = useState<Room | null>(null);
    const [persona, setPersona] = useState<Persona | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleBackToChat = () => {
        router.push(`/m/${roomId}/chat`);
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = new MediaStream();
        }
    }, []);

    // Fetch Room and Persona
    useEffect(() => {
        const loadData = async () => {
            if (!roomId || !user?.uid) return;

            try {
                setLoading(true);
                const roomData = await fetchRoom(roomId);
                if (!roomData) {
                    setError("Room not found");
                    return;
                }
                setRoom(roomData);

                const personaData = await fetchPersona(roomData.personaId);
                if (!personaData) {
                    setError("Persona not found");
                    return;
                }
                setPersona(personaData);

                // Build comprehensive system instruction with all persona details (matching text chat)
                const systemInstructionParts = [];

                // Add persona identity and characteristics
                systemInstructionParts.push(`You are ${personaData.name}.`);

                if (personaData.description) {
                    systemInstructionParts.push(`About you: ${personaData.description}`);
                }

                if (personaData.age) {
                    systemInstructionParts.push(`Your age: ${personaData.age} years old.`);
                }

                if (personaData.gender) {
                    systemInstructionParts.push(`Your gender: ${personaData.gender}.`);
                }

                if (personaData.personality) {
                    systemInstructionParts.push(`Your personality: ${personaData.personality}`);
                }

                if (personaData.language) {
                    systemInstructionParts.push(`Preferred language: ${personaData.language}`);
                }

                if (personaData.category) {
                    systemInstructionParts.push(`Your role: ${personaData.category}`);
                }

                // Add user's custom prompt if provided
                if (personaData.userPrompt) {
                    systemInstructionParts.push(`\nAdditional instructions: ${personaData.userPrompt}`);
                }

                // Add model's base system prompt
                systemInstructionParts.push(`\n${personaData.model.systemPrompt}`);

                // Add voice-specific instructions for natural conversation
                systemInstructionParts.push(`\n\nVoice Conversation Guidelines:
- Speak naturally and conversationally, as if talking to a friend
- Use varied sentence lengths and natural pauses
- Include filler words occasionally (like "um", "well", "you know") to sound more human
- Express emotions through your tone and word choice
- Ask follow-up questions to keep the conversation flowing
- Share relevant thoughts and opinions, not just facts
- Use contractions (I'm, you're, don't) for a casual tone
- Respond with 2-4 sentences typically, unless the topic requires more detail
- Show empathy and understanding in your responses
- Avoid sounding robotic or overly formal unless your character requires it`);

                const systemInstruction = systemInstructionParts.join('\n');

                console.log("Voice System Instruction:", systemInstruction);

                // Available voices by gender
                const femaleVoices = ["Achernar", "Aoede", "Callirrhoe", "Kore", "Leda"];
                const maleVoices = ["Achird", "Algenib", "Algieba", "Alnilam", "Charon"];
                const neutralVoices = ["Puck", "Kore"]; // Neutral/androgynous options

                // Determine voice based on persona gender with randomization
                let voiceName = "Puck"; // Default
                const gender = personaData.gender?.toLowerCase();

                if (gender === 'female') {
                    // Randomly select from female voices
                    voiceName = femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
                } else if (gender === 'male') {
                    // Randomly select from male voices
                    voiceName = maleVoices[Math.floor(Math.random() * maleVoices.length)];
                } else {
                    // Randomly select from neutral voices
                    voiceName = neutralVoices[Math.floor(Math.random() * neutralVoices.length)];
                }

                console.log(`Selected voice: ${voiceName} for gender: ${personaData.gender || 'neutral'}`);

                setConfig({
                    generationConfig: {
                        responseModalities: ["AUDIO"] as any,
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: voiceName
                                }
                            }
                        },
                    },
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    }
                });

            } catch (err) {
                console.error("Error loading call data:", err);
                setError("Failed to load call data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [roomId, user?.uid, fetchRoom, fetchPersona, setConfig]);

    if (loading) {
        return (
            <div className="fixed left-0 right-0 h-screen flex flex-col items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Initializing voice chat...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed left-0 right-0 h-screen flex flex-col items-center justify-center bg-background">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={handleBackToChat}>Back to Chat</Button>
            </div>
        );
    }

    return (
        <div className="fixed left-0 right-0 h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
            <div className="max-w-md w-full mx-4 p-8 rounded-3xl bg-background/80 backdrop-blur-sm border border-primary/20 shadow-2xl flex flex-col items-center gap-8">

                <div className="text-center">
                    <h2 className="text-2xl font-bold">{persona?.name}</h2>
                    <p className="text-muted-foreground text-sm">{persona?.category || 'AI Assistant'}</p>
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
