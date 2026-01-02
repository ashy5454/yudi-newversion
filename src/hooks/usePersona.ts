'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentSnapshot, DocumentData, Unsubscribe } from 'firebase/firestore';
import { useAuth } from '@/components/AuthContext';
import {
  PersonaClientDb,
  UserClientDb,
  AiModelClientDb,
} from '@/lib/firebase/clientDb';
import { Persona, User, AiModel } from '@/lib/firebase/dbTypes';

interface PersonaFormData {
  name: string;
  category: string;
  description: string;
  userPrompt: string;
  tags: string[];
  bodyColor: string;
  gender: string;
  language: string;
  age: number;
  isPublic: boolean;
  personality?: string;
  avatarUrl?: string;
}

interface UsePersonaReturn {
  // State
  personas: Persona[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;

  // Single persona operations
  persona: Persona | null;
  fetchPersona: (id: string) => Promise<Persona | null>;

  // CRUD operations
  createPersona: (data: PersonaFormData) => Promise<string | null>;
  updatePersona: (id: string, updates: Partial<Persona>) => Promise<boolean>;
  deletePersona: (id: string) => Promise<boolean>;

  // Fetch operations
  fetchPersonas: (limit?: number, reset?: boolean) => Promise<void>;
  fetchUserPersonas: (userId: string) => Promise<void>;
  fetchPersonasByCategory: (category: string) => Promise<void>;

  // Search operations
  searchPersonas: (searchTerm: string, limit?: number) => Promise<void>;
  searchPersonasByCriteria: (criteria: {
    searchTerm?: string;
    category?: string;
    tags?: string[];
    creatorId?: string;
    limitCount?: number;
  }) => Promise<void>;

  // Utility functions
  clearPersonas: () => void;
  refreshPersonas: () => Promise<void>;

  // Real-time subscriptions
  subscribeToUserPersonas: (userId: string) => () => void;
  subscribeToPublicPersonas: () => () => void;
}

export const usePersona = (): UsePersonaReturn => {
  const { user } = useAuth();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(false); // now mainly for list/fetch
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] =
    useState<DocumentSnapshot<DocumentData> | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [aiModels, setAiModels] = useState<AiModel[]>([]);

  // --- Error helpers ---

  const handleError = useCallback((operation: string, err: unknown) => {
    const errorMessage =
      err instanceof Error ? err.message : 'An unknown error occurred';
    const fullMessage = `${operation}: ${errorMessage}`;
    console.error(fullMessage, err);
    setError(fullMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // --- Initial load of user + AI models ---
  // IMPORTANT: removed `loading` from dependency array to avoid re-running on every action.
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || currentUser) return;

      try {
        const [userData, modelsData] = await Promise.all([
          UserClientDb.getById(user.uid),
          AiModelClientDb.getActive(),
        ]);

        if (userData) {
          console.log('User data loaded successfully');
          setCurrentUser(userData);
        } else {
          console.warn('No user data found for uid:', user.uid);
        }

        if (modelsData && modelsData.length > 0) {
          console.log(`AI models loaded: ${modelsData.length} models`);
          setAiModels(modelsData);
        } else {
          console.warn('No active AI models found');
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };

    loadInitialData();
  }, [user, currentUser]);

  // --- Create persona (no global loading here) ---

  const createPersona = useCallback(
    async (data: PersonaFormData): Promise<string | null> => {
      if (!user) {
        setError('You must be logged in to create a persona');
        return null;
      }

      clearError();

      // Ensure we have currentUser
      let userDataToUse = currentUser;
      if (!userDataToUse) {
        try {
          userDataToUse = await UserClientDb.getById(user.uid);
          if (!userDataToUse) {
            setError('User data not found. Please refresh the page.');
            return null;
          }
          setCurrentUser(userDataToUse);
        } catch (err) {
          handleError('Load user data', err);
          return null;
        }
      }

      // Ensure we have AI models
      let modelsToUse = aiModels;
      if (!modelsToUse || modelsToUse.length === 0) {
        try {
          modelsToUse = await AiModelClientDb.getActive();
          setAiModels(modelsToUse);
        } catch (err) {
          handleError('Load AI models', err);
          return null;
        }
      }

      if (!modelsToUse || modelsToUse.length === 0) {
        setError('No AI model available. Please contact support.');
        return null;
      }

      // Select best matching model
      const matchingModel = modelsToUse.find(
        (model) =>
          model.isActive &&
          model.languageCode === data.language &&
          model.gender === data.gender,
      );

      const languageMatch =
        matchingModel ||
        modelsToUse.find(
          (model) => model.isActive && model.languageCode === data.language,
        );

      const defaultModel =
        matchingModel ||
        languageMatch ||
        modelsToUse.find((model) => model.isActive) ||
        modelsToUse[0];

      if (!defaultModel) {
        setError('No AI model available. Please contact support.');
        return null;
      }

      try {
        const serializedModel = JSON.parse(JSON.stringify(defaultModel));

        const personaData: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'> = {
          creatorId: userDataToUse.id,
          name: data.name,
          userPrompt: data.userPrompt,
          gender: data.gender,
          language: data.language,
          age: data.age,
          isPublic: data.isPublic,
          description: data.description,
          avatarUrl: data.avatarUrl ?? null,
          personality: data.personality ?? '',
          bodyColor: data.bodyColor,
          model: serializedModel,
          isActive: true,
          category: data.category,
          tags: data.tags || [],
          usageCount: 0,
          rating: 0,
        };

        const id = await PersonaClientDb.create(personaData);

        const now = new Date();
        const newPersona: Persona = {
          ...personaData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        // Optimistic update
        setPersonas((prev) => [newPersona, ...prev]);

        return id;
      } catch (err) {
        handleError('Create persona', err);
        return null;
      }
    },
    [user, currentUser, aiModels, clearError, handleError],
  );

  // --- Update persona (no global loading) ---

  const updatePersona = useCallback(
    async (id: string, updates: Partial<Persona>): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in to update a persona');
        return false;
      }

      clearError();

      try {
        await PersonaClientDb.update(id, updates);

        setPersonas((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        );

        setPersona((prev) =>
          prev && prev.id === id ? { ...prev, ...updates } : prev,
        );

        return true;
      } catch (err) {
        handleError('Update persona', err);
        return false;
      }
    },
    [user, clearError, handleError],
  );

