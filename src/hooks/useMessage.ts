'use client';

import { useState, useCallback } from 'react';
import { DocumentSnapshot, Unsubscribe } from 'firebase/firestore';
import { useAuth } from '@/components/AuthContext';
import { MessageClientDb } from '@/lib/firebase/clientDb';
import { Message } from '@/lib/firebase/dbTypes';

interface MessageFormData {
    roomId: string;
    personaId?: string;
    senderType: string;
    content: string;
    messageType?: string;
    metadata?: string;
}

interface UseMessageReturn {
    // State
    messages: Message[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    lastDoc: DocumentSnapshot | null;

    // Single message operations
    message: Message | null;
    fetchMessage: (id: string) => Promise<Message | null>;

    // CRUD operations
    createMessage: (data: MessageFormData) => Promise<string | null>;
    updateMessage: (id: string, updates: Partial<Message>) => Promise<boolean>;
    deleteMessage: (id: string) => Promise<boolean>;

    // Fetch operations
    fetchMessagesByRoom: (roomId: string, limit?: number, reset?: boolean) => Promise<void>;

    // Utility functions
    clearMessages: () => void;
    refreshMessages: (roomId: string) => Promise<void>;

    // Real-time subscriptions
    subscribeToRoomMessages: (roomId: string) => () => void;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export const useMessage = (): UseMessageReturn => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState<Message | null>(null);
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

    // Create message
    const createMessage = useCallback(async (data: MessageFormData): Promise<string | null> => {
        if (!user) {
            setError('You must be logged in to send a message');
            return null;
        }
        setLoading(true);
        clearError();
        try {
            // MessageClientDb does not have a create method, so message creation should be handled via API
            // This is a placeholder for client-side optimistic update if needed
            return null;
        } catch (err) {
            handleError('Create message', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Update message
    const updateMessage = useCallback(async (id: string, updates: Partial<Message>): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to update a message');
            return false;
        }
        setLoading(true);
        clearError();
        try {
            await MessageClientDb.update(id, updates);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
            if (message?.id === id) {
                setMessage(prev => prev ? { ...prev, ...updates } : null);
            }
            return true;
        } catch (err) {
            handleError('Update message', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, message]);

    // Delete message
    const deleteMessage = useCallback(async (id: string): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to delete a message');
            return false;
        }
        setLoading(true);
        clearError();
        try {
            await MessageClientDb.delete(id);
            setMessages(prev => prev.filter(m => m.id !== id));
            if (message?.id === id) {
                setMessage(null);
            }
            return true;
        } catch (err) {
            handleError('Delete message', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, message]);

    // Fetch single message
    const fetchMessage = useCallback(async (id: string): Promise<Message | null> => {
        setLoading(true);
        clearError();
        try {
            const data = await MessageClientDb.getById(id);
            setMessage(data);
            return data;
        } catch (err) {
            handleError('Fetch message', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch messages by room with pagination
    const fetchMessagesByRoom = useCallback(async (roomId: string, limit = 50, reset = false): Promise<void> => {
        if (loading || (!hasMore && !reset)) return;
        setLoading(true);
        clearError();
        try {
            const result = await MessageClientDb.getByRoomId(roomId, limit, reset ? undefined : lastDoc || undefined);
            if (reset) {
                setMessages(result.messages);
            } else {
                setMessages(prev => [...prev, ...result.messages]);
            }
            setLastDoc(result.lastDoc);
            setHasMore(result.messages.length === limit && result.lastDoc !== null);
        } catch (err) {
            handleError('Fetch messages', err);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, lastDoc]);

    // Clear messages
    const clearMessages = useCallback(() => {
        setMessages([]);
        setLastDoc(null);
        setHasMore(true);
        clearError();
    }, []);

    // Refresh messages
    const refreshMessages = useCallback(async (roomId: string): Promise<void> => {
        setLastDoc(null);
        setHasMore(true);
        await fetchMessagesByRoom(roomId, 50, true);
    }, [fetchMessagesByRoom]);

    // Subscribe to room messages
    const subscribeToRoomMessages = useCallback((roomId: string) => {
        let unsubscribe: Unsubscribe | null = null;
        const subscribe = () => {
            unsubscribe = MessageClientDb.onRoomMessagesChange(roomId, (updatedMessages) => {
                setMessages(updatedMessages);
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
        messages,
        loading,
        error,
        hasMore,
        lastDoc,
        message,
        fetchMessage,
        createMessage,
        updateMessage,
        deleteMessage,
        fetchMessagesByRoom,
        clearMessages,
        refreshMessages,
        subscribeToRoomMessages,
        setMessages,
    };
};

export default useMessage; 