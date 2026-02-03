import { db } from './firebase';
import {
  User,
  Persona,
  Room,
  Message,
  Mood,
  Memory,
  AiModel
} from './dbTypes';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  Timestamp,
  onSnapshot,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  FirestoreError,
} from 'firebase/firestore';

// Error types for better error handling
interface FirestoreErrorInfo {
  code: string;
  message: string;
  operation: string;
  collection?: string;
  documentId?: string;
  userId?: string;
  timestamp: Date;
}

// Error logging utility
const logFirestoreError = (error: unknown, operation: string, context?: {
  collection?: string;
  documentId?: string;
  userId?: string;
}): FirestoreErrorInfo => {
  const errorInfo: FirestoreErrorInfo = {
    code: 'unknown',
    message: 'Unknown error occurred',
    operation,
    collection: context?.collection,
    documentId: context?.documentId,
    userId: context?.userId,
    timestamp: new Date()
  };

  if (error instanceof FirestoreError) {
    errorInfo.code = error.code;
    errorInfo.message = error.message;

    // Don't log permission errors or not-found errors as they're expected in some cases
    if (error.code === 'permission-denied' || error.code === 'not-found') {
      return errorInfo;
    }
  } else if (error instanceof Error) {
    errorInfo.message = error.message;
  } else if (typeof error === 'string') {
    errorInfo.message = error;
  }

  console.error('Firestore Error:', {
    ...errorInfo,
    originalError: error
  });

  return errorInfo;
};

// Utility functions for local-first querying
const getDocWithSource = async <T>(docRef: any): Promise<{ data: T | null; fromCache: boolean }> => {
  try {
    const docSnap = await getDoc(docRef);
    return {
      data: docSnap.exists() ? serializeFirestoreData(docSnap.data()) as T : null,
      fromCache: docSnap.metadata.fromCache
    };
  } catch (error) {
    // Handle permission errors and not-found errors gracefully (don't log as errors)
    if (error instanceof FirestoreError &&
      (error.code === 'permission-denied' || error.code === 'not-found')) {
      return { data: null, fromCache: false };
    }

    // Only log unexpected errors
    if (error instanceof FirestoreError && error.code !== 'unavailable') {
      logFirestoreError(error, 'getDocWithSource', {
        collection: docRef.parent.id,
        documentId: docRef.id
      });
    }
    return { data: null, fromCache: false };
  }
};

const getDocsWithSource = async <T>(query: any): Promise<{ data: T[]; fromCache: boolean }> => {
  try {
    const querySnap = await getDocs(query);
    return {
      data: querySnap.docs.map(doc => serializeFirestoreData(doc.data()) as T),
      fromCache: querySnap.metadata.fromCache
    };
  } catch (error) {
    // Handle permission errors and not-found errors gracefully
    if (error instanceof FirestoreError &&
      (error.code === 'permission-denied' || error.code === 'not-found')) {
      return { data: [], fromCache: false };
    }

    logFirestoreError(error, 'getDocsWithSource', {
      collection: query._query.path.segments[0]
    });
    return { data: [], fromCache: false };
  }
};

// Helper function to serialize Firestore data for Client Components
const serializeFirestoreData = (data: any): any => {
  if (data === null || data === undefined) return data;

  // Handle Firestore Timestamp (has .toDate function)
  if (data.toDate && typeof data.toDate === 'function') {
    // Convert Firestore Timestamp to Date
    return data.toDate();
  }

  // Handle Firestore Timestamp (has .seconds property) - fallback for edge cases
  if (data.seconds !== undefined && typeof data.seconds === 'number') {
    return new Date(data.seconds * 1000 + (data.nanoseconds || 0) / 1000000);
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const serialized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        serialized[key] = serializeFirestoreData(data[key]);
      }
    }
    return serialized;
  }

  return data;
};

// Helper function to check if data is from cache
const logDataSource = (fromCache: boolean, operation: string) => {
  // Only log cache vs server data in development and for debugging
  if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) { // Only log 10% of the time
    const source = fromCache ? "local cache" : "server";
    console.log(`${operation} data came from ${source}`);
  }
};

// Helper function for real-time listeners with metadata
const createListenerWithMetadata = <T>(
  query: any,
  callback: (data: T[], fromCache: boolean) => void,
  operation: string
): Unsubscribe => {
  return onSnapshot(query, { includeMetadataChanges: true }, (snapshot: QuerySnapshot) => {
    const data = snapshot.docs.map((doc: any) => doc.data() as T);
    const fromCache = snapshot.metadata.fromCache;

    logDataSource(fromCache, operation);
    callback(data, fromCache);
  }, (error) => {
    // Handle permission errors and not-found errors gracefully
    if (error instanceof FirestoreError &&
      (error.code === 'permission-denied' || error.code === 'not-found')) {
      console.warn(`Permission denied or not found for ${operation}, this may be expected`);
      return;
    }

    logFirestoreError(error, operation);
  });
};

// USER CRUD Operations (Client-side)
export const UserClientDb = {
  // Create user (typically done via Firebase Auth)
  create: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, uid: string): Promise<string> => {
    try {
      const userRef = doc(db, 'users', uid);
      const user = {
        id: uid,
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(userRef, user);
      return uid;
    } catch (error) {
      logFirestoreError(error, 'UserClientDb.create', {
        collection: 'users',
        documentId: uid,
        userId: uid
      });
      throw error;
    }
  },

  // Get user by ID (local-first)
  getById: async (id: string): Promise<User | null> => {
    try {
      const docRef = doc(db, 'users', id);
      const { data, fromCache } = await getDocWithSource<User>(docRef);
      logDataSource(fromCache, 'User getById');
      return data;
    } catch (error) {
      logFirestoreError(error, 'UserClientDb.getById', {
        collection: 'users',
        documentId: id,
        userId: id
      });
      return null;
    }
  },

  // Update user
  update: async (id: string, updates: Partial<User>): Promise<void> => {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'UserClientDb.update', {
        collection: 'users',
        documentId: id,
        userId: id
      });
      throw error;
    }
  },

  // Update user credit
  updateCredit: async (userId: string, creditUpdate: Partial<User['credit']>): Promise<void> => {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        credit: creditUpdate,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'UserClientDb.updateCredit', {
        collection: 'users',
        documentId: userId,
        userId: userId
      });
      throw error;
    }
  },

  // Real-time listener for user
  onUserChange: (userId: string, callback: (user: User | null) => void): Unsubscribe => {
    try {
      const docRef = doc(db, 'users', userId);
      return onSnapshot(docRef, (doc) => {
        callback(doc.exists() ? doc.data() as User : null);
      }, (error) => {
        // Handle permission errors and not-found errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for user change listener, this may be expected');
          return;
        }

        logFirestoreError(error, 'UserClientDb.onUserChange', {
          collection: 'users',
          documentId: userId,
          userId: userId
        });
      });
    } catch (error) {
      logFirestoreError(error, 'UserClientDb.onUserChange.setup', {
        collection: 'users',
        documentId: userId,
        userId: userId
      });
      throw error;
    }
  },

  // Update last seen
  updateLastSeen: async (userId: string): Promise<void> => {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'UserClientDb.updateLastSeen', {
        collection: 'users',
        documentId: userId,
        userId: userId
      });
      throw error;
    }
  }
};

