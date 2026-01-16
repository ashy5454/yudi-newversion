"use client";
import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoom } from "@/hooks/useRoom";
import { useAuth } from "@/components/AuthContext";
import { Room } from "@/lib/firebase/dbTypes";
import { ScrollArea } from "../ui/scroll-area";
import AppListItem from "./AppListItem";
import AppHeader from "./AppHeader";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

// Helper function extracted outside component to avoid recreation
const getTimestamp = (date: any): number => {
    if (!date) return 0;
    if (date instanceof Date) return date.getTime();
    if (date.toDate && typeof date.toDate === 'function') return date.toDate().getTime();
    if (date.seconds) return date.seconds * 1000;
    return 0;
};

export default function AppList() {
    const router = useRouter();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const { rooms, loading, error, fetchUserRooms, subscribeToUserRooms, clearRooms } = useRoom();

    // Fetch user rooms on component mount
    useEffect(() => {
        if (user?.uid) {
            fetchUserRooms(user.uid);
        }
    }, [user?.uid, fetchUserRooms]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = subscribeToUserRooms(user.uid);
            return () => {
                unsubscribe();
                clearRooms();
            };
        }
    }, [user?.uid, subscribeToUserRooms, clearRooms]);

    // Memoize unique rooms computation (grouped by personaId)
    const uniqueRooms = useMemo(() => {
        const roomsByPersona = new Map<string, Room>();
        
        rooms.forEach(room => {
            const personaId = room.personaId;
            if (!personaId) return;
            
            const existingRoom = roomsByPersona.get(personaId);
            if (!existingRoom) {
                roomsByPersona.set(personaId, room);
            } else {
                const roomTime = getTimestamp(room.lastMessageAt) || getTimestamp(room.createdAt);
                const existingTime = getTimestamp(existingRoom.lastMessageAt) || getTimestamp(existingRoom.createdAt);
                
                if (roomTime > existingTime) {
                    roomsByPersona.set(personaId, room);
                }
            }
        });
        
        return Array.from(roomsByPersona.values()).sort((a, b) => {
            const timeA = getTimestamp(a.lastMessageAt) || getTimestamp(a.createdAt);
            const timeB = getTimestamp(b.lastMessageAt) || getTimestamp(b.createdAt);
            return timeB - timeA;
        });
    }, [rooms]);

    const [searchTerm, setSearchTerm] = useState('');
    
    // 🎲 Dynamic "Online" Status - Shuffles between personas to look human
    const [onlineRoomIds, setOnlineRoomIds] = useState<Set<string>>(new Set());
    const shuffleIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Memoize filtered rooms based on search term
    const filteredRooms = useMemo(() => {
        if (!searchTerm.trim()) {
            return uniqueRooms;
        }
        
        const lowerSearch = searchTerm.toLowerCase();
        return uniqueRooms.filter(room =>
            room.title?.toLowerCase().includes(lowerSearch) ||
            room.lastMessageContent?.toLowerCase().includes(lowerSearch) ||
            room.id.toLowerCase().includes(lowerSearch)
        );
    }, [uniqueRooms, searchTerm]);

    // 🎲 Shuffle "online" status between personas dynamically (human-like behavior)
    useEffect(() => {
        if (filteredRooms.length === 0) return;

        // Initial shuffle
        const shuffleOnlineStatus = () => {
            // Randomly select 2-4 personas to show "online" (not always 3)
            const onlineCount = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
            const shuffled = [...filteredRooms].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(onlineCount, filteredRooms.length));
            setOnlineRoomIds(new Set(selected.map(room => room.id)));
        };

        // Shuffle immediately
        shuffleOnlineStatus();

        // Shuffle every 15-25 seconds (random interval for human-like behavior)
        const scheduleNextShuffle = () => {
            const delay = Math.floor(Math.random() * 10000) + 15000; // 15-25 seconds
            shuffleIntervalRef.current = setTimeout(() => {
                shuffleOnlineStatus();
                scheduleNextShuffle();
            }, delay);
        };

        scheduleNextShuffle();

        // Cleanup
        return () => {
            if (shuffleIntervalRef.current) {
                clearTimeout(shuffleIntervalRef.current);
            }
        };
    }, [filteredRooms]);

    // Handle search - memoized callback for performance
    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
    }, []);

    return (
        <>
            {isMobile ? (
                <div className="fixed top-0 left-0 right-0 w-full h-[calc(100vh-76px)] py-2">
                    <AppHeader onSearch={handleSearch} />
                    {/* Chat List */}
                    <div className="mt-2 flex flex-col gap-2 mx-1 md:mx-0">
                        <ScrollArea className="h-[calc(100vh-256px)] rounded-lg overflow-hidden bg-transparent">
                            {loading ? (
                                // Loading skeleton
                                Array.from({ length: 5 }, (_, index) => (
                                    <div key={index} className="animate-pulse">
                                        <div className="bg-background/60 rounded-xl mb-2 p-2 flex flex-row items-center justify-between mx-1 md:mx-0">
                                            <div className="w-10 h-10 bg-muted rounded-full"></div>
                                            <div className="flex-1 px-4">
                                                <div className="h-4 bg-muted rounded mb-2"></div>
                                                <div className="h-3 bg-muted rounded w-3/4"></div>
                                            </div>
                                            <div className="w-4 h-4 bg-muted rounded-full"></div>
                                        </div>
                                    </div>
                                ))
                            ) : error ? (
                                <div className="text-center text-muted-foreground p-4">
                                    Error loading rooms: {error}
                                </div>
                            ) : filteredRooms.length === 0 ? (
                                <div className="text-center text-muted-foreground p-4">
                                    <p className="mb-2">No rooms match your search.</p>
                                    <Button variant="secondary" onClick={() => router.push("/m/persona")}>
                                        Explore Personas
                                    </Button>
                                </div>
                            ) : (
                                filteredRooms.map((room: Room) => (
                                    <AppListItem key={room.id} room={room} showOnline={onlineRoomIds.has(room.id)} />
                                ))
                            )}
                        </ScrollArea>
                    </div>
                </div>
            ) : (
                <div className="fixed top-0 left-16 w-64 h-screen py-2">
                    <AppHeader onSearch={handleSearch} />
                    {/* Chat List */}
                    <div className="mt-2 flex flex-col gap-2">
                        <ScrollArea className="h-[calc(100vh-180px)] rounded-lg overflow-hidden bg-transparent">
                            {loading ? (
                                // Loading skeleton
                                Array.from({ length: 5 }, (_, index) => (
                                    <div key={index} className="animate-pulse">
                                        <div className="bg-background/60 rounded-xl mb-2 p-2 flex flex-row items-center justify-between">
                                            <div className="w-10 h-10 bg-muted rounded-full"></div>
                                            <div className="flex-1 px-4">
                                                <div className="h-4 bg-muted rounded mb-2"></div>
                                                <div className="h-3 bg-muted rounded w-3/4"></div>
                                            </div>
                                            <div className="w-4 h-4 bg-muted rounded-full"></div>
                                        </div>
                                    </div>
                                ))
                            ) : error ? (
                                <div className="text-center text-muted-foreground p-4">
                                    Error loading rooms: {error}
                                </div>
                            ) : filteredRooms.length === 0 ? (
                                <div className="text-center text-muted-foreground p-4">
                                    <p className="mb-2">No rooms match your search.</p>
                                    <Button variant="secondary" onClick={() => router.push("/m/persona")}>
                                        Explore Personas
                                    </Button>
                                </div>
                            ) : (
                                filteredRooms.map((room: Room) => (
                                    <AppListItem key={room.id} room={room} showOnline={onlineRoomIds.has(room.id)} />
                                ))
                            )}
                        </ScrollArea>
                    </div>
                </div>
            )}
        </>
    );
}
