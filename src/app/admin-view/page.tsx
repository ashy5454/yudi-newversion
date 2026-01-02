"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/firebase";
import { collection, getDocs, query, limit, orderBy, where, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthContext";

export default function AdminDashboard() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showVoiceOnly, setShowVoiceOnly] = useState(false);
    const { user, loading: authLoading } = useAuth();

    // 🔒 SECURITY
    const [inputPassword, setInputPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const fetchAllChats = async () => {
            try {
                setLoading(true);
                console.log("🔍 Starting Universal Dashboard: Fetching from both subcollection and root collection...");

                // 1. Get Rooms (Sorted by newest first)
                const roomsRef = collection(db, "rooms");
                let roomsQuery;
                try {
                    roomsQuery = query(roomsRef, orderBy("lastMessageAt", "desc"), limit(100));
                } catch (orderError) {
                    console.warn("Could not order by lastMessageAt, using default order:", orderError);
                    roomsQuery = query(roomsRef, limit(100));
                }
                const roomsSnapshot = await getDocs(roomsQuery);
                console.log(`📦 Found ${roomsSnapshot.docs.length} rooms`);

                // 2. Fetch persona names for better display
                const personaCache = new Map<string, string>();

                const allData = await Promise.all(
                    roomsSnapshot.docs.map(async (roomDoc) => {
                        const roomId = roomDoc.id;
                        const roomData = roomDoc.data();

                        // Try to get persona name from cache or fetch it
                        let personaName = "Unknown Persona";
                        if (roomData.personaId) {
                            if (personaCache.has(roomData.personaId)) {
                                personaName = personaCache.get(roomData.personaId)!;
                            } else {
                                try {
                                    const personaDocRef = doc(db, "personas", roomData.personaId);
                                    const personaDocSnap = await getDoc(personaDocRef);
                                    if (personaDocSnap.exists()) {
                                        const personaData = personaDocSnap.data();
                                        personaName = personaData.name || personaData.title || "Unknown Persona";
                                        personaCache.set(roomData.personaId, personaName);
                                    }
                                } catch (personaError) {
                                    console.warn(`Could not fetch persona ${roomData.personaId}:`, personaError);
                                    personaName = roomData.personaId.substring(0, 10) + "...";
                                }
                            }
                        }

                        // 🕵️‍♂️ LOCATION A: Check Sub-collection (Where new messages are saved: rooms/{roomId}/messages)
                        let subMessages: any[] = [];
                        try {
                            const subCollectionRef = collection(db, "rooms", roomId, "messages");
                            const subMsgQuery = query(subCollectionRef, orderBy("createdAt", "asc"));
                            const subSnap = await getDocs(subMsgQuery);
                            subMessages = subSnap.docs.map((m) => {
                                const data = m.data();
                                let createdAt = data.createdAt;
                                if (createdAt?.toDate) {
                                    createdAt = createdAt.toDate();
                                } else if (createdAt?.seconds) {
                                    createdAt = new Date(createdAt.seconds * 1000);
                                } else if (createdAt instanceof Date) {
                                    createdAt = createdAt;
                                } else if (typeof createdAt === 'number') {
                                    createdAt = new Date(createdAt);
                                }
                                return {
                                    ...data,
                                    createdAt,
                                    id: m.id,
                                    _source: 'sub',
                                };
                            });
                            console.log(`📨 Room ${roomId}: Found ${subMessages.length} messages in subcollection`);
                        } catch (subError: any) {
                            console.warn(`Could not fetch from subcollection for room ${roomId}:`, subError);
                        }

                        // 🕵️‍♂️ LOCATION B: Check Root Collection (For backward compatibility: messages with roomId field)
                        let rootMessages: any[] = [];
                        try {
                            const rootCollectionRef = collection(db, "messages");
                            let rootMsgQuery;
                            try {
                                rootMsgQuery = query(
                                    rootCollectionRef,
                                    where("roomId", "==", roomId),
                                    orderBy("createdAt", "asc")
                                );
                            } catch (orderByError: any) {
                                // If orderBy fails (no index), try without it
                                console.warn(`OrderBy failed for root messages, trying without:`, orderByError);
                                rootMsgQuery = query(rootCollectionRef, where("roomId", "==", roomId));
                            }
                            const rootSnap = await getDocs(rootMsgQuery);
                            rootMessages = rootSnap.docs.map((m) => {
                                const data = m.data();
                                let createdAt = data.createdAt;
                                if (createdAt?.toDate) {
                                    createdAt = createdAt.toDate();
                                } else if (createdAt?.seconds) {
                                    createdAt = new Date(createdAt.seconds * 1000);
                                } else if (createdAt instanceof Date) {
                                    createdAt = createdAt;
                                } else if (typeof createdAt === 'number') {
                                    createdAt = new Date(createdAt);
                                }
                                return {
                                    ...data,
                                    createdAt,
                                    id: m.id,
                                    _source: 'root',
                                };
                            });
                            if (rootMessages.length > 0) {
                                console.log(`📨 Room ${roomId}: Found ${rootMessages.length} messages in root collection`);
                            }
                        } catch (rootError: any) {
                            console.warn(`Could not fetch from root collection for room ${roomId}:`, rootError);
                        }

                        // 🤝 MERGE & DEDUPLICATE both sources
                        const messageMap = new Map<string, any>();
                        [...subMessages, ...rootMessages].forEach((msg) => {
                            // Use ID as key for deduplication
                            if (!messageMap.has(msg.id)) {
                                messageMap.set(msg.id, msg);
                            }
                        });
                        let allMessages = Array.from(messageMap.values());

                        // 🕵️‍♂️ SORT by createdAt (client-side final sort for reliability)
                        allMessages.sort((a: any, b: any) => {
                            const timeA = a.createdAt instanceof Date
                                ? a.createdAt.getTime()
                                : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
                            const timeB = b.createdAt instanceof Date
                                ? b.createdAt.getTime()
                                : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
                            return timeA - timeB;
                        });

                        console.log(`📨 Room ${roomId}: Total ${allMessages.length} messages after merge (${subMessages.length} sub + ${rootMessages.length} root)`);

                        return {
                            id: roomId,
                            personaName: personaName,
                            userName: roomData.userName || "User",
                            ...roomData,
                            messages: allMessages,
                        };
                    })
                );

                console.log(`✅ Universal Dashboard: Fetched ${allData.length} rooms, ${allData.reduce((sum, r) => sum + r.messages.length, 0)} total messages`);
                setLogs(allData);
            } catch (error) {
                console.error("❌ Error fetching data:", error);
                alert(`Error fetching data: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setLoading(false);
            }
        };

        fetchAllChats();
    }, [isAuthenticated, user]);

    // 🔒 AUTHENTICATION CHECK
    if (authLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4 p-8">
                <h1 className="text-2xl font-bold">Yudi Admin</h1>
                <p className="text-red-400 text-center max-w-md">
                    ⚠️ You must be signed in to Google to access the admin dashboard.
                </p>
                <p className="text-gray-400 text-sm text-center max-w-md">
                    Please sign in through the main app first, then return to this page.
                </p>
                <a
                    href="/"
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                    Go to Main App
                </a>
            </div>
        );
    }

    // PASSWORD SCREEN
    if (!isAuthenticated) {
        const userId = user.uid;
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4 p-8">
                <h1 className="text-2xl font-bold">Yudi Admin</h1>
                <p className="text-gray-400 text-sm">Signed in as: {user.email || user.displayName}</p>

                {/* Display User ID */}
                <div className="bg-gray-900 border border-gray-700 rounded-md p-4 max-w-lg w-full">
                    <p className="text-xs text-gray-500 mb-2">Your Firebase User ID (for admin access):</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black p-2 rounded text-sm text-green-400 break-all">
                            {userId}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(userId);
                                alert("Copied to clipboard!");
                            }}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                        >
                            Copy
                        </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                        To grant admin access, add this ID to the <code className="bg-black px-1 rounded">admins</code> collection in Firestore.
                    </p>
                </div>

                <input
                    type="password"
                    className="bg-gray-900 border border-gray-700 p-3 rounded-md w-64 text-center text-white focus:outline-none focus:border-green-500"
                    placeholder="Enter Password"
                    value={inputPassword}
                    onChange={(e) => {
                        setInputPassword(e.target.value);
                        if (e.target.value === "yudi123") setIsAuthenticated(true);
                    }}
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div>Loading Data...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-green-400 flex items-center gap-2">
                            🧠 Universal Data
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Merging Root & Sub-collections automatically • Viewing latest {logs.length} conversations
                        </p>
                    </div>
                    <button
                        onClick={() => setShowVoiceOnly(!showVoiceOnly)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${showVoiceOnly
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                            }`}
                    >
                        {showVoiceOnly ? "🎤 Showing Voice Only" : "👁️ Showing All Messages"}
                    </button>
                </div>

                <div className="grid gap-8">
                    {logs.map((log) => {
                        // Filter messages if "Voice Only" is selected
                        const visibleMessages = showVoiceOnly
                            ? log.messages.filter(
                                (m: any) =>
                                    m.type === "voice" ||
                                    m.messageType === "voice_transcript" ||
                                    m.type === "voice_transcript"
                            )
                            : log.messages;

                        // Don't show empty rooms if filtering
                        if (showVoiceOnly && visibleMessages.length === 0) return null;

                        return (
                            <div
                                key={log.id}
                                className="border border-gray-800 rounded-xl bg-gray-900/40 overflow-hidden"
                            >
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-gray-900/80">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-black font-bold text-xs">
                                            {log.personaName?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-200">{log.personaName}</h3>
                                            <div className="text-xs text-gray-500 font-mono">
                                                {log.id.substring(0, 8)}... • {log.userName}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                                        {visibleMessages.length} msgs
                                    </span>
                                </div>

                                <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {visibleMessages.length === 0 ? (
                                        <div className="text-center text-gray-500 py-8">
                                            No messages found in this conversation.
                                        </div>
                                    ) : (
                                        visibleMessages.map((msg: any, i: number) => {
                                            const isUser = msg.role === "user" || msg.sender === "user" || msg.senderType === "user";
                                            const content = msg.content || msg.text || "";
                                            const isVoice =
                                                msg.type === "voice" ||
                                                msg.messageType === "voice_transcript" ||
                                                msg.type === "voice_transcript";

                                            return (
                                                <div
                                                    key={msg.id || i}
                                                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                                                >
                                                    <div
                                                        className={`relative max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${isUser
                                                                ? "bg-gray-800 text-gray-200 rounded-tr-sm"
                                                                : "bg-blue-900/20 text-blue-100 border border-blue-900/30 rounded-tl-sm"
                                                            }`}
                                                    >
                                                        {/* 🎤 VOICE BADGE */}
                                                        {isVoice && (
                                                            <span className="absolute -top-3 -right-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                                                🎤 Voice
                                                            </span>
                                                        )}
                                                        {content}
                                                    </div>
                                                    <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider font-medium ml-1 mr-1">
                                                        {msg.role || msg.sender || msg.senderType || "unknown"}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {logs.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-12">
                        <p>No conversations found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