// AI MODEL CRUD Operations (Client-side - Read Only)
export const AiModelClientDb = {
  // Get all active models (local-first)
  getActive: async (): Promise<AiModel[]> => {
    try {
      const q = query(collection(db, 'aiModels'), where('isActive', '==', true));
      const { data, fromCache } = await getDocsWithSource<AiModel>(q);
      logDataSource(fromCache, 'AiModel getActive');
      return data;
    } catch (error) {
      logFirestoreError(error, 'AiModelClientDb.getActive', {
        collection: 'aiModels'
      });
      return [];
    }
  },

  // Get by ID (local-first)
  getById: async (id: string): Promise<AiModel | null> => {
    try {
      const docRef = doc(db, 'aiModels', id);
      const { data, fromCache } = await getDocWithSource<AiModel>(docRef);
      logDataSource(fromCache, 'AiModel getById');
      return data;
    } catch (error) {
      logFirestoreError(error, 'AiModelClientDb.getById', {
        collection: 'aiModels',
        documentId: id
      });
      return null;
    }
  },

  // Real-time listener for active models
  onActiveModelsChange: (callback: (models: AiModel[]) => void): Unsubscribe => {
    try {
      const q = query(collection(db, 'aiModels'), where('isActive', '==', true));
      return onSnapshot(q, (snapshot) => {
        const models = snapshot.docs.map(doc => doc.data() as AiModel);
        callback(models);
      }, (error) => {
        // Handle permission errors and not-found errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for active models listener, this may be expected');
          return;
        }

        logFirestoreError(error, 'AiModelClientDb.onActiveModelsChange', {
          collection: 'aiModels'
        });
      });
    } catch (error) {
      logFirestoreError(error, 'AiModelClientDb.onActiveModelsChange.setup', {
        collection: 'aiModels'
      });
      throw error;
    }
  }
};

// PERSONA CRUD Operations (Client-side)
export const PersonaClientDb = {
  // Create persona
  create: async (personaData: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const personaRef = doc(collection(db, 'personas'));
      const persona = {
        id: personaRef.id,
        ...personaData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(personaRef, persona);
      return personaRef.id;
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.create', {
        collection: 'personas',
        userId: personaData.creatorId
      });
      throw error;
    }
  },

  // Get by ID (local-first)
  getById: async (id: string): Promise<Persona | null> => {
    try {
      const docRef = doc(db, 'personas', id);
      const { data, fromCache } = await getDocWithSource<Persona>(docRef);
      logDataSource(fromCache, 'Persona getById');
      return data;
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.getById', {
        collection: 'personas',
        documentId: id
      });
      return null;
    }
  },

  // Get public personas with pagination (local-first)
  getPublic: async (limitCount: number = 20, lastDoc?: DocumentSnapshot): Promise<{ personas: Persona[], lastDoc: DocumentSnapshot | null }> => {
    try {
      let q = query(
        collection(db, 'personas'),
        where('isPublic', '==', true),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const personas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...serializeFirestoreData(doc.data())
      })) as Persona[];

      const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;

      logDataSource(snapshot.metadata.fromCache, 'Persona getPublic');

      return { personas, lastDoc: lastDocument };
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.getPublic', {
        collection: 'personas'
      });
      return { personas: [], lastDoc: null };
    }
  },

  // Get all personas with pagination (local-first)
  getAll: async (limitCount: number = 8, lastDoc?: DocumentSnapshot): Promise<{ personas: Persona[], lastDoc: DocumentSnapshot | null }> => {
    try {
      let q = query(
        collection(db, 'personas'),
        where('isPublic', '==', true),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const personas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...serializeFirestoreData(doc.data())
      })) as Persona[];

      const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;

      logDataSource(snapshot.metadata.fromCache, 'Persona getAll');

      return { personas, lastDoc: lastDocument };
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.getAll', {
        collection: 'personas'
      });
      return { personas: [], lastDoc: null };
    }
  },

  // Get by creator
  getByCreator: async (creatorId: string): Promise<Persona[]> => {
    try {
      // Try creatorId field first (correct field name)
      const q = query(collection(db, 'personas'), where('creatorId', '==', creatorId));
      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...serializeFirestoreData(doc.data())
        })) as Persona[];
      }
      // Fallback to creator.id if no results (for backward compatibility)
      const q2 = query(collection(db, 'personas'), where('creator.id', '==', creatorId));
      const snapshot2 = await getDocs(q2);
      return snapshot2.docs.map(doc => ({
        id: doc.id,
        ...serializeFirestoreData(doc.data())
      })) as Persona[];
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.getByCreator', {
        collection: 'personas',
        userId: creatorId
      });
      return [];
    }
  },

  // Get by category
  getByCategory: async (category: string): Promise<Persona[]> => {
    try {
      const q = query(
        collection(db, 'personas'),
        where('category', '==', category),
        where('isPublic', '==', true),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...serializeFirestoreData(doc.data())
      })) as Persona[];
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.getByCategory', {
        collection: 'personas'
      });
      return [];
    }
  },

  // Update persona
  update: async (id: string, updates: Partial<Persona>): Promise<void> => {
    try {
      const docRef = doc(db, 'personas', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.update', {
        collection: 'personas',
        documentId: id
      });
      throw error;
    }
  },

  // Delete persona
  delete: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'personas', id);
      await deleteDoc(docRef);
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.delete', {
        collection: 'personas',
        documentId: id
      });
      throw error;
    }
  },

  // Search personas by name or description
  searchByText: async (searchTerm: string, limitCount: number = 20): Promise<Persona[]> => {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - consider using Algolia or similar for production
      const q = query(
        collection(db, 'personas'),
        where('isPublic', '==', true),
        where('isActive', '==', true),
        limit(limitCount * 2) // Get more to filter
      );

      const { data, fromCache } = await getDocsWithSource<Persona>(q);
      logDataSource(fromCache, 'Persona searchByText');

      const filtered = data.filter(persona =>
        persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        persona.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        persona.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        persona.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return filtered.slice(0, limitCount);
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.searchByText', {
        collection: 'personas'
      });
      return [];
    }
  },

  // Enhanced search with multiple criteria
  searchByCriteria: async (criteria: {
    searchTerm?: string;
    category?: string;
    tags?: string[];
    creatorId?: string;
    limitCount?: number;
  }): Promise<Persona[]> => {
    try {
      const { searchTerm, category, tags, creatorId, limitCount = 20 } = criteria;

      let q = query(
        collection(db, 'personas'),
        where('isActive', '==', true)
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }

      if (creatorId) {
        q = query(q, where('creator.id', '==', creatorId));
      } else {
        q = query(q, where('isPublic', '==', true));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(limitCount * 2));

      const { data, fromCache } = await getDocsWithSource<Persona>(q);
      logDataSource(fromCache, 'Persona searchByCriteria');

      let filtered = data;

      if (searchTerm) {
        filtered = filtered.filter(persona =>
          persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          persona.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (tags && tags.length > 0) {
        filtered = filtered.filter(persona =>
          persona.tags?.some(tag =>
            tags.some(searchTag => tag.toLowerCase().includes(searchTag.toLowerCase()))
          )
        );
      }

      return filtered.slice(0, limitCount);
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.searchByCriteria', {
        collection: 'personas'
      });
      return [];
    }
  },

  // Real-time listener for user's personas
  onUserPersonasChange: (creatorId: string, callback: (personas: Persona[]) => void): Unsubscribe => {
    try {
      const q = query(collection(db, 'personas'), where('creator.id', '==', creatorId));
      return onSnapshot(q, (snapshot) => {
        const personas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...serializeFirestoreData(doc.data())
        })) as Persona[];
        callback(personas);
      }, (error) => {
        // Handle permission errors and not-found errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for user personas listener, this may be expected');
          return;
        }

        logFirestoreError(error, 'PersonaClientDb.onUserPersonasChange', {
          collection: 'personas',
          userId: creatorId
        });
      });
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.onUserPersonasChange.setup', {
        collection: 'personas',
        userId: creatorId
      });
      throw error;
    }
  },

  // Real-time listener for public personas
  onPublicPersonasChange: (callback: (personas: Persona[]) => void): Unsubscribe => {
    try {
      const q = query(
        collection(db, 'personas'),
        where('isPublic', '==', true),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      return onSnapshot(q, (snapshot) => {
        const personas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...serializeFirestoreData(doc.data())
        })) as Persona[];
        callback(personas);
      }, (error) => {
        // Handle permission errors and not-found errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for public personas listener, this may be expected');
          return;
        }

        logFirestoreError(error, 'PersonaClientDb.onPublicPersonasChange', {
          collection: 'personas'
        });
      });
    } catch (error) {
      logFirestoreError(error, 'PersonaClientDb.onPublicPersonasChange.setup', {
        collection: 'personas'
      });
      throw error;
    }
  }
};

