"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoom } from "@/hooks/useRoom";
import { usePersona } from "@/hooks/usePersona";
import { useAuth } from "@/components/AuthContext";
import { Room, Persona, Message } from "@/lib/firebase/dbTypes";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatWindow from "./ChatWindow";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { PhoneIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMessage } from "@/hooks/useMessage";
import { MessageClientDb } from "@/lib/firebase/clientDb";

// 1. UNBREAKABLE TIMESTAMP HELPER FUNCTION
// Handles all possible timestamp formats (Firestore Timestamps, JavaScript Dates, Numbers, Strings)
// Returns Date.now() if timestamp is invalid (so messages appear at bottom, not top)
const getMessageTime = (msg: any): number => {
    if (!msg || !msg.createdAt) {
        return Date.now(); // Default to NOW if missing (so messages appear at bottom, not top)
    }

    // Case 1: Firestore Timestamp (has .seconds property) - CHECK THIS FIRST
    if (msg.createdAt.seconds !== undefined) {
        const time = msg.createdAt.seconds * 1000 + (msg.createdAt.nanoseconds || 0) / 1000000;
        return isNaN(time) || time <= 0 ? Date.now() : time;
    }

    // Case 2: Firestore Timestamp (has .toMillis function)
    if (typeof msg.createdAt.toMillis === 'function') {
        const time = msg.createdAt.toMillis();
        return isNaN(time) || time <= 0 ? Date.now() : time;
    }

    // Case 3: JavaScript Date Object
    if (msg.createdAt instanceof Date) {
        const time = msg.createdAt.getTime();
        return isNaN(time) || time <= 0 ? Date.now() : time;
    }

    // Case 4: Number (already milliseconds)
    if (typeof msg.createdAt === 'number') {
        return isNaN(msg.createdAt) || msg.createdAt <= 0 ? Date.now() : msg.createdAt;
    }

    // Case 5: String
    if (typeof msg.createdAt === 'string') {
        try {
            const parsedTime = new Date(msg.createdAt).getTime();
            return isNaN(parsedTime) || parsedTime <= 0 ? Date.now() : parsedTime;
        } catch (e) {
            return Date.now(); // If parsing fails, return Date.now() (appears at bottom)
        }
    }

    return Date.now(); // Fallback: return Date.now() (appears at bottom, not top)
};

