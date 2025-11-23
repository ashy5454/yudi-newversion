'use client';

import { useState, useCallback } from 'react';
import { DocumentSnapshot, Unsubscribe } from 'firebase/firestore';
import { useAuth } from '@/components/AuthContext';
import { RoomClientDb } from '@/lib/firebase/clientDb';
import { Room } from '@/lib/firebase/dbTypes';

interface RoomFormData {
    userId: string;
    personaId: string;
    title?: string;
    avatarUrl?: string;
    bodyColor?: string;
}

interface UseRoomReturn {
    // State
    rooms: Room[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;

    // Single room operations
    room: Room | null;
    fetchRoom: (id: string) => Promise<Room | null>;

    // CRUD operations
    createRoom: (data: RoomFormData) => Promise<string | null>;
    updateRoom: (id: string, updates: Partial<Room>) => Promise<boolean>;
    deleteRoom: (id: string) => Promise<boolean>;
    archiveRoom: (id: string) => Promise<boolean>;
    unarchiveRoom: (id: string) => Promise<boolean>;

    // Fetch operations
    fetchRooms: (limit?: number, reset?: boolean) => Promise<void>;
    fetchUserRooms: (userId: string) => Promise<void>;
    fetchArchivedRooms: (userId: string) => Promise<void>;

    // Utility functions
    clearRooms: () => void;
    refreshRooms: () => Promise<void>;

    // Real-time subscriptions
    subscribeToUserRooms: (userId: string) => () => void;
    subscribeToRoom: (roomId: string) => () => void;
}

export const useRoom = (): UseRoomReturn => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

    // Error handler
    const handleError = (operation: string, err: any) => {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(`${operation}: ${errorMessage}`);
        console.error(`${operation}:`, err);
    };

    // Clear error
    const clearError = () => setError(null);

    // Create room
    const createRoom = useCallback(async (data: RoomFormData): Promise<string | null> => {
        if (!user) {
            setError('You must be logged in to create a room');
            return null;
        }

        setLoading(true);
        clearError();

        try {
            const roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: data.userId,
                personaId: data.personaId,
                avatarUrl: data.avatarUrl,
                bodyColor: data.bodyColor,
                title: data.title,
                messageCount: 0,
                isArchived: false
            };

            const id = await RoomClientDb.create(roomData);

            // Refresh the rooms list
            await refreshRooms();

            return id;
        } catch (err) {
            handleError('Create room', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Update room
    const updateRoom = useCallback(async (id: string, updates: Partial<Room>): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to update a room');
            return false;
        }

        setLoading(true);
        clearError();

        try {
            await RoomClientDb.update(id, updates);

            // Update local state
            setRooms(prev =>
                prev.map(r => r.id === id ? { ...r, ...updates } : r)
            );

            if (room?.id === id) {
                setRoom(prev => prev ? { ...prev, ...updates } : null);
            }
            return true;
        } catch (err) {
            handleError('Update room', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, room]);

    // Delete room
    const deleteRoom = useCallback(async (id: string): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to delete a room');
            return false;
        }

        setLoading(true);
        clearError();

        try {
            await RoomClientDb.delete(id);

            // Remove from local state
            setRooms(prev => prev.filter(r => r.id !== id));

            if (room?.id === id) {
                setRoom(null);
            }
            return true;
        } catch (err) {
            handleError('Delete room', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, room]);

    // Archive room
    const archiveRoom = useCallback(async (id: string): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to archive a room');
            return false;
        }

        setLoading(true);
        clearError();

        try {
            await RoomClientDb.archive(id);

            // Update local state
            setRooms(prev =>
                prev.map(r => r.id === id ? { ...r, isArchived: true } : r)
            );

            if (room?.id === id) {
                setRoom(prev => prev ? { ...prev, isArchived: true } : null);
            }
            return true;
        } catch (err) {
            handleError('Archive room', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, room]);

    // Unarchive room
    const unarchiveRoom = useCallback(async (id: string): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to unarchive a room');
            return false;
        }

        setLoading(true);
        clearError();

        try {
            await RoomClientDb.unarchive(id);

            // Update local state
            setRooms(prev =>
                prev.map(r => r.id === id ? { ...r, isArchived: false } : r)
            );

            if (room?.id === id) {
                setRoom(prev => prev ? { ...prev, isArchived: false } : null);
            }
            return true;
        } catch (err) {
            handleError('Unarchive room', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, room]);

    // Fetch single room
    const fetchRoom = useCallback(async (id: string): Promise<Room | null> => {
        setLoading(true);
        clearError();

        try {
            const data = await RoomClientDb.getById(id);
            setRoom(data);
            return data;
        } catch (err) {
            handleError('Fetch room', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch user's rooms
    const fetchUserRooms = useCallback(async (userId: string): Promise<void> => {
        setLoading(true);
        clearError();

        try {
            const data = await RoomClientDb.getByUserId(userId);
            setRooms(data);
            setHasMore(false);
        } catch (err) {
            handleError('Fetch user rooms', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch rooms with pagination
    const fetchRooms = useCallback(async (limit = 8, reset = false): Promise<void> => {
        if (loading || (!hasMore && !reset)) return;

        setLoading(true);
        clearError();

        try {
            // For now, we'll use fetchUserRooms since we need a userId
            // In a real app, you might want to fetch public rooms or rooms the user has access to
            if (user) {
                await fetchUserRooms(user.uid);
            }
        } catch (err) {
            handleError('Fetch rooms', err);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, user, fetchUserRooms]);

    // Fetch archived rooms
    const fetchArchivedRooms = useCallback(async (userId: string): Promise<void> => {
        setLoading(true);
        clearError();

        try {
            const data = await RoomClientDb.getArchivedByUserId(userId);
            setRooms(data);
            setHasMore(false);
        } catch (err) {
            handleError('Fetch archived rooms', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Clear rooms
    const clearRooms = useCallback(() => {
        setRooms([]);
        setLastDoc(null);
        setHasMore(true);
        clearError();
    }, []);

    // Refresh rooms
    const refreshRooms = useCallback(async (): Promise<void> => {
        setLastDoc(null);
        setHasMore(true);
        if (user) {
            await fetchUserRooms(user.uid);
        }
    }, [fetchUserRooms, user]);

    // Subscribe to user rooms
    const subscribeToUserRooms = useCallback((userId: string) => {
        let unsubscribe: Unsubscribe | null = null;

        const subscribe = () => {
            unsubscribe = RoomClientDb.onUserRoomsChange(userId, (updatedRooms) => {
                setRooms(updatedRooms);
            });
        };

        subscribe();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Subscribe to specific room
    const subscribeToRoom = useCallback((roomId: string) => {
        let unsubscribe: Unsubscribe | null = null;

        const subscribe = () => {
            unsubscribe = RoomClientDb.onRoomChange(roomId, (updatedRoom) => {
                setRoom(updatedRoom);
            });
        };

        subscribe();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return {
        // State
        rooms,
        loading,
        error,
        hasMore,

        // Single room operations
        room,
        fetchRoom,

        // CRUD operations
        createRoom,
        updateRoom,
        deleteRoom,
        archiveRoom,
        unarchiveRoom,

        // Fetch operations
        fetchRooms,
        fetchUserRooms,
        fetchArchivedRooms,

        // Utility functions
        clearRooms,
        refreshRooms,

        // Real-time subscriptions
        subscribeToUserRooms,
        subscribeToRoom
    };
};

export default useRoom; 