// ROOM CRUD Operations (Client-side)
export const RoomClientDb = {
  // Create room
  create: async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const roomRef = doc(collection(db, 'rooms'));
      await setDoc(roomRef, {
        id: roomRef.id,
        ...roomData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return roomRef.id;
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.create', {
        collection: 'rooms',
        userId: roomData.userId
      });
      throw error;
    }
  },

  // Get by ID (local-first)
  getById: async (id: string): Promise<Room | null> => {
    try {
      const docRef = doc(db, 'rooms', id);
      const { data, fromCache } = await getDocWithSource<Room>(docRef);
      logDataSource(fromCache, 'Room getById');
      return data;
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.getById', {
        collection: 'rooms',
        documentId: id
      });
      return null;
    }
  },

  // Get user's rooms (local-first)
  getByUserId: async (userId: string, limitCount: number = 20): Promise<Room[]> => {
    try {
      const q = query(
        collection(db, 'rooms'),
        where('userId', '==', userId),
        // where('isArchived', '==', false),
        // orderBy('lastMessageAt', 'desc'),
        limit(limitCount)
      );

      const { data, fromCache } = await getDocsWithSource<Room>(q);
      logDataSource(fromCache, 'Room getByUserId');
      return data;
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.getByUserId', {
        collection: 'rooms',
        userId: userId
      });
      return [];
    }
  },

  // Get archived rooms
  getArchivedByUserId: async (userId: string): Promise<Room[]> => {
    try {
      const q = query(
        collection(db, 'rooms'),
        where('userId', '==', userId),
        where('isArchived', '==', true),
        orderBy('lastMessageAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Room);
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.getArchivedByUserId', {
        collection: 'rooms',
        userId: userId
      });
      return [];
    }
  },

  // Update room
  update: async (id: string, updates: Partial<Room>): Promise<void> => {
    try {
      const docRef = doc(db, 'rooms', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.update', {
        collection: 'rooms',
        documentId: id
      });
      throw error;
    }
  },

  // Delete room
  delete: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'rooms', id);
      await deleteDoc(docRef);
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.delete', {
        collection: 'rooms',
        documentId: id
      });
      throw error;
    }
  },

  // Archive room
  archive: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'rooms', id);
      await updateDoc(docRef, {
        isArchived: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.archive', {
        collection: 'rooms',
        documentId: id
      });
      throw error;
    }
  },

  // Unarchive room
  unarchive: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'rooms', id);
      await updateDoc(docRef, {
        isArchived: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.unarchive', {
        collection: 'rooms',
        documentId: id
      });
      throw error;
    }
  },

  // Update last message info
  updateLastMessage: async (id: string, content: string): Promise<void> => {
    try {
      const docRef = doc(db, 'rooms', id);
      await updateDoc(docRef, {
        lastMessageAt: serverTimestamp(),
        lastMessageContent: content,
        messageCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.updateLastMessage', {
        collection: 'rooms',
        documentId: id
      });
      throw error;
    }
  },

  // Real-time listener for user's rooms
  onUserRoomsChange: (userId: string, callback: (rooms: Room[]) => void): Unsubscribe => {
    try {
      const q = query(
        collection(db, 'rooms'),
        where('userId', '==', userId),
        where('isArchived', '!=', true),
        orderBy('lastMessageAt', 'desc'),
        limit(50)
      );

      return onSnapshot(q, (snapshot) => {
        const rooms = snapshot.docs.map(doc => doc.data() as Room);
        callback(rooms);
      }, (error) => {
        // Handle permission errors and not-found errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for user rooms listener, this may be expected');
          return;
        }

        logFirestoreError(error, 'RoomClientDb.onUserRoomsChange', {
          collection: 'rooms',
          userId: userId
        });
      });
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.onUserRoomsChange.setup', {
        collection: 'rooms',
        userId: userId
      });
      throw error;
    }
  },

  // Real-time listener for specific room
  onRoomChange: (roomId: string, callback: (room: Room | null) => void): Unsubscribe => {
    try {
      const docRef = doc(db, 'rooms', roomId);
      return onSnapshot(docRef, (doc) => {
        callback(doc.exists() ? doc.data() as Room : null);
      }, (error) => {
        // Handle permission errors and not-found errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for room change listener, this may be expected');
          return;
        }

        logFirestoreError(error, 'RoomClientDb.onRoomChange', {
          collection: 'rooms',
          documentId: roomId
        });
      });
    } catch (error) {
      logFirestoreError(error, 'RoomClientDb.onRoomChange.setup', {
        collection: 'rooms',
        documentId: roomId
      });
      throw error;
    }
  }
};

