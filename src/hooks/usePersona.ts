'use client';

import { useState, useEffect, useCallback } from 'react';
import { DocumentSnapshot, Unsubscribe } from 'firebase/firestore';
import { useAuth } from '@/components/AuthContext';
import { PersonaClientDb } from '@/lib/firebase/clientDb';
import { UserClientDb } from '@/lib/firebase/clientDb';
import { AiModelClientDb } from '@/lib/firebase/clientDb';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [aiModels, setAiModels] = useState<AiModel[]>([]);

  // Load current user data and AI models
  useEffect(() => {
    const loadInitialData = async () => {
      if (user && !currentUser && !loading) {
        try {
          const [userData, modelsData] = await Promise.all([
            UserClientDb.getById(user.uid),
            AiModelClientDb.getActive()
          ]);

          if (userData) {
            console.log('User data loaded successfully');
          }
          if (modelsData && modelsData.length > 0) {
            console.log(`AI models loaded: ${modelsData.length} models`);
          }

          setCurrentUser(userData);
          setAiModels(modelsData);
        } catch (err) {
          console.error('Error loading initial data:', err);
        }
      }
    };

    loadInitialData();
  }, [user, currentUser, loading]);

  // Error handler
  const handleError = (operation: string, err: any) => {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(`${operation}: ${errorMessage}`);
    console.error(`${operation}:`, err);
  };

  // Clear error
  const clearError = () => setError(null);

  // Create persona
  const createPersona = useCallback(async (data: PersonaFormData): Promise<string | null> => {
    if (!user || !currentUser) {
      setError('You must be logged in to create a persona');
      return null;
    }

    // Get default AI model if none specified
    // Find model matching language and gender preferences
    const matchingModel = aiModels.find(model =>
      model.isActive &&
      model.languageCode === data.language &&
      model.gender === data.gender
    );

    // Fallback to language match only
    const languageMatch = !matchingModel ? aiModels.find(model =>
      model.isActive &&
      model.languageCode === data.language
    ) : null;

    // Fallback to any active model
    const defaultModel = matchingModel || languageMatch || aiModels.find(model => model.isActive) || aiModels[0];

    if (!defaultModel) {
      setError('No AI model available. Please contact support.');
      return null;
    }

    setLoading(true);
    clearError();

    try {
      const serializedModel = JSON.parse(JSON.stringify(defaultModel));

      const personaData: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'> = {
        creatorId: currentUser.id,
        name: data.name,
        userPrompt: data.userPrompt,
        gender: data.gender,
        language: data.language,
        age: data.age,
        isPublic: data.isPublic,
        description: data.description,
        avatarUrl: data.avatarUrl,
        personality: data.personality,
        bodyColor: data.bodyColor,
        model: serializedModel,
        isActive: true,
        category: data.category,
        tags: data.tags,
        usageCount: 0,
        rating: 0
      };

      const id = await PersonaClientDb.create(personaData);

      // Refresh the personas list instead of manually adding to avoid serialization issues
      await refreshPersonas();

      return id;
    } catch (err) {
      handleError('Create persona', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, currentUser, aiModels]);

  // Update persona
  const updatePersona = useCallback(async (id: string, updates: Partial<Persona>): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to update a persona');
      return false;
    }

    setLoading(true);
    clearError();

    try {
      await PersonaClientDb.update(id, updates);

      // Update local state
      setPersonas(prev =>
        prev.map(p => p.id === id ? { ...p, ...updates } : p)
      );

      if (persona?.id === id) {
        setPersona(prev => prev ? { ...prev, ...updates } : null);
      }

      return true;
    } catch (err) {
      handleError('Update persona', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, persona]);

  // Delete persona
  const deletePersona = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to delete a persona');
      return false;
    }

    setLoading(true);
    clearError();

    try {
      await PersonaClientDb.delete(id);

      // Remove from local state
      setPersonas(prev => prev.filter(p => p.id !== id));

      if (persona?.id === id) {
        setPersona(null);
      }

      return true;
    } catch (err) {
      handleError('Delete persona', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, persona]);

  // Fetch single persona
  const fetchPersona = useCallback(async (id: string): Promise<Persona | null> => {
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
  }, []);

  // Fetch personas with pagination
  const fetchPersonas = useCallback(async (limit = 8, reset = false): Promise<void> => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    clearError();

    try {
      const result = await PersonaClientDb.getAll(limit, reset ? undefined : lastDoc || undefined);

      if (reset) {
        setPersonas(result.personas);
      } else {
        setPersonas(prev => [...prev, ...result.personas]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.personas.length === limit && result.lastDoc !== null);
    } catch (err) {
      handleError('Fetch personas', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastDoc]);

  // Fetch user's personas
  const fetchUserPersonas = useCallback(async (userId: string): Promise<void> => {
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
  }, []);

  // Fetch personas by category
  const fetchPersonasByCategory = useCallback(async (category: string): Promise<void> => {
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
  }, []);

  // Search personas
  const searchPersonas = useCallback(async (searchTerm: string, limit = 20): Promise<void> => {
    if (!searchTerm.trim()) {
      setPersonas([]);
      return;
    }

    setLoading(true);
    clearError();

    try {
      const data = await PersonaClientDb.searchByText(searchTerm, limit);
      setPersonas(data);
      setHasMore(false);
    } catch (err) {
      handleError('Search personas', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search personas by criteria
  const searchPersonasByCriteria = useCallback(async (criteria: {
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
  }, []);

  // Clear personas
  const clearPersonas = useCallback(() => {
    setPersonas([]);
    setLastDoc(null);
    setHasMore(true);
    clearError();
  }, []);

  // Refresh personas
  const refreshPersonas = useCallback(async (): Promise<void> => {
    setLastDoc(null);
    setHasMore(true);
    await fetchPersonas(8, true);
  }, [fetchPersonas]);

  // Subscribe to user personas
  const subscribeToUserPersonas = useCallback((userId: string) => {
    let unsubscribe: Unsubscribe | null = null;

    const subscribe = () => {
      unsubscribe = PersonaClientDb.onUserPersonasChange(userId, (updatedPersonas) => {
        setPersonas(updatedPersonas);
      });
    };

    subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Subscribe to public personas
  const subscribeToPublicPersonas = useCallback(() => {
    let unsubscribe: Unsubscribe | null = null;

    const subscribe = () => {
      unsubscribe = PersonaClientDb.onPublicPersonasChange((updatedPersonas) => {
        setPersonas(updatedPersonas);
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
    subscribeToPublicPersonas
  };
};

export default usePersona;