export default function ChatInterface() {
    const isMobile = useIsMobile();
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { fetchRoom, createRoom } = useRoom();
    const { fetchPersona } = usePersona();

    const { messages, loading: messagesLoading, error: messagesError, fetchMessagesByRoom, subscribeToRoomMessages, setMessages } = useMessage();
    const [room, setRoom] = useState<Room | null>(null);
    const [persona, setPersona] = useState<Persona | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const initMessageSentRef = useRef<Set<string>>(new Set()); // Track which rooms already got initial message
    const localMessageIdsRef = useRef<Set<string>>(new Set()); // Track locally created message IDs to prevent subscription overwriting
    const hasCheckedInRef = useRef<Set<string>>(new Set()); // Track which rooms already got 4-hour check-in
    const messagesLoadedRef = useRef<Set<string>>(new Set()); // Track which rooms have loaded messages

    const roomId = params?.roomId as string;

    // 2. UNBREAKABLE SORTING FUNCTION
    // Uses the robust getMessageTime helper to handle all timestamp formats
    // Ensures messages are sorted by timestamp, with ID fallback for identical timestamps
    const sortMessagesByTime = (msgs: Message[]): Message[] => {
        return [...msgs].sort((a, b) => {
            const timeA = getMessageTime(a);
            const timeB = getMessageTime(b);

            // If times are valid numbers and different, sort by time
            if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
                return timeA - timeB;
            }

            // Fallback: If times are identical or broken, sort by ID to preserve order
            // This ensures consistent ordering even when timestamps collide
            return (a.id > b.id) ? 1 : -1;
        });
    };

    // Ensure messages are always sorted by timestamp
    const sortedMessages = sortMessagesByTime(messages);

    // DEBUG: Log check-in messages in sorted array
    const checkInInSorted = sortedMessages.filter(m => m.senderType === 'persona' && m.content && m.content.includes('ekkada sachav'));
    if (checkInInSorted.length > 0) {
        console.log(`📊 [ChatInterface] sortedMessages contains ${checkInInSorted.length} check-in messages:`,
            checkInInSorted.map(m => ({
                id: m.id,
                content: m.content.substring(0, 30),
                timestamp: getMessageTime(m),
                createdAt: m.createdAt
            }))
        );
    }

    // 🔔 4-HOUR CHECK-IN: Auto-message when user opens app after being away
    useEffect(() => {
        // 🛑 SAFETY CHECK: Don't run if no messages exist or already checked in
        if (!roomId || sortedMessages.length === 0 || hasCheckedInRef.current.has(roomId)) {
            return;
        }

        const lastMsg = sortedMessages[sortedMessages.length - 1];
        const now = Date.now();

        // ✅ Use the fixed helper
        const lastMsgTime = getMessageTime(lastMsg);

        // Calculate gap
        const hoursSinceLastMsg = (now - lastMsgTime) / (1000 * 60 * 60);

        // 🛑 SANITY CHECK: 
        // If the gap is massive (> 1 year), it's a bug (1970 issue). Ignore it.
        // Only trigger if gap is > 4 hours AND < 500 hours (approx 20 days)
        if (hoursSinceLastMsg > 4 && hoursSinceLastMsg < 500) {
            hasCheckedInRef.current.add(roomId); // Mark as done so it doesn't spam on re-renders

            // Generate check-in message via AI
            const currentTime = new Date();
            const timeString = currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
            });

            const silentCheckInPrompt = `[System Event: It has been ${Math.floor(hoursSinceLastMsg)} hours since you last spoke.]
[Current Time: ${timeString} IST]
[Task: Send a short, casual check-in message to the user. Ask what's up or if they are okay. Use slang like "Emaindi ra? Silent aipoyav?", "Alive eh na?", or "Em doing?". Keep it brief and nonchalant - 1-2 sentences max.]`;

            // ✅ Trigger AI response using HIDDEN prompt (system event, no user message saved)
            // We send this as a hidden system message - NO user message bubble created
            const personaIdForCheckIn = room?.personaId || (sortedMessages.length > 0 && sortedMessages[0].personaId ? sortedMessages[0].personaId : '');
            if (!personaIdForCheckIn) {
                console.warn("Cannot send check-in: No personaId available");
                return;
            }

            console.log("⏰ Triggering Silent 4-Hour Check-in...");

            // ✅ Send HIDDEN prompt to AI (no user message will be saved)
            fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: '', // ✅ Empty text means no user message saved to database
                    hiddenPrompt: silentCheckInPrompt, // ✅ HIDDEN system prompt for AI only
                    roomId,
                    personaId: personaIdForCheckIn,
                    senderType: 'system', // Mark as system message
                }),
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error("Check-in failed");
                    }
                    if (!response.body) throw new Error("No response body");

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let done = false;
                    let fullBuffer = '';

                    // Read entire response
                    while (!done) {
                        const { value, done: doneReading } = await reader.read();
                        done = doneReading;
                        if (value) {
                            const chunkValue = decoder.decode(value, { stream: !done });
                            fullBuffer += chunkValue;
                        }
                    }

                    // ✅ Create check-in message (AI response only, no user message bubble)
                    const checkInContent = fullBuffer.trim().replace(/\n+/g, ' ');
                    if (checkInContent.length > 0) {
                        // Use Date.now() to ensure we get a proper timestamp (milliseconds)
                        const checkInTimestamp = Date.now();
                        console.log(`💾 Saving check-in message with timestamp: ${checkInTimestamp} (${new Date(checkInTimestamp).toISOString()})`);

                        // 🛑 CRITICAL CHANGE: 
                        // We REMOVED 'handleManualMessage' (local bubble creation).
                        // We ONLY save to DB. The Listener in ChatInterface will handle the UI.
                        // This guarantees 1 message = 1 bubble (no duplicates possible).
                        try {
                            const messageId = await MessageClientDb.create({
                                roomId,
                                personaId: personaIdForCheckIn,
                                senderType: "persona",
                                content: checkInContent,
                                messageType: "text",
                                isSent: true,
                            }, new Date(checkInTimestamp));
                            console.log(`✅ Check-in message saved with ID: ${messageId}`);
                        } catch (dbError) {
                            console.error("❌ Failed to save check-in message to DB:", dbError);
                            // Don't throw - continue even if save fails
                        }
                    }
                })
                .catch((error) => {
                    console.error("Error sending 4-hour check-in:", error);
                    // Don't mark as failed, let it retry next time if needed
                    hasCheckedInRef.current.delete(roomId);
                });
        }
    }, [sortedMessages, roomId, room]); // Runs when messages change or component loads

    // Clear messages when roomId changes and load messages for new room
    useEffect(() => {
        if (roomId) {
            // Clear messages when switching to a different room
            console.log(`🔄 [ChatInterface] Room changed to: ${roomId}, clearing previous messages`);
            setMessages([]);
            localMessageIdsRef.current.clear();
            messagesLoadedRef.current.delete(roomId); // Allow messages to reload for this room
        }
    }, [roomId]);

    // Initial message fetch and subscribe to real-time message updates
    useEffect(() => {
        if (roomId && user?.uid && room) {
            // Subscribe to real-time updates - this fires immediately with existing messages
            const unsubscribe = MessageClientDb.onRoomMessagesChange(roomId, (updatedMessages) => {
                console.log(`📨 [Subscription] Received ${updatedMessages.length} messages from subscription for room: ${roomId}`);

                setMessages(prev => {
                    // If this is the first time we're loading messages for this room, use all subscription messages
                    // The subscription fires immediately with all existing messages
                    if (!messagesLoadedRef.current.has(roomId)) {
                        console.log(`✅ [Subscription] Initial load for room ${roomId}: ${updatedMessages.length} messages`);
                        messagesLoadedRef.current.add(roomId);
                        return sortMessagesByTime(updatedMessages);
                    }

                    // After initial load, only add NEW messages (deduplicate)
                    const filteredBackendMessages = updatedMessages.filter(newMessage => {
                        // A. BLOCK ID DUPLICATES (Standard)
                        // If we already have a message with this ID locally, skip it
                        const existingById = prev.some(m => m.id === newMessage.id);
                        if (existingById || localMessageIdsRef.current.has(newMessage.id)) {
                            return false;
                        }

                        // B. BLOCK "USER" ECHO (Aggressive) - Only user messages have local copies for instant feedback
                        // This prevents the "User Message Sandwich" where user message appears twice
                        if (newMessage.senderType === 'user') {
                            const newMsgContent = newMessage.content.trim();
                            const newMsgTime = getMessageTime(newMessage);

                            // Check if we already have this user message with same content within 60 seconds
                            // Use wider window (60 seconds) because Server latency can be slow
                            const isUserDuplicate = prev.some(m => {
                                if (m.senderType !== 'user' || m.content.trim() !== newMsgContent) {
                                    return false;
                                }

                                const mTime = getMessageTime(m);
                                // Check if timestamps are within 60 seconds (wide window for server latency)
                                const timeDiff = Math.abs(mTime - newMsgTime);
                                return timeDiff < 60000; // 60 seconds window
                            });

                            if (isUserDuplicate) {
                                console.log("🛡️ Blocked duplicate user message from DB");
                                return false; // Block the DB echo of user message
                            }
                        }

                        // C. ALLOW AI MESSAGES (Since we removed local creation, allow all DB AI messages)
                        // AI messages come ONLY from DB now, so no duplicates possible
                        return true; // Keep this message
                    });

                    // Merge: prev (local user messages) + filtered backend messages, then sort
                    const merged = [...prev, ...filteredBackendMessages];
                    const sorted = sortMessagesByTime(merged);

                    // DEBUG: Log if check-in messages are in the final sorted array
                    const checkInMessages = sorted.filter(m => m.senderType === 'persona' && m.content.includes('ekkada sachav'));
                    if (checkInMessages.length > 0) {
                        console.log(`✅ [Subscription] Check-in messages in final array: ${checkInMessages.length}`,
                            checkInMessages.map(m => ({ id: m.id, content: m.content.substring(0, 30), timestamp: getMessageTime(m) }))
                        );
                    }

                    return sorted;
                });
            });
            return () => unsubscribe();
        }
    }, [roomId, user?.uid, room]);

    const handleManualMessage = (message: any) => {
        // Mark this message as locally created to prevent subscription from overwriting
        localMessageIdsRef.current.add(message.id);

        // If this is a spam message (has index), also mark the base ID
        if (message.id.includes('-')) {
            const baseId = message.id.split('-')[0];
            localMessageIdsRef.current.add(baseId);
        }

        console.log(`[Local Message Created] ID: ${message.id}, Content: ${message.content.substring(0, 50)}...`);

        setMessages(prev => {
            // Check if message already exists (by ID)
            const existingIndex = prev.findIndex(m => m.id === message.id);
            if (existingIndex >= 0) {
                // Update existing message
                const updated = prev.map((m, idx) => idx === existingIndex ? message : m);
                // Sort by createdAt to maintain chronological order
                return sortMessagesByTime(updated);
            }

            // Add new message - ensure timestamp is always greater than the last message
            const lastMsg = prev[prev.length - 1];
            let messageTime = message.createdAt instanceof Date ? message.createdAt.getTime() : new Date(message.createdAt).getTime();

            // Time bumper: If new message time is older/same as last message, bump it forward by 1ms
            if (lastMsg) {
                const lastMsgTime = lastMsg.createdAt instanceof Date ? lastMsg.createdAt.getTime() : new Date(lastMsg.createdAt).getTime();
                if (messageTime <= lastMsgTime) {
                    messageTime = lastMsgTime + 1;
                    message.createdAt = new Date(messageTime);
                }
            }

            // Add new message and sort by createdAt
            const updated = [...prev, message];
            return sortMessagesByTime(updated);
        });
    };

    const handleStreamAppend = (id: string, chunk: string) => {
        setMessages(prev => prev.map(msg =>
            msg.id === id ? { ...msg, content: (msg.content || "") + chunk } : msg
        ));
        // Hide typing indicator once content starts arriving
        if (chunk && chunk.trim().length > 0) {
            setIsGenerating(false);
        }
    };

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
                    console.log("Room not found in DB, initializing virtual room");
                    const fallbackPersona: Persona = {
                        id: "default-yudi",
                        creatorId: "system",
                        name: "Yudi",
                        description: "AI Companion",
                        bodyColor: "blue",
                        model: {
                            name: "Gemini",
                            systemPrompt: "You are a helpful assistant.",
                            textModel: "gemini-2.0-flash-exp",
                            voiceModel: "default",
                            voiceName: "default",
                            gender: "neutral",
                            textCostInCredits: 0,
                            voiceCostInCredits: 0,
                            toolModel: "default",
                            isActive: true,
                            createdAt: new Date(),
                        },
                        isActive: true,
                        usageCount: 0,
                        createdAt: new Date(),
                        isPublic: true
                    };

                    const fallbackRoom: Room = {
                        id: roomId,
                        userId: user?.uid || "anonymous",
                        personaId: fallbackPersona.id,
                        createdAt: new Date(),
                        title: "Chat with Yudi"
                    };

                    setRoom(fallbackRoom);
                    setPersona(fallbackPersona);
                } else {
                    setRoom(roomData);
                    // Fetch persona if room has personaId
                    if (roomData.personaId) {
                        try {
                            const personaData = await fetchPersona(roomData.personaId);
                            if (personaData) {
                                setPersona(personaData);
                            }
                        } catch (err) {
                            console.error('Error loading persona:', err);
                        }
                    }

                    // Check if this is a new room and send initial message after 3 seconds
                    // Prevent duplicate calls using ref
                    if (!initMessageSentRef.current.has(roomId)) {
                        initMessageSentRef.current.add(roomId);

                        // Wait 3 seconds before showing initial message
                        setTimeout(async () => {
                            try {
                                const initResponse = await fetch('/api/chat/init', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ roomId, personaId: roomData.personaId })
                                });
                                const initData = await initResponse.json();
                                if (initData.success && initData.content) {
                                    // Check if message already exists in the messages array before adding
                                    setMessages(prev => {
                                        // Check if initial message already exists
                                        const existingInit = prev.find(m =>
                                            m.senderType === "persona" &&
                                            (m.content === "heyyyy how you doingg" || m.content === "heyyyyyy how you doinggg")
                                        );

                                        if (existingInit) {
                                            // Already exists, don't add again
                                            return prev;
                                        }

                                        // Add initial message to UI (only once)
                                        return [...prev, {
                                            id: `init-${Date.now()}`,
                                            roomId,
                                            personaId: roomData.personaId,
                                            senderType: "persona" as const,
                                            content: initData.content,
                                            createdAt: new Date(),
                                            messageType: "text",
                                            isSent: true,
                                            isRead: false
                                        }];
                                    });
                                }
                            } catch (err) {
                                console.error('Error sending initial message:', err);
                                // Remove from set on error so it can retry if needed
                                initMessageSentRef.current.delete(roomId);
                            }
                        }, 3000); // 3 second delay
                    }
                }
            } catch (err) {
                console.error('Error loading/creating room:', err);

                // Fallback to virtual room for unauthenticated/offline users
                console.log("Using fallback virtual room");
                const fallbackPersona: Persona = {
                    id: "default-yudi",
                    creatorId: "system",
                    name: "Yudi",
                    description: "AI Companion",
                    bodyColor: "blue",
                    model: {
                        name: "Gemini",
                        systemPrompt: "You are a helpful assistant.",
                        textModel: "gemini-2.0-flash-exp",
                        voiceModel: "default",
                        voiceName: "default",
                        gender: "neutral",
                        textCostInCredits: 0,
                        voiceCostInCredits: 0,
                        toolModel: "default",
                        isActive: true,
                        createdAt: new Date(),
                    },
                    isActive: true,
                    usageCount: 0,
                    createdAt: new Date(),
                    isPublic: true
                };

                const fallbackRoom: Room = {
                    id: roomId,
                    userId: user?.uid || "anonymous",
                    personaId: fallbackPersona.id,
                    createdAt: new Date(),
                    title: "Chat with Yudi"
                };

                setRoom(fallbackRoom);
                setPersona(fallbackPersona);
            } finally {
                setLoading(false);
            }
        };

        loadOrCreateRoom();
    }, [roomId, user?.uid, fetchRoom, fetchPersona]);

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
                    {isMobile && <ChatWindow messages={sortedMessages} loading={messagesLoading} error={messagesError} isGenerating={isGenerating} />}

                    {/* Chat Input */}
                    <ChatInput
                        roomId={roomId}
                        personaId={room.personaId}
                        onMessageSent={handleManualMessage}
                        onSynthesizing={setIsGenerating}
                        onMessageStream={handleStreamAppend}
                        lastMessageTime={sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].createdAt : undefined}
                    />
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
                    {!isMobile && <ChatWindow messages={sortedMessages} loading={messagesLoading} error={messagesError} isGenerating={isGenerating} />}

                    {/* Chat Input */}
                    <ChatInput
                        roomId={roomId}
                        personaId={room.personaId}
                        onMessageSent={handleManualMessage}
                        onSynthesizing={setIsGenerating}
                        onMessageStream={handleStreamAppend}
                        lastMessageTime={sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].createdAt : undefined}
                    />
                </div>
            )}
        </>
    );
}