// MESSAGE CRUD Operations (Client-side)
export const MessageClientDb = {

  // Get by ID (local-first)
  getById: async (id: string): Promise<Message | null> => {
    try {
      const docRef = doc(db, 'messages', id);
      const { data, fromCache } = await getDocWithSource<Message>(docRef);
      logDataSource(fromCache, 'Message getById');
      return data;
    } catch (error) {
      logFirestoreError(error, 'MessageClientDb.getById', {
        collection: 'messages',
        documentId: id
      });
      return null;
    }
  },

  // Get messages by room ID with pagination
  // 🛑 BACKWARD COMPATIBILITY: Read from BOTH new subcollection AND old flat collection
  getByRoomId: async (roomId: string, limitCount: number = 50, lastDoc?: DocumentSnapshot): Promise<{ messages: Message[], lastDoc: DocumentSnapshot | null }> => {
    try {
      // Try NEW structure first: rooms/{roomId}/messages (subcollection)
      try {
        let q = query(
          collection(db, 'rooms', roomId, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        if (snapshot.docs.length > 0) {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeFirestoreData(doc.data())
          }) as Message);
          const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;
          return { messages, lastDoc: lastDocument };
        }
      } catch (newError) {
        // If new structure fails or is empty, fall back to old structure
        console.warn('New messages subcollection not found, trying old structure:', newError);
      }

      // Fall back to OLD structure: messages collection with roomId field
      let q = query(
        collection(db, 'messages'),
        where('roomId', '==', roomId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...serializeFirestoreData(doc.data())
      }) as Message);
      const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;

      return { messages, lastDoc: lastDocument };
    } catch (error) {
      logFirestoreError(error, 'MessageClientDb.getByRoomId', {
        collection: 'messages'
      });
      return { messages: [], lastDoc: null };
    }
  },

  // Update message
  update: async (id: string, updates: Partial<Message>): Promise<void> => {
    try {
      const docRef = doc(db, 'messages', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'MessageClientDb.update', {
        collection: 'messages',
        documentId: id
      });
      throw error;
    }
  },

  // Delete message
  delete: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'messages', id);
      await deleteDoc(docRef);
    } catch (error) {
      logFirestoreError(error, 'MessageClientDb.delete', {
        collection: 'messages',
        documentId: id
      });
      throw error;
    }
  },

  // Create message (with error logging)
  // 🛑 CRITICAL: Save to rooms/{roomId}/messages subcollection, not flat messages collection
  create: async (messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>, customTimestamp?: Date | number): Promise<string> => {
    // 1. SAFETY CHECK: If no Room ID, we can't save!
    if (!messageData.roomId) {
      console.error("❌ ERROR: No Room ID provided! Message lost:", messageData.content.substring(0, 50));
      throw new Error("Room ID is required to save message");
    }

    try {
      const timestamp = customTimestamp
        ? (customTimestamp instanceof Date ? customTimestamp : new Date(customTimestamp))
        : new Date();

      // 2. THE CORRECT PATH: rooms -> [ROOM_ID] -> messages
      const messagesRef = collection(db, "rooms", messageData.roomId, "messages");
      const messageRef = doc(messagesRef);

      // Convert Date to Firestore Timestamp explicitly to ensure proper storage and retrieval
      // Firestore will convert JavaScript Date objects automatically, but using Timestamp explicitly
      // ensures consistent behavior and proper serialization back to Date objects
      const firestoreTimestamp = Timestamp.fromDate(timestamp instanceof Date ? timestamp : new Date(timestamp));

      // Use 'any' type here because Firestore expects Timestamp, but our Message interface uses Date
      // serializeFirestoreData will convert Timestamp back to Date when reading
      const message: any = {
        id: messageRef.id,
        ...messageData,
        createdAt: firestoreTimestamp,
        updatedAt: firestoreTimestamp
      };

      await setDoc(messageRef, message);
      console.log(`✅ Saved to Room [${messageData.roomId}]: ${messageData.content.substring(0, 50)}...`);
      return messageRef.id;
    } catch (error) {
      console.error("❌ FAILED TO SAVE TO DB:", error);
      logFirestoreError(error, 'MessageClientDb.create', {
        collection: 'messages',
        userId: (messageData as any).userId
      });
      throw error;
    }
  },

  // Mark message as read
  markAsRead: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'messages', id);
      await updateDoc(docRef, {
        isRead: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'MessageClientDb.markAsRead', {
        collection: 'messages',
        documentId: id
      });
      throw error;
    }
  },

  // Real-time listener for room messages
  // 🛑 BACKWARD COMPATIBILITY: Listen to BOTH new subcollection AND old flat collection
  onRoomMessagesChange: (roomId: string, callback: (messages: Message[]) => void): Unsubscribe => {
    try {
      let newMessages: Message[] = [];
      let oldMessages: Message[] = [];
      let hasNewData = false;
      let hasOldData = false;

      // Helper to get message timestamp for sorting
      const getMessageTime = (msg: Message): number => {
        if (!msg.createdAt) return 0;
        if (msg.createdAt instanceof Date) return msg.createdAt.getTime();
        if (typeof msg.createdAt === 'number') return msg.createdAt;
        if (typeof (msg.createdAt as any).toMillis === 'function') return (msg.createdAt as any).toMillis();
        if ((msg.createdAt as any).seconds) return (msg.createdAt as any).seconds * 1000;
        try {
          return new Date(msg.createdAt as any).getTime();
        } catch {
          return 0;
        }
      };

      // Merge function to combine and deduplicate messages
      const mergeAndCallback = () => {
        const allMessages = [...newMessages, ...oldMessages];
        // Remove duplicates by ID and sort
        const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values())
          .sort((a, b) => getMessageTime(a) - getMessageTime(b));
        callback(uniqueMessages);
      };

      // 1. Listen to NEW structure: rooms/{roomId}/messages (subcollection)
      // 🛑 CRITICAL FIX: Use 'desc' order to get MOST RECENT messages, not oldest
      // This ensures new messages (including check-ins) are always included
      // ⚡ PERFORMANCE: Reduced limit from 1000 to 100 for faster loading
      const newQ = query(
        collection(db, 'rooms', roomId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const unsubscribeNew = onSnapshot(newQ, (snapshot) => {
        // Messages come in DESC order (newest first), so reverse to get chronological order
        newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...serializeFirestoreData(doc.data())
        }) as Message).reverse(); // Reverse to get oldest first for proper sorting
        hasNewData = true;
        mergeAndCallback();
      }, (error) => {
        // Silently handle errors for new structure (may not exist yet)
        if (error instanceof FirestoreError && error.code !== 'permission-denied') {
          console.warn('Error listening to new messages subcollection:', error);
        }
        hasNewData = true; // Mark as processed so we don't wait forever
        if (hasOldData) {
          mergeAndCallback();
        }
      });

      // 2. Listen to OLD structure: messages collection with roomId field (for backward compatibility)
      // Use 'desc' order to get most recent messages
      // ⚡ PERFORMANCE: Reduced limit from 1000 to 100 for faster loading
      const oldQ = query(
        collection(db, 'messages'),
        where('roomId', '==', roomId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const unsubscribeOld = onSnapshot(oldQ, (snapshot) => {
        // Messages come in DESC order (newest first), so reverse to get chronological order
        oldMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...serializeFirestoreData(doc.data())
        }) as Message).reverse(); // Reverse to get oldest first for proper sorting
        hasOldData = true;
        mergeAndCallback();
      }, (error) => {
        // Handle permission errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for old messages collection, this may be expected');
          return;
        }
        hasOldData = true; // Mark as processed
        if (hasNewData) {
          mergeAndCallback();
        }
      });

      // Return unsubscribe function that unsubscribes from both
      return () => {
        unsubscribeNew();
        unsubscribeOld();
      };
    } catch (error) {
      logFirestoreError(error, 'MessageClientDb.onRoomMessagesChange.setup', {
        collection: 'messages'
      });
      throw error;
    }
  },

  // Real-time listener for new messages in room
  // 🛑 CRITICAL: Listen to rooms/{roomId}/messages subcollection, not flat messages collection
  onNewMessagesInRoom: (roomId: string, callback: (message: Message) => void): Unsubscribe => {
    try {
      // THE CORRECT PATH: rooms -> [ROOM_ID] -> messages
      const q = query(
        collection(db, 'rooms', roomId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            // ✅ Serialize Firestore data to convert Timestamps to Dates
            callback({
              id: change.doc.id,
              ...serializeFirestoreData(change.doc.data())
            } as Message);
          }
        });
      }, (error) => {
        // Handle permission errors and not-found errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for new messages listener, this may be expected');
          return;
        }

        logFirestoreError(error, 'MessageClientDb.onNewMessagesInRoom', {
          collection: 'messages'
        });
      });
    } catch (error) {
      logFirestoreError(error, 'MessageClientDb.onNewMessagesInRoom.setup', {
        collection: 'messages'
      });
      throw error;
    }
  }
};

