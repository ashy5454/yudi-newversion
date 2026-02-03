"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoom } from "@/hooks/useRoom";
import { usePersona } from "@/hooks/usePersona";
import { useAuth } from "@/components/AuthContext";
import { auth } from "@/lib/firebase/firebase";
import { useTyping } from "@/contexts/TypingContext";
import { Room, Persona, Message } from "@/lib/firebase/dbTypes";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatWindow from "./ChatWindow";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { PhoneIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMessage } from "@/hooks/useMessage";
import { MessageClientDb, RoomClientDb } from "@/lib/firebase/clientDb";

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
    const { setTyping } = useTyping();
    const [room, setRoom] = useState<Room | null>(null);
    const [persona, setPersona] = useState<Persona | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const initMessageSentRef = useRef<Set<string>>(new Set()); // Track which rooms already got initial message
    const localMessageIdsRef = useRef<Set<string>>(new Set()); // Track locally created message IDs to prevent subscription overwriting
    const hasCheckedInRef = useRef<Set<string>>(new Set()); // Track which rooms already got 4-hour check-in
    const messagesLoadedRef = useRef<Set<string>>(new Set()); // Track which rooms have loaded messages
    const abortCheckInRef = useRef<Map<string, boolean>>(new Map()); // 🛡️ KILL SWITCH: Track if user typed during check-in

    const roomId = params?.roomId as string;

    // Helper function to update both local state and typing context
    const updateGeneratingState = (generating: boolean) => {
        setIsGenerating(generating);
        if (roomId) {
            setTyping(roomId, generating);
        }
    };

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
    // 🧠 "FRESH START" PROTOCOL: Ignore old history, send welcome back message
    useEffect(() => {
        // 🛑 SAFETY CHECK: Don't run if no messages exist or already checked in
        if (!roomId || sortedMessages.length === 0 || hasCheckedInRef.current.has(roomId)) {
            return;
        }

        // 🛡️ DUPLICATE PREVENTION: Only prevent if check-in was sent in the last 30 seconds (prevent rapid duplicates on refresh)
        // BUT: Always allow check-in after 4+ hours, NO EXCEPTIONS - user explicitly wants this
        const welcomeBackKey = `welcomeBack_${roomId}`;
        const lastCheckInTime = typeof window !== 'undefined' ? sessionStorage.getItem(`${welcomeBackKey}_time`) : null;
        if (lastCheckInTime) {
            const timeSinceLastCheckIn = Date.now() - parseInt(lastCheckInTime, 10);
            // Only skip if check-in was sent less than 30 seconds ago (prevent rapid duplicates on refresh)
            // After 30 seconds, always allow check-in if 4+ hours have passed
            if (timeSinceLastCheckIn < 30000) {
                console.log(`[Check-in] Skipping: Check-in sent ${Math.floor(timeSinceLastCheckIn / 1000)}s ago (too recent, preventing duplicate)`);
                return;
            }
            // If more than 30 seconds have passed, clear the lock and allow check-in
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem(`${welcomeBackKey}_time`);
            }
        }

        const lastMsg = sortedMessages[sortedMessages.length - 1];
        const now = Date.now();

        // ✅ Use the fixed helper
        const lastMsgTime = getMessageTime(lastMsg);

        // Calculate gap
        const hoursSinceLastMsg = (now - lastMsgTime) / (1000 * 60 * 60);

        // 🛑 HARD FIX #1: STRICTLY DISABLE check-in if last message is less than 4 hours old
        // This stops 'Ghost' messages from appearing in the AI's history
        if (hoursSinceLastMsg < 4) {
            console.log(`[Check-in] Skipping: Last message is only ${hoursSinceLastMsg.toFixed(2)} hours old (need 4+ hours)`);
            return;
        }

        // 🛑 SANITY CHECK: 
        // If the gap is massive (> 1 year), it's a bug (1970 issue). Ignore it.
        // Only trigger if gap is > 4 hours AND < 500 hours (approx 20 days)
        if (hoursSinceLastMsg > 4 && hoursSinceLastMsg < 500) {
            hasCheckedInRef.current.add(roomId); // Mark as done so it doesn't spam on re-renders

            // Set session lock with timestamp to prevent rapid duplicates (but allow after 4+ hours)
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(`${welcomeBackKey}_time`, Date.now().toString());
            }

            // 🛡️ Initialize kill switch for this room
            abortCheckInRef.current.set(roomId, false);

            const personaIdForCheckIn = room?.personaId || (sortedMessages.length > 0 && sortedMessages[0].personaId ? sortedMessages[0].personaId : '');
            if (!personaIdForCheckIn) {
                console.warn("Cannot send check-in: No personaId available");
                return;
            }

            // Clear any cached greeting data before generating new check-in
            if (typeof window !== 'undefined') {
                const cacheKey = `yudi_cached_welcome_${roomId}`;
                localStorage.removeItem(cacheKey);
            }

            // TYPING INDICATOR: Show typing bubble immediately before message appears
            updateGeneratingState(true);
            console.log("💬 [Preset] Showing typing indicator before check-in message");

            // 🎲 USE PRESET GREETING: No API call needed
            // ⏱️ Add minimal delay (500ms) to show typing indicator before message appears
            setTimeout(() => {
                import('@/lib/presets/welcomeGreetings').then(({ getRandomWelcomeGreeting }) => {
                    // 🛡️ KILL SWITCH CHECK: If user typed while we were waiting, abort
                    if (abortCheckInRef.current.get(roomId)) {
                        console.log("🛑 [Kill Switch] User typed during check-in wait - aborting check-in message");
                        updateGeneratingState(false);
                        return;
                    }

                    const checkInContent = getRandomWelcomeGreeting();
                    console.log(`🎲 [Preset] Selected random welcome greeting: "${checkInContent}"`);

                    // Use Date.now() to ensure we get a proper timestamp (milliseconds)
                    const checkInTimestamp = Date.now();

                    // Save to database immediately
                    const checkInMessageData = {
                        roomId,
                        personaId: personaIdForCheckIn,
                        senderType: "persona" as const,
                        content: checkInContent,
                        messageType: "text" as const,
                        isSent: true,
                    };

                    console.log(`💾 [Preset] Saving preset check-in message to DB:`, {
                        ...checkInMessageData,
                        contentPreview: checkInContent.substring(0, 50),
                        timestamp: checkInTimestamp
                    });

                    MessageClientDb.create(checkInMessageData, new Date(checkInTimestamp))
                        .then(async (messageId) => {
                            console.log(`✅ [Preset] Check-in message saved with ID: ${messageId}`);

                            // Update room's last message to move chat to top
                            await RoomClientDb.updateLastMessage(roomId, checkInContent);
                            console.log(`✅ [Preset] Room last message updated for check-in`);

                            // IMMEDIATE REFRESH: Force re-fetch to ensure message appears (optimized for speed)
                            try {
                                const immediateResult = await MessageClientDb.getByRoomId(roomId, 50);
                                console.log(`🔄 [Preset] Immediate re-fetch: ${immediateResult.messages?.length || 0} messages`);
                                if (immediateResult.messages) {
                                    const sorted = sortMessagesByTime(immediateResult.messages);
                                    setMessages(sorted);

                                    // Check if our message is in the list
                                    const hasOurMessage = sorted.some(m =>
                                        m.id === messageId ||
                                        (m.senderType === 'persona' && m.content === checkInContent)
                                    );

                                    if (hasOurMessage) {
                                        console.log(`✅ [Preset] Message confirmed in immediate refresh - hiding typing indicator`);
                                        updateGeneratingState(false);
                                    } else {
                                        console.warn(`⚠️ [Preset] Message NOT found in immediate refresh, will retry...`);
                                    }
                                }
                            } catch (immediateError) {
                                console.error("❌ [Preset] Error in immediate refresh:", immediateError);
                                updateGeneratingState(false);
                            }

                            // Second refresh: After 150ms (for DB propagation - optimized for speed)
                            setTimeout(async () => {
                                try {
                                    const result = await MessageClientDb.getByRoomId(roomId, 50);
                                    if (result.messages) {
                                        const sorted = sortMessagesByTime(result.messages);
                                        setMessages(sorted);

                                        const hasOurMessage = sorted.some(m =>
                                            m.id === messageId ||
                                            (m.senderType === 'persona' && m.content === checkInContent)
                                        );

                                        if (hasOurMessage) {
                                            console.log(`✅ [Preset] Message confirmed in delayed refresh - hiding typing indicator`);
                                            updateGeneratingState(false);
                                        } else {
                                            updateGeneratingState(false); // Hide anyway to prevent stuck typing indicator
                                        }
                                    }
                                } catch (refreshError) {
                                    console.error("❌ [Preset] Error refreshing messages:", refreshError);
                                    updateGeneratingState(false);
                                }
                            }, 150); // Optimized: Reduced from 300ms to 150ms for faster response
                        })
                        .catch((dbError) => {
                            console.error("❌ [Preset] Failed to save check-in message to DB:", dbError);
                            updateGeneratingState(false);
                            hasCheckedInRef.current.delete(roomId); // Allow retry
                        });
                }).catch((importError) => {
                    console.error("❌ [Preset] Failed to import welcome greetings:", importError);
                    updateGeneratingState(false);
                    hasCheckedInRef.current.delete(roomId); // Allow retry
                });
            }, 500); // 500ms delay for typing indicator (fast check-in)
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
            abortCheckInRef.current.delete(roomId); // Clear kill switch for new room
            updateGeneratingState(false); // Clear typing state when switching rooms
        }

        // Cleanup: Clear typing state when component unmounts or room changes
        return () => {
            if (roomId) {
                setTyping(roomId, false);
            }
        };
    }, [roomId, setTyping]);

    // Initial message fetch and subscribe to real-time message updates
    useEffect(() => {
        if (roomId && user?.uid && room) {
            // Explicitly fetch messages first to ensure they load
            const loadInitialMessages = async () => {
                if (!messagesLoadedRef.current.has(roomId)) {
                    try {
                        // Optimize: Fetch fewer messages initially for faster load (last 50 messages)
                        const result = await MessageClientDb.getByRoomId(roomId, 50);
                        if (result.messages && result.messages.length > 0) {
                            console.log(`✅ [Initial Load] Fetched ${result.messages.length} messages for room: ${roomId}`);
                            setMessages(sortMessagesByTime(result.messages));
                            messagesLoadedRef.current.add(roomId);
                        }
                    } catch (error) {
                        console.warn("Error fetching initial messages:", error);
                    }
                }
            };

            loadInitialMessages();

            // Subscribe to real-time updates - this fires immediately with existing messages
            const unsubscribe = MessageClientDb.onRoomMessagesChange(roomId, (updatedMessages) => {
                // Subscription received messages

                setMessages(prev => {
                    // If this is the first time we're loading messages for this room, use all subscription messages
                    // The subscription fires immediately with all existing messages
                    if (!messagesLoadedRef.current.has(roomId)) {
                        console.log(`✅ [Subscription] Initial load for room ${roomId}: ${updatedMessages.length} messages`);
                        messagesLoadedRef.current.add(roomId);
                        return sortMessagesByTime(updatedMessages);
                    }

                    // After initial load, only add NEW messages (deduplicate)
                    // 🛑 HARD FIX #2: Track processed message IDs to prevent duplicate processing
                    const processedIds = new Set<string>();

                    const filteredBackendMessages = updatedMessages.filter(newMessage => {
                        // A. BLOCK ID DUPLICATES (Standard) - Check both prev messages and processed set
                        // If we already have a message with this ID locally, skip it
                        const existingById = prev.some(m => m.id === newMessage.id);
                        if (existingById || localMessageIdsRef.current.has(newMessage.id) || processedIds.has(newMessage.id)) {
                            // Silently block duplicates - no logging needed
                            return false;
                        }

                        // Mark as processed to prevent duplicate processing in same filter run
                        processedIds.add(newMessage.id);

                        // Note: We'll hide typing indicator in useEffect when messages change

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
                                // Only log once per unique message to prevent spam
                                if (!processedIds.has(`duplicate_${newMessage.id}`)) {
                                    console.log("🛡️ Blocked duplicate user message from DB");
                                    processedIds.add(`duplicate_${newMessage.id}`);
                                }
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

                    // Message merge completed
                    if (filteredBackendMessages.length > 0) {
                        console.log(`📊 [Subscription] Added ${filteredBackendMessages.length} new messages`);
                    }

                    return sorted;
                });
            });
            return () => unsubscribe();
        }
    }, [roomId, user?.uid, room]);

    // Hide typing indicator when new AI messages arrive (after render, not during)
    // DELAY: Wait a bit to ensure message is fully rendered before hiding typing indicator
    useEffect(() => {
        if (!roomId || messages.length === 0 || !isGenerating) return;

        // Check if the last message is from the persona (AI) and has substantial content
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.senderType === 'persona' && lastMessage.content && lastMessage.content.trim().length > 10) {
            // Small delay to ensure message is fully rendered and visible before hiding typing indicator
            const hideTimer = setTimeout(() => {
                console.log(`✅ [useEffect] New AI message detected - hiding typing indicator after delay`);
                updateGeneratingState(false);
            }, 150); // Optimized: Reduced from 300ms to 150ms for faster response

            return () => clearTimeout(hideTimer);
        }
    }, [messages, roomId, isGenerating, updateGeneratingState]);


    const handleManualMessage = (message: any) => {
        // 🛡️ KILL SWITCH: If user sends a message while check-in is loading, abort it
        if (abortCheckInRef.current.has(roomId || '')) {
            abortCheckInRef.current.set(roomId || '', true);
            updateGeneratingState(false); // Hide typing indicator immediately
            console.log("🛑 [Kill Switch] User sent message - aborting check-in for room:", roomId);
        }

        // Clear any cached greeting data when user sends a message
        if (typeof window !== 'undefined' && roomId) {
            const cacheKey = `yudi_cached_welcome_${roomId}`;
            localStorage.removeItem(cacheKey);
        }

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
        // Keep typing indicator ON during streaming
        // It will be hidden when the subscription receives the complete message from DB
        // Don't hide it here - let the subscription handle it
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
                            textModel: "gemini-2.5-flash",
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

                    // Check if this is a new room and send initial message after 1 second
                    // Prevent duplicate calls using ref
                    if (!initMessageSentRef.current.has(roomId)) {
                        initMessageSentRef.current.add(roomId);

                        setTimeout(async () => {
                            try {
                                // 🛑 Get fresh auth token for this request
                                let authToken: string | null = null;
                                try {
                                    const currentUser = auth.currentUser;
                                    if (currentUser) {
                                        authToken = await currentUser.getIdToken();
                                    }
                                } catch (tokenError) {
                                    console.error("[ChatInterface] Failed to get auth token:", tokenError);
                                }

                                const initResponse = await fetch('/api/chat/init', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...(authToken && { 'Authorization': `Bearer ${authToken}` }), // 🛑 Send token in Authorization header
                                    },
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
                        }, 1000); // 1-second delay for fast initial greeting
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
                        textModel: "gemini-2.5-flash",
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
                        onSynthesizing={(isSynthesizing) => updateGeneratingState(isSynthesizing)}
                        onMessageStream={handleStreamAppend}
                        lastMessageTime={sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].createdAt : undefined}
                        onUserTyping={() => {
                            // 🛡️ KILL SWITCH: If user starts typing during check-in, abort it
                            if (abortCheckInRef.current.has(roomId)) {
                                abortCheckInRef.current.set(roomId, true);
                                updateGeneratingState(false);
                                console.log("🛑 [Kill Switch] User started typing - aborting check-in");
                            }
                        }}
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
                        onSynthesizing={(isSynthesizing) => updateGeneratingState(isSynthesizing)}
                        onMessageStream={handleStreamAppend}
                        lastMessageTime={sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].createdAt : undefined}
                        onUserTyping={() => {
                            // 🛡️ KILL SWITCH: If user starts typing during check-in, abort it
                            if (abortCheckInRef.current.has(roomId)) {
                                abortCheckInRef.current.set(roomId, true);
                                updateGeneratingState(false);
                                console.log("🛑 [Kill Switch] User started typing - aborting check-in");
                            }
                        }}
                    />
                </div>
            )}
        </>
    );
}