  // --- Delete persona (no global loading) ---

  const deletePersona = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) {
        setError('You must be logged in to delete a persona');
        return false;
      }

      clearError();

      try {
        await PersonaClientDb.delete(id);

        setPersonas((prev) => prev.filter((p) => p.id !== id));
        setPersona((prev) => (prev && prev.id === id ? null : prev));

        return true;
      } catch (err) {
        handleError('Delete persona', err);
        return false;
      }
    },
    [user, clearError, handleError],
  );

  // --- Fetch single persona (uses loading) ---

  const fetchPersona = useCallback(
    async (id: string): Promise<Persona | null> => {
      setLoading(true);
      clearError();

      try {
        const data = await PersonaClientDb.getById(id);
        setPersona(data);
        return data;
      } catch (err) {
        handleError('Fetch persona', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleError],
  );

  // --- Fetch personas with pagination (uses loading) ---

  const fetchPersonas = useCallback(
    async (limit = 8, reset = false): Promise<void> => {
      if (!reset) {
        if (loading) return;
        if (!hasMore) return;
      }

      setLoading(true);
      clearError();

      try {
        const result = await PersonaClientDb.getAll(
          limit,
          reset ? undefined : lastDoc ?? undefined,
        );

        if (reset) {
          setPersonas(result.personas);
        } else {
          setPersonas((prev) => [...prev, ...result.personas]);
        }

        setLastDoc(result.lastDoc as DocumentSnapshot<DocumentData> | null);
        setHasMore(
          result.personas.length === limit && result.lastDoc !== null,
        );
      } catch (err) {
        handleError('Fetch personas', err);
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore, lastDoc, clearError, handleError],
  );

  // --- Fetch user's personas (uses loading) ---

  const fetchUserPersonas = useCallback(
    async (userId: string): Promise<void> => {
      setLoading(true);
      clearError();

      try {
        const data = await PersonaClientDb.getByCreator(userId);
        setPersonas(data);
        setHasMore(false);
      } catch (err) {
        handleError('Fetch user personas', err);
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleError],
  );

  // --- Fetch personas by category (uses loading) ---

  const fetchPersonasByCategory = useCallback(
    async (category: string): Promise<void> => {
      setLoading(true);
      clearError();

      try {
        const data = await PersonaClientDb.getByCategory(category);
        setPersonas(data);
        setHasMore(false);
      } catch (err) {
        handleError('Fetch personas by category', err);
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleError],
  );

  // --- Search personas (uses loading) ---

  const searchPersonas = useCallback(
    async (searchTerm: string, limit = 20): Promise<void> => {
      const trimmed = searchTerm.trim();
      if (!trimmed) {
        setPersonas([]);
        setHasMore(false);
        return;
      }

      setLoading(true);
      clearError();

      try {
        const data = await PersonaClientDb.searchByText(trimmed, limit);
        setPersonas(data);
        setHasMore(false);
      } catch (err) {
        handleError('Search personas', err);
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleError],
  );

  // --- Search personas by criteria (uses loading) ---

  const searchPersonasByCriteria = useCallback(
    async (criteria: {
      searchTerm?: string;
      category?: string;
      tags?: string[];
      creatorId?: string;
      limitCount?: number;
    }): Promise<void> => {
      setLoading(true);
      clearError();

      try {
        const data = await PersonaClientDb.searchByCriteria(criteria);
        setPersonas(data);
        setHasMore(false);
      } catch (err) {
        handleError('Search personas by criteria', err);
      } finally {
        setLoading(false);
      }
    },
    [clearError, handleError],
  );

  // --- Utility ---

  const clearPersonas = useCallback(() => {
    setPersonas([]);
    setLastDoc(null);
    setHasMore(true);
    clearError();
  }, [clearError]);

  const refreshPersonas = useCallback(async (): Promise<void> => {
    setLastDoc(null);
    setHasMore(true);
    await fetchPersonas(8, true);
  }, [fetchPersonas]);

  // --- Realtime subscriptions ---

  const subscribeToUserPersonas = useCallback((userId: string) => {
    const unsubscribe: Unsubscribe = PersonaClientDb.onUserPersonasChange(
      userId,
      (updatedPersonas) => {
        setPersonas(updatedPersonas);
      },
    );

    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  const subscribeToPublicPersonas = useCallback(() => {
    const unsubscribe: Unsubscribe = PersonaClientDb.onPublicPersonasChange(
      (updatedPersonas) => {
        setPersonas(updatedPersonas);
      },
    );

    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  return {
    // State
    personas,
    loading,
    error,
    hasMore,

    // Single persona operations
    persona,
    fetchPersona,

    // CRUD operations
    createPersona,
    updatePersona,
    deletePersona,

    // Fetch operations
    fetchPersonas,
    fetchUserPersonas,
    fetchPersonasByCategory,

    // Search operations
    searchPersonas,
    searchPersonasByCriteria,

    // Utility functions
    clearPersonas,
    refreshPersonas,

    // Real-time subscriptions
    subscribeToUserPersonas,
    subscribeToPublicPersonas,
  };
};

export default usePersona;