// MOOD CRUD Operations (Client-side)
export const MoodClientDb = {
  // Create mood
  create: async (moodData: Omit<Mood, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const moodRef = doc(collection(db, 'moods'));
      const mood = {
        id: moodRef.id,
        ...moodData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(moodRef, mood);
      return moodRef.id;
    } catch (error) {
      logFirestoreError(error, 'MoodClientDb.create', {
        collection: 'moods',
        userId: moodData.userId
      });
      throw error;
    }
  },

  // Get by ID
  getById: async (id: string): Promise<Mood | null> => {
    try {
      const docRef = doc(db, 'moods', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as Mood : null;
    } catch (error) {
      logFirestoreError(error, 'MoodClientDb.getById', {
        collection: 'moods',
        documentId: id
      });
      return null;
    }
  },

  // Get user's moods
  getByUserId: async (userId: string, limitCount: number = 50): Promise<Mood[]> => {
    try {
      const q = query(
        collection(db, 'moods'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Mood);
    } catch (error) {
      logFirestoreError(error, 'MoodClientDb.getByUserId', {
        collection: 'moods',
        userId: userId
      });
      return [];
    }
  },

  // Get recent moods
  getRecentByUserId: async (userId: string, days: number = 7): Promise<Mood[]> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, 'moods'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Mood);
    } catch (error) {
      logFirestoreError(error, 'MoodClientDb.getRecentByUserId', {
        collection: 'moods',
        userId: userId
      });
      return [];
    }
  },

  // Update mood
  update: async (id: string, updates: Partial<Mood>): Promise<void> => {
    try {
      const docRef = doc(db, 'moods', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'MoodClientDb.update', {
        collection: 'moods',
        documentId: id
      });
      throw error;
    }
  },

  // Delete mood
  delete: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'moods', id);
      await deleteDoc(docRef);
    } catch (error) {
      logFirestoreError(error, 'MoodClientDb.delete', {
        collection: 'moods',
        documentId: id
      });
      throw error;
    }
  },

  // Real-time listener for user's moods
  onUserMoodsChange: (userId: string, callback: (moods: Mood[]) => void): Unsubscribe => {
    try {
      const q = query(
        collection(db, 'moods'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      return onSnapshot(q, (snapshot) => {
        const moods = snapshot.docs.map(doc => doc.data() as Mood);
        callback(moods);
      }, (error) => {
        // Handle permission errors and not-found errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for user moods listener, this may be expected');
          return;
        }

        logFirestoreError(error, 'MoodClientDb.onUserMoodsChange', {
          collection: 'moods',
          userId: userId
        });
      });
    } catch (error) {
      logFirestoreError(error, 'MoodClientDb.onUserMoodsChange.setup', {
        collection: 'moods',
        userId: userId
      });
      throw error;
    }
  },

  // Get mood statistics
  getMoodStats: async (userId: string, days: number = 30): Promise<any> => {
    try {
      const moods = await MoodClientDb.getRecentByUserId(userId, days);

      const stats = {
        totalMoods: moods.length,
        averageIntensity: moods.reduce((sum, mood) => sum + (mood.intensity || 0), 0) / moods.length || 0,
        moodTypes: moods.reduce((acc, mood) => {
          acc[mood.moodType] = (acc[mood.moodType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        moodTrend: moods.slice(0, 7).map(mood => ({
          date: mood.createdAt,
          type: mood.moodType,
          intensity: mood.intensity || 0
        }))
      };

      return stats;
    } catch (error) {
      logFirestoreError(error, 'MoodClientDb.getMoodStats', {
        collection: 'moods',
        userId: userId
      });
      return {
        totalMoods: 0,
        averageIntensity: 0,
        moodTypes: {},
        moodTrend: []
      };
    }
  }
};

// MEMORY CRUD Operations (Client-side)
export const MemoryClientDb = {
  // Create memory
  create: async (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const memoryRef = doc(collection(db, 'memories'));
      const memory = {
        id: memoryRef.id,
        ...memoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(memoryRef, memory);
      return memoryRef.id;
    } catch (error) {
      logFirestoreError(error, 'MemoryClientDb.create', {
        collection: 'memories',
        userId: memoryData.userId
      });
      throw error;
    }
  },

  // Get by ID
  getById: async (id: string): Promise<Memory | null> => {
    try {
      const docRef = doc(db, 'memories', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as Memory : null;
    } catch (error) {
      logFirestoreError(error, 'MemoryClientDb.getById', {
        collection: 'memories',
        documentId: id
      });
      return null;
    }
  },

  // Get user's memories
  getByUserId: async (userId: string): Promise<Memory[]> => {
    try {
      const q = query(
        collection(db, 'memories'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Memory);
    } catch (error) {
      logFirestoreError(error, 'MemoryClientDb.getByUserId', {
        collection: 'memories',
        userId: userId
      });
      return [];
    }
  },

  // Get memory by key
  getByKey: async (userId: string, key: string): Promise<Memory | null> => {
    try {
      const q = query(
        collection(db, 'memories'),
        where('userId', '==', userId),
        where('key', '==', key),
        limit(1)
      );

      const snapshot = await getDocs(q);
      return snapshot.empty ? null : snapshot.docs[0].data() as Memory;
    } catch (error) {
      logFirestoreError(error, 'MemoryClientDb.getByKey', {
        collection: 'memories',
        userId: userId
      });
      return null;
    }
  },

  // Update memory
  update: async (id: string, updates: Partial<Memory>): Promise<void> => {
    try {
      const docRef = doc(db, 'memories', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logFirestoreError(error, 'MemoryClientDb.update', {
        collection: 'memories',
        documentId: id
      });
      throw error;
    }
  },

  // Delete memory
  delete: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, 'memories', id);
      await deleteDoc(docRef);
    } catch (error) {
      logFirestoreError(error, 'MemoryClientDb.delete', {
        collection: 'memories',
        documentId: id
      });
      throw error;
    }
  },

  // Real-time listener for user's memories
  onUserMemoriesChange: (userId: string, callback: (memories: Memory[]) => void): Unsubscribe => {
    try {
      const q = query(
        collection(db, 'memories'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const memories = snapshot.docs.map(doc => doc.data() as Memory);
        callback(memories);
      }, (error) => {
        // Handle permission errors and not-found errors gracefully
        if (error instanceof FirestoreError &&
          (error.code === 'permission-denied' || error.code === 'not-found')) {
          console.warn('Permission denied or not found for user memories listener, this may be expected');
          return;
        }

        logFirestoreError(error, 'MemoryClientDb.onUserMemoriesChange', {
          collection: 'memories',
          userId: userId
        });
      });
    } catch (error) {
      logFirestoreError(error, 'MemoryClientDb.onUserMemoriesChange.setup', {
        collection: 'memories',
        userId: userId
      });
      throw error;
    }
  }
};

// Utility functions for client-side operations
export const ClientUtils = {
  // Batch create multiple documents
  batchCreate: async (collectionName: string, documents: any[]): Promise<string[]> => {
    try {
      const promises = documents.map(doc => addDoc(collection(db, collectionName), doc));
      const results = await Promise.all(promises);
      return results.map(result => result.id);
    } catch (error) {
      logFirestoreError(error, 'ClientUtils.batchCreate', {
        collection: collectionName
      });
      throw error;
    }
  },

  // Check if user has access to room
  checkRoomAccess: async (roomId: string, userId: string): Promise<boolean> => {
    try {
      const room = await RoomClientDb.getById(roomId);
      return room?.userId === userId;
    } catch (error) {
      logFirestoreError(error, 'ClientUtils.checkRoomAccess', {
        collection: 'rooms',
        documentId: roomId,
        userId: userId
      });
      return false;
    }
  },

  // Get user's activity summary
  getActivitySummary: async (userId: string, days: number = 7): Promise<any> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [rooms, messages, moods] = await Promise.all([
        RoomClientDb.getByUserId(userId),
        // Note: This would need to be optimized for large datasets
        getDocs(query(
          collection(db, 'messages'),
          where('senderType', '==', 'user'),
          where('createdAt', '>=', Timestamp.fromDate(startDate))
        )),
        MoodClientDb.getRecentByUserId(userId, days)
      ]);

      return {
        totalRooms: rooms.length,
        totalMessages: messages.size,
        totalMoods: moods.length,
        averageMoodIntensity: moods.reduce((sum, mood) => sum + (mood.intensity || 0), 0) / moods.length || 0,
        mostActiveRoom: rooms.reduce((max, room) =>
          (room.messageCount || 0) > (max.messageCount || 0) ? room : max,
          rooms[0] || null
        )
      };
    } catch (error) {
      logFirestoreError(error, 'ClientUtils.getActivitySummary', {
        userId: userId
      });
      return {
        totalRooms: 0,
        totalMessages: 0,
        totalMoods: 0,
        averageMoodIntensity: 0,
        mostActiveRoom: null
      };
    }
  }
};

// Advanced client utilities and smart operations
export const AdvancedClientDb = {
  // Smart conversation management
  conversationManager: {
    // Get conversation summary
    getConversationSummary: async (roomId: string, messageCount: number = 100): Promise<any> => {
      try {
        const { messages } = await MessageClientDb.getByRoomId(roomId, messageCount);

        if (messages.length === 0) {
          return null;
        }

        const userMessages = messages.filter(msg => msg.senderType === 'user');
        const personaMessages = messages.filter(msg => msg.senderType === 'persona');

        return {
          totalMessages: messages.length,
          userMessages: userMessages.length,
          personaMessages: personaMessages.length,
          conversationStarted: messages[messages.length - 1]?.createdAt,
          lastActivity: messages[0]?.createdAt,
          averageResponseTime: calculateAverageResponseTime(messages),
          conversationLength: calculateConversationLength(messages),
          topEmotions: extractTopEmotions(messages),
          keyTopics: extractKeyTopics(messages)
        };
      } catch (error) {
        logFirestoreError(error, 'AdvancedClientDb.conversationManager.getConversationSummary', {
          collection: 'messages'
        });
        return null;
      }
    },

    // Get conversation context for AI
    getConversationContext: async (roomId: string, contextSize: number = 20): Promise<Message[]> => {
      try {
        const { messages } = await MessageClientDb.getByRoomId(roomId, contextSize);
        return messages.reverse(); // Return in chronological order
      } catch (error) {
        logFirestoreError(error, 'AdvancedClientDb.conversationManager.getConversationContext', {
          collection: 'messages'
        });
        return [];
      }
    },

    // Smart message suggestions
    getMessageSuggestions: async (roomId: string, currentMessage: string): Promise<string[]> => {
      const { messages } = await MessageClientDb.getByRoomId(roomId, 50);

      // Simple implementation - in production, you'd use AI/ML
      const suggestions = [];

      // Find similar past messages
      const similarMessages = messages.filter(msg =>
        msg.senderType === 'user' &&
        msg.content.toLowerCase().includes(currentMessage.toLowerCase())
      );

      // Extract common follow-up patterns
      for (const msg of similarMessages) {
        const msgIndex = messages.findIndex(m => m.id === msg.id);
        if (msgIndex > 0) {
          suggestions.push(messages[msgIndex - 1].content);
        }
      }

      return [...new Set(suggestions)].slice(0, 3);
    },

    // Export conversation
    exportConversation: async (roomId: string, format: 'json' | 'text' = 'json'): Promise<any> => {
      const room = await RoomClientDb.getById(roomId);
      const { messages } = await MessageClientDb.getByRoomId(roomId, 1000);

      if (format === 'text') {
        return {
          title: room?.title || 'Conversation',
          content: messages.reverse().map(msg =>
            `${msg.senderType === 'user' ? 'You' : 'AI'}: ${msg.content}`
          ).join('\n'),
          exportedAt: new Date().toISOString()
        };
      }

      return {
        room,
        messages: messages.reverse(),
        exportedAt: new Date().toISOString()
      };
    }
  },

  // Smart persona recommendations
  personaRecommendations: {
    // Get recommended personas based on user activity
    getRecommendedPersonas: async (userId: string, limit: number = 10): Promise<Persona[]> => {
      try {
        const [userRooms, userMoods, allPersonas] = await Promise.all([
          RoomClientDb.getByUserId(userId),
          MoodClientDb.getByUserId(userId, 50),
          PersonaClientDb.getPublic(100)
        ]);

        // Get user's preferred categories
        const usedPersonaIds = userRooms.map(room => room.personaId);
        const usedPersonas = await Promise.all(
          usedPersonaIds.map(id => PersonaClientDb.getById(id))
        );

        const preferredCategories = usedPersonas
          .filter(p => p !== null)
          .map(p => p!.category)
          .filter((category): category is string => category !== undefined);

        // Get recent mood patterns
        const recentMoodTypes = userMoods.slice(0, 10).map(mood => mood.moodType);

        // Score personas based on user preferences
        const scoredPersonas = allPersonas.personas.map(persona => ({
          persona,
          score: calculatePersonaScore(persona, preferredCategories, recentMoodTypes, usedPersonaIds)
        }));

        return scoredPersonas
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(item => item.persona);
      } catch (error) {
        logFirestoreError(error, 'AdvancedClientDb.personaRecommendations.getRecommendedPersonas', {
          userId: userId
        });
        return [];
      }
    },

    // Get similar personas
    getSimilarPersonas: async (personaId: string, limit: number = 5): Promise<Persona[]> => {
      const [targetPersona, allPersonas] = await Promise.all([
        PersonaClientDb.getById(personaId),
        PersonaClientDb.getPublic(100)
      ]);

      if (!targetPersona) {
        return [];
      }

      const similarPersonas = allPersonas.personas
        .filter(p => p.id !== personaId)
        .map(persona => ({
          persona,
          similarity: calculatePersonaSimilarity(targetPersona, persona)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => item.persona);

      return similarPersonas;
    },

    // Get trending personas
    getTrendingPersonas: async (limit: number = 10): Promise<Persona[]> => {
      const { personas } = await PersonaClientDb.getPublic(100);

      return personas
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, limit);
    }
  },

  // Smart mood tracking
  moodTracker: {
    // Get mood insights
    getMoodInsights: async (userId: string, days: number = 30): Promise<any> => {
      try {
        const moods = await MoodClientDb.getRecentByUserId(userId, days);

        if (moods.length === 0) {
          return null;
        }

        const moodCounts = moods.reduce((acc, mood) => {
          acc[mood.moodType] = (acc[mood.moodType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const moodTrend = analyzeMoodTrend(moods);
        const moodPatterns = findMoodPatterns(moods);

        return {
          totalMoods: moods.length,
          moodDistribution: moodCounts,
          dominantMood: Object.entries(moodCounts).reduce((max, [mood, count]) =>
            count > moodCounts[max[0]] ? [mood, count] : max
          )[0],
          averageIntensity: moods.reduce((sum, mood) => sum + (mood.intensity || 0), 0) / moods.length,
          moodTrend,
          patterns: moodPatterns,
          recommendations: generateMoodRecommendations(moods)
        };
      } catch (error) {
        logFirestoreError(error, 'AdvancedClientDb.moodTracker.getMoodInsights', {
          userId: userId
        });
        return null;
      }
    },

    // Predict mood
    predictMood: async (userId: string): Promise<any> => {
      const recentMoods = await MoodClientDb.getRecentByUserId(userId, 7);

      if (recentMoods.length < 3) {
        return null;
      }

      // Simple mood prediction based on recent patterns
      const recentTrend = recentMoods.slice(0, 3);
      const averageIntensity = recentTrend.reduce((sum, mood) => sum + (mood.intensity || 0), 0) / recentTrend.length;

      const moodFrequency = recentMoods.reduce((acc, mood) => {
        acc[mood.moodType] = (acc[mood.moodType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const likelyMood = Object.entries(moodFrequency).reduce((max, [mood, count]) =>
        count > moodFrequency[max[0]] ? [mood, count] : max
      )[0];

      return {
        predictedMood: likelyMood,
        confidence: (moodFrequency[likelyMood] / recentMoods.length) * 100,
        predictedIntensity: averageIntensity,
        basedOnDays: 7,
        recommendation: getMoodRecommendation(likelyMood, averageIntensity)
      };
    }
  },

  // Smart memory management
  memoryManager: {
    // Get relevant memories for context
    getRelevantMemories: async (userId: string, context: string, limit: number = 5): Promise<Memory[]> => {
      try {
        const allMemories = await MemoryClientDb.getByUserId(userId);

        // Simple relevance scoring based on keyword matching
        const scoredMemories = allMemories.map(memory => ({
          memory,
          relevance: calculateMemoryRelevance(memory, context)
        }));

        return scoredMemories
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, limit)
          .map(item => item.memory);
      } catch (error) {
        logFirestoreError(error, 'AdvancedClientDb.memoryManager.getRelevantMemories', {
          userId: userId
        });
        return [];
      }
    },

    // Auto-categorize memories
    categorizeMemories: async (userId: string): Promise<{ [category: string]: Memory[] }> => {
      const memories = await MemoryClientDb.getByUserId(userId);

      const categories = {
        personal: [] as Memory[],
        preferences: [] as Memory[],
        relationships: [] as Memory[],
        interests: [] as Memory[],
        goals: [] as Memory[],
        other: [] as Memory[]
      };

      memories.forEach(memory => {
        const category = categorizeMemory(memory);
        if (category in categories) {
          (categories as any)[category].push(memory);
        } else {
          categories.other.push(memory);
        }
      });

      return categories;
    },

    // Memory insights
    getMemoryInsights: async (userId: string): Promise<any> => {
      const memories = await MemoryClientDb.getByUserId(userId);
      const categorizedMemories = await AdvancedClientDb.memoryManager.categorizeMemories(userId);

      return {
        totalMemories: memories.length,
        categories: Object.entries(categorizedMemories).map(([category, mems]) => ({
          category,
          count: mems.length,
          percentage: (mems.length / memories.length) * 100
        })),
        memoryGrowthRate: calculateMemoryGrowthRate(memories),
        oldestMemory: memories[memories.length - 1],
        newestMemory: memories[0],
        averageMemoryLength: memories.reduce((sum, mem) => sum + mem.value.length, 0) / memories.length
      };
    }
  },

  // Smart notifications and alerts
  notificationManager: {
    // Get personalized notifications
    getPersonalizedNotifications: async (userId: string): Promise<any[]> => {
      const [rooms, moods, personas] = await Promise.all([
        RoomClientDb.getByUserId(userId),
        MoodClientDb.getRecentByUserId(userId, 7),
        PersonaClientDb.getByCreator(userId)
      ]);

      const notifications = [];

      // Check for inactive rooms
      const inactiveRooms = rooms.filter(room => {
        const lastActivity = room.lastMessageAt;
        const daysSinceActivity = lastActivity ?
          (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24) : 999;
        return daysSinceActivity > 7;
      });

      if (inactiveRooms.length > 0) {
        notifications.push({
          type: 'inactive_rooms',
          title: 'Rooms need attention',
          message: `You have ${inactiveRooms.length} rooms with no recent activity`,
          priority: 'medium',
          actionable: true
        });
      }

      // Check mood patterns
      if (moods.length > 0) {
        const recentMoods = moods.slice(0, 3);
        const negativeCount = recentMoods.filter(mood =>
          ['sad', 'angry', 'anxious', 'depressed'].includes(mood.moodType)
        ).length;

        if (negativeCount >= 2) {
          notifications.push({
            type: 'mood_alert',
            title: 'Mood check-in',
            message: 'You\'ve been experiencing some difficult emotions lately. Consider talking to someone.',
            priority: 'high',
            actionable: true
          });
        }
      }

      // Check persona performance
      const underperformingPersonas = personas.filter(persona =>
        persona.usageCount < 5 && persona.isPublic
      );

      if (underperformingPersonas.length > 0) {
        notifications.push({
          type: 'persona_performance',
          title: 'Persona optimization',
          message: `${underperformingPersonas.length} of your personas could use some improvements`,
          priority: 'low',
          actionable: true
        });
      }

      return notifications;
    }
  },

  // Performance and caching utilities
  performanceUtils: {
    // Cache frequently accessed data
    cacheManager: {
      // Cache key patterns
      getCacheKey: (type: string, id: string, params?: any): string => {
        const paramString = params ? JSON.stringify(params) : '';
        return `${type}_${id}_${paramString}`;
      },

      // Simple in-memory cache (in production, use Redis or similar)
      cache: new Map<string, { data: any, timestamp: number, ttl: number }>(),

      set: (key: string, data: any, ttl: number = 300000): void => { // 5 minutes default
        AdvancedClientDb.performanceUtils.cacheManager.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        });
      },

      get: (key: string): any => {
        const cached = AdvancedClientDb.performanceUtils.cacheManager.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
          AdvancedClientDb.performanceUtils.cacheManager.cache.delete(key);
          return null;
        }

        return cached.data;
      },

      clear: (): void => {
        AdvancedClientDb.performanceUtils.cacheManager.cache.clear();
      }
    },

    // Optimized data fetching
    optimizedFetch: {
      // Get user dashboard data efficiently
      getUserDashboard: async (userId: string): Promise<any> => {
        try {
          const cacheKey = AdvancedClientDb.performanceUtils.cacheManager.getCacheKey('dashboard', userId);
          const cached = AdvancedClientDb.performanceUtils.cacheManager.get(cacheKey);

          if (cached) {
            return cached;
          }

          const [user, rooms, recentMoods, activity] = await Promise.all([
            UserClientDb.getById(userId),
            RoomClientDb.getByUserId(userId, 10),
            MoodClientDb.getRecentByUserId(userId, 7),
            ClientUtils.getActivitySummary(userId, 7)
          ]);

          const dashboardData = {
            user,
            rooms,
            recentMoods,
            activity,
            timestamp: new Date().toISOString()
          };

          AdvancedClientDb.performanceUtils.cacheManager.set(cacheKey, dashboardData, 300000); // 5 minutes
          return dashboardData;
        } catch (error) {
          logFirestoreError(error, 'AdvancedClientDb.performanceUtils.optimizedFetch.getUserDashboard', {
            userId: userId
          });
          return {
            user: null,
            rooms: [],
            recentMoods: [],
            activity: {
              totalRooms: 0,
              totalMessages: 0,
              totalMoods: 0,
              averageMoodIntensity: 0,
              mostActiveRoom: null
            },
            timestamp: new Date().toISOString()
          };
        }
      }
    }
  }
};

// Helper functions for advanced client operations
const calculateAverageResponseTime = (messages: Message[]): number => {
  if (messages.length < 2) return 0;

  const responseTimes = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];

    if (current.senderType !== next.senderType) {
      const timeDiff = current.createdAt.getTime() - next.createdAt.getTime();
      responseTimes.push(timeDiff);
    }
  }

  return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
};

const calculateConversationLength = (messages: Message[]): number => {
  if (messages.length < 2) return 0;

  const start = messages[messages.length - 1].createdAt.getTime();
  const end = messages[0].createdAt.getTime();

  return end - start; // in milliseconds
};

const extractTopEmotions = (messages: Message[]): string[] => {
  // Simple emotion extraction - in production, use NLP
  const emotionKeywords = {
    happy: ['happy', 'joy', 'excited', 'glad', 'wonderful'],
    sad: ['sad', 'down', 'disappointed', 'upset', 'unhappy'],
    angry: ['angry', 'mad', 'frustrated', 'annoyed', 'furious'],
    anxious: ['anxious', 'worried', 'nervous', 'stressed', 'concerned']
  };

  const emotionCounts = {} as Record<string, number>;

  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        }
      });
    });
  });

  return Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([emotion]) => emotion);
};

