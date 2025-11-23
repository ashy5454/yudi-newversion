"use client";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoom } from "@/hooks/useRoom";
import { useAuth } from "@/components/AuthContext";
import { Room } from "@/lib/firebase/dbTypes";
import { ScrollArea } from "../ui/scroll-area";
import AppListItem from "./AppListItem";
import AppHeader from "./AppHeader";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function AppList() {
    const router = useRouter();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const { rooms, loading, error, fetchUserRooms, subscribeToUserRooms, clearRooms } = useRoom();
    const [filteredRooms, setFilteredRooms] = useState<Room[]>(rooms);

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
            return () => unsubscribe();
            clearRooms();
        }
    }, [user?.uid, subscribeToUserRooms, clearRooms]);

    // Update filtered rooms when rooms change - show only latest room per persona
    useEffect(() => {
        // Helper to get timestamp from Date or Firestore Timestamp
        const getTimestamp = (date: any): number => {
            if (!date) return 0;
            if (date instanceof Date) return date.getTime();
            if (date.toDate && typeof date.toDate === 'function') return date.toDate().getTime();
            if (date.seconds) return date.seconds * 1000;
            return 0;
        };

        // Group rooms by personaId and keep only the most recent one
        const roomsByPersona = new Map<string, Room>();
        
        rooms.forEach(room => {
            const personaId = room.personaId;
            if (!personaId) return;
            
            const existingRoom = roomsByPersona.get(personaId);
            if (!existingRoom) {
                roomsByPersona.set(personaId, room);
            } else {
                // Compare timestamps - use lastMessageAt or createdAt
                const roomTime = getTimestamp(room.lastMessageAt) || getTimestamp(room.createdAt);
                const existingTime = getTimestamp(existingRoom.lastMessageAt) || getTimestamp(existingRoom.createdAt);
                
                if (roomTime > existingTime) {
                    roomsByPersona.set(personaId, room);
                }
            }
        });
        
        // Convert map to array and sort by most recent activity
        const uniqueRooms = Array.from(roomsByPersona.values()).sort((a, b) => {
            const timeA = getTimestamp(a.lastMessageAt) || getTimestamp(a.createdAt);
            const timeB = getTimestamp(b.lastMessageAt) || getTimestamp(b.createdAt);
            return timeB - timeA;
        });
        
        setFilteredRooms(uniqueRooms);
    }, [rooms]);

    // Handle search - search through unique rooms only
    const handleSearch = (searchTerm: string) => {
        // Helper to get timestamp from Date or Firestore Timestamp
        const getTimestamp = (date: any): number => {
            if (!date) return 0;
            if (date instanceof Date) return date.getTime();
            if (date.toDate && typeof date.toDate === 'function') return date.toDate().getTime();
            if (date.seconds) return date.seconds * 1000;
            return 0;
        };

        // Get unique rooms first
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
        
        const uniqueRooms = Array.from(roomsByPersona.values());
        
        // Apply search filter
        if (!searchTerm.trim()) {
            setFilteredRooms(uniqueRooms.sort((a, b) => {
                const timeA = getTimestamp(a.lastMessageAt) || getTimestamp(a.createdAt);
                const timeB = getTimestamp(b.lastMessageAt) || getTimestamp(b.createdAt);
                return timeB - timeA;
            }));
            return;
        }

        const filtered = uniqueRooms.filter(room =>
            room.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.lastMessageContent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.id.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => {
            const timeA = getTimestamp(a.lastMessageAt) || getTimestamp(a.createdAt);
            const timeB = getTimestamp(b.lastMessageAt) || getTimestamp(b.createdAt);
            return timeB - timeA;
        });
        
        setFilteredRooms(filtered);
    };

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
                                            <div className="w-10 h-10muted rounded-full"></div>
                                            <div className="flex-1 px-4">
                                                <div className="h-4g-muted rounded mb-2"></div>
                                                <div className="h-3bg-muted rounded w-3/4"></div>
                                            </div>
                                            <div className="w-4 h-4muted rounded-full"></div>
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
                                    <AppListItem key={room.id} room={room} />
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
                                            <div className="w-10 h-10muted rounded-full"></div>
                                            <div className="flex-1 px-4">
                                                <div className="h-4g-muted rounded mb-2"></div>
                                                <div className="h-3bg-muted rounded w-3/4"></div>
                                            </div>
                                            <div className="w-4 h-4muted rounded-full"></div>
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
                                    <AppListItem key={room.id} room={room} />
                                ))
                            )}
                        </ScrollArea>
                    </div>
                </div>
            )}
        </>
    );
}
