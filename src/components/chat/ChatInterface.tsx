"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoom } from "@/hooks/useRoom";
import { usePersona } from "@/hooks/usePersona";
import { useAuth } from "@/components/AuthContext";
import { Room, Persona } from "@/lib/firebase/dbTypes";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatWindow from "./ChatWindow";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { PhoneIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatInterface() {
    const isMobile = useIsMobile();
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { fetchRoom, createRoom } = useRoom();
    const { fetchPersona } = usePersona();
    const [room, setRoom] = useState<Room | null>(null);
    const [persona, setPersona] = useState<Persona | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const roomId = params?.roomId as string;

    useEffect(() => {
        const loadOrCreateRoom = async () => {
            if (!roomId || !user?.uid) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // First, try to fetch the room
                const roomData = await fetchRoom(roomId);
                if (!roomData) {
                    toast.error("Room not found with roomId: " + roomId);
                    return;
                } else {
                    setRoom(roomData);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load room');
                console.error('Error loading/creating room:', err);
            } finally {
                setLoading(false);
            }
        };

        loadOrCreateRoom();
    }, [roomId, user?.uid, fetchRoom, createRoom, fetchPersona]);

    if (loading) {
        return (
            <div className="fixed left-0 right-0 h-screen flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading chat...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed left-0 right-0 h-screen flex flex-col items-center justify-center">
                <p className="text-destructive">Error: {error}</p>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="fixed left-0 right-0 h-screen flex flex-col items-center justify-center">
                <p className="text-muted-foreground">Room not found</p>
            </div>
        );
    }

    return (
        <>
            {isMobile ? (
                <div className="fixed left-0 right-0 h-screen flex flex-col items-center">
                    {/* Chat Header */}
                    <ChatHeader room={room} />

                    {/* Chat Window */}
                    {isMobile && <ChatWindow />}

                    {/* Chat Input */}
                    <ChatInput roomId={roomId} personaId={room.personaId} />
                </div>
            ) : (
                <div className="fixed left-80 right-0 h-screen flex flex-col items-center">
                    {/* Chat Header */}
                    <div className="w-full relative">
                        <ChatHeader room={room} />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => router.push(`/m/${roomId}/call`)}
                            >
                                <PhoneIcon className="w-4 h-4" />
                                Voice Call
                            </Button>
                        </div>
                    </div>

                    {/* Chat Window */}
                    {!isMobile && <ChatWindow />}

                    {/* Chat Input */}
                    <ChatInput roomId={roomId} personaId={room.personaId} />
                </div>
            )}
        </>
    );
}