const extractKeyTopics = (messages: Message[]): string[] => {
  // Simple topic extraction - in production, use NLP
  const allText = messages.map(msg => msg.content).join(' ').toLowerCase();
  const words = allText.split(/\s+/);

  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

  const wordCounts = words
    .filter(word => word.length > 3 && !stopWords.has(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
};

const calculatePersonaScore = (persona: Persona, preferredCategories: string[], recentMoods: string[], usedPersonaIds: string[]): number => {
  let score = 0;

  // Category preference
  if (preferredCategories.includes(persona.category || '')) {
    score += 50;
  }

  // Mood compatibility
  const moodCompatibility = getMoodCompatibility(persona.category || '', recentMoods);
  score += moodCompatibility * 30;

  // Popularity
  score += Math.min(persona.usageCount || 0, 100) * 0.1;

  // Rating
  score += (persona.rating || 0) * 10;

  // Novelty (not used before)
  if (!usedPersonaIds.includes(persona.id)) {
    score += 20;
  }

  return score;
};

const getMoodCompatibility = (personaCategory: string, recentMoods: string[]): number => {
  const moodCategoryMap = {
    'therapist': ['sad', 'anxious', 'depressed', 'stressed'],
    'friend': ['happy', 'excited', 'lonely', 'bored'],
    'tutor': ['curious', 'motivated', 'confused'],
    'coach': ['motivated', 'goal-oriented', 'ambitious']
  };

  const compatibleMoods = moodCategoryMap[personaCategory.toLowerCase() as keyof typeof moodCategoryMap] || [];
  const matches = recentMoods.filter(mood => compatibleMoods.includes(mood)).length;

  return matches / recentMoods.length;
};

const calculatePersonaSimilarity = (persona1: Persona, persona2: Persona): number => {
  let similarity = 0;

  // Category similarity
  if (persona1.category === persona2.category) {
    similarity += 40;
  }

  // Language similarity
  if (persona1.language === persona2.language) {
    similarity += 20;
  }

  // Tag similarity
  const tags1 = persona1.tags || [];
  const tags2 = persona2.tags || [];
  const commonTags = tags1.filter(tag => tags2.includes(tag));
  similarity += (commonTags.length / Math.max(tags1.length, tags2.length)) * 40;

  return similarity;
};

const analyzeMoodTrend = (moods: Mood[]): string => {
  if (moods.length < 3) return 'insufficient_data';

  const recentMoods = moods.slice(0, 3);
  const averageIntensity = recentMoods.reduce((sum, mood) => sum + (mood.intensity || 0), 0) / recentMoods.length;

  const olderMoods = moods.slice(3, 6);
  const olderAverageIntensity = olderMoods.reduce((sum, mood) => sum + (mood.intensity || 0), 0) / olderMoods.length;

  const difference = averageIntensity - olderAverageIntensity;

  if (difference > 1) return 'improving';
  if (difference < -1) return 'declining';
  return 'stable';
};

const findMoodPatterns = (moods: Mood[]): any => {
  const patterns = {
    timeOfDay: {} as Record<string, number>,
    dayOfWeek: {} as Record<string, number>,
    triggers: {} as Record<string, number>
  };

  moods.forEach(mood => {
    const date = mood.createdAt;
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Time of day patterns
    const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    patterns.timeOfDay[timeSlot] = (patterns.timeOfDay[timeSlot] || 0) + 1;

    // Day of week patterns
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    patterns.dayOfWeek[dayName] = (patterns.dayOfWeek[dayName] || 0) + 1;

    // Trigger patterns
    if (mood.triggerThought) {
      patterns.triggers[mood.triggerThought] = (patterns.triggers[mood.triggerThought] || 0) + 1;
    }
  });

  return patterns;
};

const generateMoodRecommendations = (moods: Mood[]): string[] => {
  const recommendations = [];

  const moodCounts = moods.reduce((acc, mood) => {
    acc[mood.moodType] = (acc[mood.moodType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantMood = Object.entries(moodCounts).reduce((max, [mood, count]) =>
    count > moodCounts[max[0]] ? [mood, count] : max
  )[0];

  const moodRecommendations = {
    sad: ['Consider talking to a therapist persona', 'Try some uplifting activities', 'Connect with friends'],
    anxious: ['Practice meditation', 'Talk to a calming persona', 'Try breathing exercises'],
    happy: ['Share your joy with others', 'Engage in creative activities', 'Help someone else'],
    angry: ['Try anger management techniques', 'Talk to a counselor persona', 'Exercise to release tension']
  };

  recommendations.push(...(moodRecommendations[dominantMood as keyof typeof moodRecommendations] || []));

  return recommendations;
};

const getMoodRecommendation = (mood: string, intensity: number): string => {
  const recommendations = {
    sad: intensity > 7 ? 'Consider professional help' : 'Try talking to a supportive friend',
    anxious: intensity > 7 ? 'Practice deep breathing' : 'Try a calming activity',
    happy: 'Share your positive energy with others',
    angry: intensity > 7 ? 'Take a break and cool down' : 'Try to understand what triggered this'
  };

  return recommendations[mood as keyof typeof recommendations] || 'Take care of yourself';
};

const calculateMemoryRelevance = (memory: Memory, context: string): number => {
  const memoryWords = memory.value.toLowerCase().split(/\s+/);
  const contextWords = context.toLowerCase().split(/\s+/);

  const matches = memoryWords.filter(word => contextWords.includes(word)).length;
  return matches / Math.max(memoryWords.length, contextWords.length);
};

const categorizeMemory = (memory: Memory): string => {
  const value = memory.value.toLowerCase();

  if (value.includes('like') || value.includes('prefer') || value.includes('enjoy')) {
    return 'preferences';
  }
  if (value.includes('family') || value.includes('friend') || value.includes('relationship')) {
    return 'relationships';
  }
  if (value.includes('goal') || value.includes('want to') || value.includes('plan')) {
    return 'goals';
  }
  if (value.includes('hobby') || value.includes('interest') || value.includes('passion')) {
    return 'interests';
  }
  if (value.includes('name') || value.includes('age') || value.includes('job') || value.includes('live')) {
    return 'personal';
  }

  return 'other';
};

const calculateMemoryGrowthRate = (memories: Memory[]): number => {
  if (memories.length < 2) return 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentMemories = memories.filter(memory =>
    memory.createdAt >= thirtyDaysAgo
  );

  return recentMemories.length / 30; // memories per day
};
