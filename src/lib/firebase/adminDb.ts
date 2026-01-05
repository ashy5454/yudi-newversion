import { adminDb } from './firebase-admin';
import {
  User,
  Credit,
  AiModel,
  Persona,
  Room,
  Message,
  Mood,
  Memory,
  ResponseData,
  Admin,
  Analytic
} from './dbTypes';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Vector search using native Firestore vector search
const performVectorSearch = async (
  collectionName: string,
  vectorField: string,
  queryVector: number[],
  limit: number = 10,
  distanceMeasure: 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT' = 'COSINE',
  distanceThreshold?: number,
  preFilters?: { [key: string]: any }
) => {
  const collectionRef = adminDb.collection(collectionName);

  // Apply pre-filters if provided
  if (preFilters) {
    let filteredQuery: any = collectionRef;
    Object.entries(preFilters).forEach(([key, value]) => {
      filteredQuery = filteredQuery.where(key, '==', value);
    });

    // Perform vector search on filtered query
    const vectorQuery = filteredQuery.findNearest({
      vectorField,
      queryVector: FieldValue.vector(queryVector),
      limit,
      distanceMeasure,
      distanceResultField: 'vector_distance',
      ...(distanceThreshold && { distanceThreshold })
    });

    const snapshot = await vectorQuery.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      data: doc.data(),
      distance: doc.get('vector_distance')
    }));
  } else {
    // Perform vector search without filters
    const vectorQuery = collectionRef.findNearest({
      vectorField,
      queryVector: FieldValue.vector(queryVector),
      limit,
      distanceMeasure,
      distanceResultField: 'vector_distance',
      ...(distanceThreshold && { distanceThreshold })
    });

    const snapshot = await vectorQuery.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      data: doc.data(),
      distance: doc.get('vector_distance')
    }));
  }
};

// Helper function to create vector embedding
const createVectorEmbedding = (vector: number[]) => {
  return FieldValue.vector(vector);
};

// Helper function to clean data by removing undefined values
const cleanData = (data: any): any => {
  if (data === null || data === undefined) {
    return null;
  }

  if (Array.isArray(data)) {
    return data.map(cleanData).filter(item => item !== null);
  }

  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanData(value);
      }
    }
    return cleaned;
  }

  return data;
};

// USER CRUD Operations
export const UserAdminDb = {
  // Create user
  create: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const userRef = adminDb.collection('users').doc();

    // Clean the data to remove undefined values
    const cleanedData = cleanData(userData);

    const user: User = {
      id: userRef.id,
      ...cleanedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await userRef.set(user);
    return userRef.id;
  },

  // Get user by ID
  getById: async (id: string): Promise<User | null> => {
    const doc = await adminDb.collection('users').doc(id).get();
    return doc.exists ? doc.data() as User : null;
  },

  // Get user by email
  getByEmail: async (email: string): Promise<User | null> => {
    const snapshot = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data() as User;
  },

  // Update user
  update: async (id: string, updates: Partial<User>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('users').doc(id).update(updateData);
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    await adminDb.collection('users').doc(id).delete();
  },

  // Get all users with pagination
  getAll: async (limit: number = 20, lastDoc?: any): Promise<{ users: User[], lastDoc: any }> => {
    let query = adminDb.collection('users').orderBy('createdAt', 'desc').limit(limit);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => doc.data() as User);
    const lastDocument = snapshot.docs[snapshot.docs.length - 1];

    return { users, lastDoc: lastDocument };
  },

  // Update user credit
  updateCredit: async (userId: string, creditUpdate: Partial<Credit>): Promise<void> => {
    await adminDb.collection('users').doc(userId).update({
      credit: creditUpdate,
      updatedAt: new Date()
    });
  },

  // Get users by status
  getByStatus: async (status: string): Promise<User[]> => {
    const snapshot = await adminDb.collection('users').where('status', '==', status).get();
    return snapshot.docs.map(doc => doc.data() as User);
  },

  // Ban user
  ban: async (id: string): Promise<void> => {
    await adminDb.collection('users').doc(id).update({
      status: 'banned',
      updatedAt: new Date()
    });
  },

  // Unban user
  unban: async (id: string): Promise<void> => {
    await adminDb.collection('users').doc(id).update({
      status: 'active',
      updatedAt: new Date()
    });
  }
};

// AI MODEL CRUD Operations
export const AiModelAdminDb = {
  // Create AI model
  create: async (modelData: Omit<AiModel, 'createdAt' | 'updatedAt'>): Promise<string> => {
    const modelRef = adminDb.collection('aiModels').doc();
    const model: AiModel = {
      ...modelData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await modelRef.set(model);
    return modelRef.id;
  },

  // Get by ID
  getById: async (id: string): Promise<AiModel | null> => {
    const doc = await adminDb.collection('aiModels').doc(id).get();
    return doc.exists ? doc.data() as AiModel : null;
  },

  // Get all active models
  getActive: async (): Promise<AiModel[]> => {
    const snapshot = await adminDb.collection('aiModels').where('isActive', '==', true).get();
    return snapshot.docs.map(doc => doc.data() as AiModel);
  },

  // Update model
  update: async (id: string, updates: Partial<AiModel>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('aiModels').doc(id).update(updateData);
  },

  // Delete model
  delete: async (id: string): Promise<void> => {
    await adminDb.collection('aiModels').doc(id).delete();
  },

  // Get all models
  getAll: async (): Promise<AiModel[]> => {
    const snapshot = await adminDb.collection('aiModels').get();
    return snapshot.docs.map(doc => doc.data() as AiModel);
  },

  // Activate/deactivate model
  toggleActive: async (id: string, isActive: boolean): Promise<void> => {
    await adminDb.collection('aiModels').doc(id).update({
      isActive,
      updatedAt: new Date()
    });
  }
};

// PERSONA CRUD Operations
export const PersonaAdminDb = {
  // Create persona
  create: async (personaData: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const personaRef = adminDb.collection('personas').doc();

    // Clean the data to remove undefined values
    const cleanedData = cleanData(personaData);

    const persona: Persona = {
      id: personaRef.id,
      ...cleanedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await personaRef.set(persona);
    return personaRef.id;
  },

  // Get by ID
  getById: async (id: string): Promise<Persona | null> => {
    const doc = await adminDb.collection('personas').doc(id).get();
    return doc.exists ? doc.data() as Persona : null;
  },

  // Get all personas with pagination
  getAll: async (limit: number = 20, lastDoc?: any): Promise<{ personas: Persona[], lastDoc: any }> => {
    let query = adminDb.collection('personas').orderBy('createdAt', 'desc').limit(limit);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    const personas = snapshot.docs.map(doc => doc.data() as Persona);
    const lastDocument = snapshot.docs[snapshot.docs.length - 1];

    return { personas, lastDoc: lastDocument };
  },

  // Get public personas
  getPublic: async (): Promise<Persona[]> => {
    const snapshot = await adminDb.collection('personas').where('isPublic', '==', true).get();
    return snapshot.docs.map(doc => doc.data() as Persona);
  },

  // Update persona
  update: async (id: string, updates: Partial<Persona>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('personas').doc(id).update(updateData);
  },

  // Delete persona
  delete: async (id: string): Promise<void> => {
    await adminDb.collection('personas').doc(id).delete();
  },

  // Get by category
  getByCategory: async (category: string): Promise<Persona[]> => {
    const snapshot = await adminDb.collection('personas').where('category', '==', category).get();
    return snapshot.docs.map(doc => doc.data() as Persona);
  },

  // Get by creator
  getByCreator: async (creatorId: string): Promise<Persona[]> => {
    const snapshot = await adminDb.collection('personas').where('creator.id', '==', creatorId).get();
    return snapshot.docs.map(doc => doc.data() as Persona);
  },

  // Approve persona (make public)
  approve: async (id: string): Promise<void> => {
    await adminDb.collection('personas').doc(id).update({
      isPublic: true,
      updatedAt: new Date()
    });
  },

  // Reject persona (make private)
  reject: async (id: string): Promise<void> => {
    await adminDb.collection('personas').doc(id).update({
      isPublic: false,
      updatedAt: new Date()
    });
  },

  // Update usage count
  incrementUsage: async (id: string): Promise<void> => {
    await adminDb.collection('personas').doc(id).update({
      usageCount: FieldValue.increment(1),
      updatedAt: new Date()
    });
  }
};

// ROOM CRUD Operations
export const RoomAdminDb = {
  // Create room
  create: async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const roomRef = adminDb.collection('rooms').doc();

    // Clean the data to remove undefined values
    const cleanedData = cleanData(roomData);

    const room: Room = {
      id: roomRef.id,
      ...cleanedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await roomRef.set(room);
    return roomRef.id;
  },

  // Get by ID
  getById: async (id: string): Promise<Room | null> => {
    const doc = await adminDb.collection('rooms').doc(id).get();
    return doc.exists ? doc.data() as Room : null;
  },

  // Get by user ID
  getByUserId: async (userId: string): Promise<Room[]> => {
    const snapshot = await adminDb.collection('rooms').where('userId', '==', userId).get();
    return snapshot.docs.map(doc => doc.data() as Room);
  },

  // Get all rooms with pagination
  getAll: async (limit: number = 20, lastDoc?: any): Promise<{ rooms: Room[], lastDoc: any }> => {
    let query = adminDb.collection('rooms').orderBy('createdAt', 'desc').limit(limit);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    const rooms = snapshot.docs.map(doc => doc.data() as Room);
    const lastDocument = snapshot.docs[snapshot.docs.length - 1];

    return { rooms, lastDoc: lastDocument };
  },

  // Update room
  update: async (id: string, updates: Partial<Room>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('rooms').doc(id).update(updateData);
  },

  // Delete room
  delete: async (id: string): Promise<void> => {
    await adminDb.collection('rooms').doc(id).delete();
  },

  // Archive room
  archive: async (id: string): Promise<void> => {
    await adminDb.collection('rooms').doc(id).update({
      isArchived: true,
      updatedAt: new Date()
    });
  },

  // Unarchive room
  unarchive: async (id: string): Promise<void> => {
    await adminDb.collection('rooms').doc(id).update({
      isArchived: false,
      updatedAt: new Date()
    });
  },

  // Update last message
  updateLastMessage: async (id: string, content: string): Promise<void> => {
    await adminDb.collection('rooms').doc(id).update({
      lastMessageAt: new Date(),
      lastMessageContent: content,
      messageCount: FieldValue.increment(1),
      updatedAt: new Date()
    });
  }
};

// MESSAGE CRUD Operations
export const MessageAdminDb = {
  // Create message
  create: async (messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const messageRef = adminDb.collection('messages').doc();

    // Clean the data to remove undefined values
    const cleanedData = cleanData(messageData);

    const message: Message = {
      id: messageRef.id,
      ...cleanedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await messageRef.set(message);
    return messageRef.id;
  },

  // Get by ID
  getById: async (id: string): Promise<Message | null> => {
    const doc = await adminDb.collection('messages').doc(id).get();
    return doc.exists ? doc.data() as Message : null;
  },

  // Get by room ID - Check subcollection first, then fallback to old structure
  getByRoomId: async (roomId: string, limit: number = 50, lastDoc?: any): Promise<{ messages: Message[], lastDoc: any }> => {
    // Try NEW structure first: rooms/{roomId}/messages (subcollection)
    try {
      const subcollectionRef = adminDb.collection('rooms').doc(roomId).collection('messages');
      const subcollectionSnapshot = await subcollectionRef.get();
      
      if (!subcollectionSnapshot.empty) {
        let messages = subcollectionSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Message);

        // Sort in-memory (Descending: Newest first)
        messages.sort((a, b) => {
          const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : new Date(a.createdAt as any).getTime();
          const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : new Date(b.createdAt as any).getTime();
          return timeB - timeA;
        });

        // Limit after sorting
        if (limit > 0 && messages.length > limit) {
          messages = messages.slice(0, limit);
        }

        const lastDocument = subcollectionSnapshot.docs[subcollectionSnapshot.docs.length - 1];
        console.log(`[AdminDb] ✅ Found ${messages.length} messages in subcollection for room: ${roomId}`);
        return { messages, lastDoc: lastDocument };
      }
    } catch (subcollectionError) {
      console.warn(`[AdminDb] Subcollection query failed, trying old structure:`, subcollectionError);
    }

    // Fall back to OLD structure: messages collection with roomId field
    let query = adminDb.collection('messages')
      .where('roomId', '==', roomId);

    const snapshot = await query.get();
    let messages = snapshot.docs.map(doc => doc.data() as Message);

    // Sort in-memory (Descending: Newest first)
    messages.sort((a, b) => {
      const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : new Date(a.createdAt as any).getTime();
      const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : new Date(b.createdAt as any).getTime();
      return timeB - timeA;
    });

    const lastDocument = snapshot.docs[snapshot.docs.length - 1];

    // Limit after sorting
    if (limit > 0 && messages.length > limit) {
      messages = messages.slice(0, limit);
    }

    console.log(`[AdminDb] Found ${messages.length} messages in old collection structure for room: ${roomId}`);
    return { messages, lastDoc: lastDocument };
  },

  // Update message
  update: async (id: string, updates: Partial<Message>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('messages').doc(id).update(updateData);
  },

  // Delete message
  delete: async (id: string): Promise<void> => {
    await adminDb.collection('messages').doc(id).delete();
  },

  // Vector search for messages
  searchSimilar: async (
    queryVector: number[],
    limit: number = 10,
    filters?: { roomId?: string },
    distanceMeasure: 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT' = 'COSINE',
    distanceThreshold?: number
  ): Promise<any[]> => {
    return performVectorSearch(
      'messages',
      'embedding',
      queryVector,
      limit,
      distanceMeasure,
      distanceThreshold,
      filters
    );
  },

  // Mark as read
  markAsRead: async (id: string): Promise<void> => {
    await adminDb.collection('messages').doc(id).update({
      isRead: true,
      updatedAt: new Date()
    });
  },

  // Get system messages
  getSystemMessages: async (roomId: string): Promise<Message[]> => {
    const snapshot = await adminDb.collection('messages')
      .where('roomId', '==', roomId)
      .where('isSystemMessage', '==', true)
      .get();
    return snapshot.docs.map(doc => doc.data() as Message);
  }
};

// MOOD CRUD Operations
export const MoodAdminDb = {
  // Create mood
  create: async (moodData: Omit<Mood, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const moodRef = adminDb.collection('moods').doc();

    // Clean the data to remove undefined values
    const cleanedData = cleanData(moodData);

    const mood: Mood = {
      id: moodRef.id,
      ...cleanedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await moodRef.set(mood);
    return moodRef.id;
  },

  // Get by ID
  getById: async (id: string): Promise<Mood | null> => {
    const doc = await adminDb.collection('moods').doc(id).get();
    return doc.exists ? doc.data() as Mood : null;
  },

  // Get by user ID
  getByUserId: async (userId: string): Promise<Mood[]> => {
    const snapshot = await adminDb.collection('moods').where('userId', '==', userId).get();
    return snapshot.docs.map(doc => doc.data() as Mood);
  },

  // Update mood
  update: async (id: string, updates: Partial<Mood>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('moods').doc(id).update(updateData);
  },

  // Delete mood
  delete: async (id: string): Promise<void> => {
    await adminDb.collection('moods').doc(id).delete();
  },

  // Vector search for moods
  searchSimilar: async (
    queryVector: number[],
    limit: number = 10,
    filters?: { userId?: string },
    distanceMeasure: 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT' = 'COSINE',
    distanceThreshold?: number
  ): Promise<any[]> => {
    return performVectorSearch(
      'moods',
      'embedding',
      queryVector,
      limit,
      distanceMeasure,
      distanceThreshold,
      filters
    );
  },

  // Get mood analytics
  getMoodAnalytics: async (userId: string, days: number = 30): Promise<any> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await adminDb.collection('moods')
      .where('userId', '==', userId)
      .where('createdAt', '>=', Timestamp.fromDate(startDate))
      .get();

    const moods = snapshot.docs.map(doc => doc.data() as Mood);

    return {
      totalMoods: moods.length,
      averageIntensity: moods.reduce((sum, mood) => sum + (mood.intensity || 0), 0) / moods.length,
      moodTypes: moods.reduce((acc, mood) => {
        acc[mood.moodType] = (acc[mood.moodType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
};

// MEMORY CRUD Operations
export const MemoryAdminDb = {
  // Create memory
  create: async (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const memoryRef = adminDb.collection('memories').doc();

    // Clean the data to remove undefined values
    const cleanedData = cleanData(memoryData);

    const memory: Memory = {
      id: memoryRef.id,
      ...cleanedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await memoryRef.set(memory);
    return memoryRef.id;
  },

  // Get by ID
  getById: async (id: string): Promise<Memory | null> => {
    const doc = await adminDb.collection('memories').doc(id).get();
    return doc.exists ? doc.data() as Memory : null;
  },

  // Get by user ID
  getByUserId: async (userId: string): Promise<Memory[]> => {
    const snapshot = await adminDb.collection('memories').where('userId', '==', userId).get();
    return snapshot.docs.map(doc => doc.data() as Memory);
  },

  // Get by key
  getByKey: async (userId: string, key: string): Promise<Memory | null> => {
    const snapshot = await adminDb.collection('memories')
      .where('userId', '==', userId)
      .where('key', '==', key)
      .limit(1)
      .get();
    return snapshot.empty ? null : snapshot.docs[0].data() as Memory;
  },

  // Update memory
  update: async (id: string, updates: Partial<Memory>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('memories').doc(id).update(updateData);
  },

  // Delete memory
  delete: async (id: string): Promise<void> => {
    await adminDb.collection('memories').doc(id).delete();
  },

  // Vector search for memories
  searchSimilar: async (
    queryVector: number[],
    limit: number = 10,
    filters?: { userId?: string },
    distanceMeasure: 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT' = 'COSINE',
    distanceThreshold?: number
  ): Promise<any[]> => {
    return performVectorSearch(
      'memories',
      'embedding',
      queryVector,
      limit,
      distanceMeasure,
      distanceThreshold,
      filters
    );
  },

  // Upsert memory (update if exists, create if not)
  upsert: async (userId: string, key: string, value: string, embedding?: number[]): Promise<string> => {
    const existing = await MemoryAdminDb.getByKey(userId, key);

    if (existing) {
      const updateData = {
        value,
        ...(embedding && { embedding: createVectorEmbedding(embedding) })
      };
      await MemoryAdminDb.update(existing.id, updateData);
      return existing.id;
    } else {
      const createData = {
        userId,
        key,
        value,
        ...(embedding && { embedding: createVectorEmbedding(embedding) })
      };
      return await MemoryAdminDb.create(createData);
    }
  }
};

// RESPONSE DATA CRUD Operations
export const ResponseDataAdminDb = {
  // Create response data
  create: async (responseData: Omit<ResponseData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const responseRef = adminDb.collection('responseData').doc();
    const response: ResponseData = {
      id: responseRef.id,
      ...responseData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await responseRef.set(response);
    return responseRef.id;
  },

  // Get by ID
  getById: async (id: string): Promise<ResponseData | null> => {
    const doc = await adminDb.collection('responseData').doc(id).get();
    return doc.exists ? doc.data() as ResponseData : null;
  },

  // Get all response data
  getAll: async (): Promise<ResponseData[]> => {
    const snapshot = await adminDb.collection('responseData').get();
    return snapshot.docs.map(doc => doc.data() as ResponseData);
  },

  // Update response data
  update: async (id: string, updates: Partial<ResponseData>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('responseData').doc(id).update(updateData);
  },

  // Delete response data
  delete: async (id: string): Promise<void> => {
    await adminDb.collection('responseData').doc(id).delete();
  },

  // Vector search for response data
  searchSimilar: async (
    queryVector: number[],
    limit: number = 10,
    filters?: {
      gender?: string,
      languageCode?: string,
      ageMin?: number,
      ageMax?: number
    },
    distanceMeasure: 'EUCLIDEAN' | 'COSINE' | 'DOT_PRODUCT' = 'COSINE',
    distanceThreshold?: number
  ): Promise<any[]> => {
    return performVectorSearch(
      'responseData',
      'embedding',
      queryVector,
      limit,
      distanceMeasure,
      distanceThreshold,
      filters
    );
  },

  // Get by criteria
  getByCriteria: async (criteria: {
    gender?: string,
    languageCode?: string,
    ageMin?: number,
    ageMax?: number,
    responseStyleName?: string
  }): Promise<ResponseData[]> => {
    let queryRef: any = adminDb.collection('responseData');

    if (criteria.gender) {
      queryRef = queryRef.where('gender', '==', criteria.gender);
    }
    if (criteria.languageCode) {
      queryRef = queryRef.where('languageCode', '==', criteria.languageCode);
    }
    if (criteria.responseStyleName) {
      queryRef = queryRef.where('responseStyleName', '==', criteria.responseStyleName);
    }

    const snapshot = await queryRef.get();
    return snapshot.docs.map((doc: any) => doc.data() as ResponseData);
  }
};

// ADMIN CRUD Operations
export const AdminAdminDb = {
  // Create admin
  create: async (adminData: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const adminRef = adminDb.collection('admins').doc();
    const admin: Admin = {
      id: adminRef.id,
      ...adminData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminRef.set(admin);
    return adminRef.id;
  },

  // Get by ID
  getById: async (id: string): Promise<Admin | null> => {
    const doc = await adminDb.collection('admins').doc(id).get();
    return doc.exists ? doc.data() as Admin : null;
  },

  // Get by user ID
  getByUserId: async (userId: string): Promise<Admin | null> => {
    const snapshot = await adminDb.collection('admins').where('userId', '==', userId).limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data() as Admin;
  },

  // Get all admins
  getAll: async (): Promise<Admin[]> => {
    const snapshot = await adminDb.collection('admins').get();
    return snapshot.docs.map(doc => doc.data() as Admin);
  },

  // Update admin
  update: async (id: string, updates: Partial<Admin>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('admins').doc(id).update(updateData);
  },

  // Delete admin
  delete: async (id: string): Promise<void> => {
    await adminDb.collection('admins').doc(id).delete();
  },

  // Check if user is admin
  isAdmin: async (userId: string): Promise<boolean> => {
    const admin = await AdminAdminDb.getByUserId(userId);
    return admin !== null;
  },

  // Get admin permissions
  getPermissions: async (userId: string): Promise<string[]> => {
    const admin = await AdminAdminDb.getByUserId(userId);
    return admin?.permissions || [];
  }
};

// ANALYTICS CRUD Operations
export const AnalyticsAdminDb = {
  // Create analytics
  create: async (analyticsData: Omit<Analytic, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const analyticsRef = adminDb.collection('analytics').doc();
    const analytics: Analytic = {
      id: analyticsRef.id,
      ...analyticsData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await analyticsRef.set(analytics);
    return analyticsRef.id;
  },

  // Get latest analytics
  getLatest: async (): Promise<Analytic | null> => {
    const snapshot = await adminDb.collection('analytics').orderBy('createdAt', 'desc').limit(1).get();
    return snapshot.empty ? null : snapshot.docs[0].data() as Analytic;
  },

  // Get analytics by date range
  getByDateRange: async (startDate: Date, endDate: Date): Promise<Analytic[]> => {
    const snapshot = await adminDb.collection('analytics')
      .where('createdAt', '>=', Timestamp.fromDate(startDate))
      .where('createdAt', '<=', Timestamp.fromDate(endDate))
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Analytic);
  },

  // Update analytics
  update: async (id: string, updates: Partial<Analytic>): Promise<void> => {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    await adminDb.collection('analytics').doc(id).update(updateData);
  },

  // Generate current analytics
  generateCurrentAnalytics: async (): Promise<Analytic> => {
    const [
      userCount,
      personaCount,
      roomCount,
      messageCount,
      moodCount,
      memoryCount,
      responseDataCount
    ] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('personas').count().get(),
      adminDb.collection('rooms').count().get(),
      adminDb.collection('messages').count().get(),
      adminDb.collection('moods').count().get(),
      adminDb.collection('memories').count().get(),
      adminDb.collection('responseData').count().get()
    ]);

    // Get active users (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const activeUsersSnapshot = await adminDb.collection('users')
      .where('lastSeen', '>=', Timestamp.fromDate(yesterday))
      .count()
      .get();

    const analytics: Omit<Analytic, 'id'> = {
      userCount: userCount.data().count,
      currentActiveUserCount: activeUsersSnapshot.data().count,
      personaCount: personaCount.data().count,
      roomCount: roomCount.data().count,
      messageCount: messageCount.data().count,
      moodCount: moodCount.data().count,
      memoryCount: memoryCount.data().count,
      responseDataCount: responseDataCount.data().count,
      creditCount: 0, // These would need to be calculated from user credits
      creditBoughtCount: 0,
      creditSpentCount: 0,
      totalMessageCount: messageCount.data().count,
      totalRoomCount: roomCount.data().count,
      totalPersonaCount: personaCount.data().count,
      totalMoodCount: moodCount.data().count,
      totalMemoryCount: memoryCount.data().count,
      totalCreditCount: 0,
      totalCreditBoughtCount: 0,
      totalCreditSpentCount: 0,
      totalResponseDataCount: responseDataCount.data().count,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const id = await AnalyticsAdminDb.create(analytics);
    return { id, ...analytics };
  }
};

// Batch operations
export const BatchAdminDb = {
  // Delete user and all related data
  deleteUserAndData: async (userId: string): Promise<void> => {
    const batch = adminDb.batch();

    // Delete user
    batch.delete(adminDb.collection('users').doc(userId));

    // Delete user's rooms
    const roomsSnapshot = await adminDb.collection('rooms').where('userId', '==', userId).get();
    roomsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete user's personas
    const personasSnapshot = await adminDb.collection('personas').where('creator.id', '==', userId).get();
    personasSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete user's moods
    const moodsSnapshot = await adminDb.collection('moods').where('userId', '==', userId).get();
    moodsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Delete user's memories
    const memoriesSnapshot = await adminDb.collection('memories').where('userId', '==', userId).get();
    memoriesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
  },

  // Delete room and all messages
  deleteRoomAndMessages: async (roomId: string): Promise<void> => {
    const batch = adminDb.batch();

    // Delete room
    batch.delete(adminDb.collection('rooms').doc(roomId));

    // Delete room's messages
    const messagesSnapshot = await adminDb.collection('messages').where('roomId', '==', roomId).get();
    messagesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
  }
};

// Advanced utilities and bulk operations
export const AdvancedAdminDb = {
  // Bulk user operations
  bulkUserOperations: {
    // Get user engagement metrics
    getUserEngagementMetrics: async (userId: string, days: number = 30): Promise<any> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [roomsSnapshot, messagesSnapshot, moodsSnapshot] = await Promise.all([
        adminDb.collection('rooms').where('userId', '==', userId).get(),
        adminDb.collection('messages')
          .where('senderType', '==', 'user')
          .where('createdAt', '>=', Timestamp.fromDate(startDate))
          .get(),
        adminDb.collection('moods')
          .where('userId', '==', userId)
          .where('createdAt', '>=', Timestamp.fromDate(startDate))
          .get()
      ]);

      const messages = messagesSnapshot.docs.map(doc => doc.data() as Message);
      const dailyActivity = messages.reduce((acc, msg) => {
        const date = msg.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRooms: roomsSnapshot.size,
        totalMessages: messagesSnapshot.size,
        totalMoods: moodsSnapshot.size,
        averageMessagesPerDay: messagesSnapshot.size / days,
        dailyActivity,
        mostActiveHour: getMostActiveHour(messages),
        engagementScore: calculateEngagementScore(roomsSnapshot.size, messagesSnapshot.size, moodsSnapshot.size)
      };
    },

    // Ban multiple users
    banUsers: async (userIds: string[], reason?: string): Promise<void> => {
      const batch = adminDb.batch();

      userIds.forEach(userId => {
        const userRef = adminDb.collection('users').doc(userId);
        batch.update(userRef, {
          status: 'banned',
          banReason: reason || 'Bulk ban operation',
          updatedAt: new Date()
        });
      });

      await batch.commit();
    },

    // Export user data (GDPR compliance)
    exportUserData: async (userId: string): Promise<any> => {
      const [user, rooms, messages, moods, memories, personas] = await Promise.all([
        adminDb.collection('users').doc(userId).get(),
        adminDb.collection('rooms').where('userId', '==', userId).get(),
        adminDb.collection('messages').where('senderType', '==', 'user').get(),
        adminDb.collection('moods').where('userId', '==', userId).get(),
        adminDb.collection('memories').where('userId', '==', userId).get(),
        adminDb.collection('personas').where('creator.id', '==', userId).get()
      ]);

      return {
        user: user.data(),
        rooms: rooms.docs.map(doc => doc.data()),
        messages: messages.docs.map(doc => doc.data()),
        moods: moods.docs.map(doc => doc.data()),
        memories: memories.docs.map(doc => doc.data()),
        personas: personas.docs.map(doc => doc.data()),
        exportedAt: new Date().toISOString()
      };
    }
  },

  // Advanced search and analytics
  searchAndAnalytics: {
    // Global search across all collections
    globalSearch: async (searchTerm: string, limit: number = 50): Promise<any> => {
      const searchResults = await Promise.all([
        adminDb.collection('users').where('displayName', '>=', searchTerm).where('displayName', '<=', searchTerm + '\uf8ff').limit(limit).get(),
        adminDb.collection('personas').where('name', '>=', searchTerm).where('name', '<=', searchTerm + '\uf8ff').limit(limit).get(),
        adminDb.collection('rooms').where('title', '>=', searchTerm).where('title', '<=', searchTerm + '\uf8ff').limit(limit).get()
      ]);

      return {
        users: searchResults[0].docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'user' })),
        personas: searchResults[1].docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'persona' })),
        rooms: searchResults[2].docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'room' }))
      };
    },

    // Get platform analytics
    getPlatformAnalytics: async (days: number = 30): Promise<any> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        totalUsers,
        activeUsers,
        totalMessages,
        totalRooms,
        totalPersonas,
        publicPersonas
      ] = await Promise.all([
        adminDb.collection('users').count().get(),
        adminDb.collection('users').where('lastSeen', '>=', Timestamp.fromDate(startDate)).count().get(),
        adminDb.collection('messages').where('createdAt', '>=', Timestamp.fromDate(startDate)).count().get(),
        adminDb.collection('rooms').where('createdAt', '>=', Timestamp.fromDate(startDate)).count().get(),
        adminDb.collection('personas').count().get(),
        adminDb.collection('personas').where('isPublic', '==', true).count().get()
      ]);

      // Get top personas by usage
      const topPersonasSnapshot = await adminDb.collection('personas')
        .orderBy('usageCount', 'desc')
        .limit(10)
        .get();

      // Get user growth over time
      const userGrowthSnapshot = await adminDb.collection('users')
        .where('createdAt', '>=', Timestamp.fromDate(startDate))
        .orderBy('createdAt', 'asc')
        .get();

      const userGrowth = userGrowthSnapshot.docs.reduce((acc, doc) => {
        const date = doc.data().createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalUsers: totalUsers.data().count,
        activeUsers: activeUsers.data().count,
        totalMessages: totalMessages.data().count,
        totalRooms: totalRooms.data().count,
        totalPersonas: totalPersonas.data().count,
        publicPersonas: publicPersonas.data().count,
        userRetentionRate: (activeUsers.data().count / totalUsers.data().count) * 100,
        topPersonas: topPersonasSnapshot.docs.map(doc => doc.data()),
        userGrowth,
        generatedAt: new Date().toISOString()
      };
    },

    // Get content moderation queue
    getModerationQueue: async (): Promise<any> => {
      const [
        pendingPersonas,
        reportedMessages,
        bannedUsers,
        suspiciousActivity
      ] = await Promise.all([
        adminDb.collection('personas').where('isPublic', '==', false).where('isActive', '==', true).get(),
        adminDb.collection('messages').where('isReported', '==', true).get(),
        adminDb.collection('users').where('status', '==', 'banned').get(),
        adminDb.collection('users').where('status', '==', 'suspended').get()
      ]);

      return {
        pendingPersonas: pendingPersonas.docs.map(doc => doc.data()),
        reportedMessages: reportedMessages.docs.map(doc => doc.data()),
        bannedUsers: bannedUsers.docs.map(doc => doc.data()),
        suspiciousActivity: suspiciousActivity.docs.map(doc => doc.data()),
        totalPendingActions: pendingPersonas.size + reportedMessages.size + suspiciousActivity.size
      };
    }
  },

  // Advanced persona operations
  personaOperations: {
    // Get persona performance metrics
    getPersonaMetrics: async (personaId: string, days: number = 30): Promise<any> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        persona,
        roomsSnapshot,
        messagesSnapshot,
        ratingsSnapshot
      ] = await Promise.all([
        adminDb.collection('personas').doc(personaId).get(),
        adminDb.collection('rooms').where('personaId', '==', personaId).get(),
        adminDb.collection('messages')
          .where('personaId', '==', personaId)
          .where('createdAt', '>=', Timestamp.fromDate(startDate))
          .get(),
        adminDb.collection('ratings').where('personaId', '==', personaId).get()
      ]);

      if (!persona.exists) {
        throw new Error('Persona not found');
      }

      const messages = messagesSnapshot.docs.map(doc => doc.data() as Message);
      const ratings = ratingsSnapshot.docs.map(doc => doc.data());

      return {
        persona: persona.data(),
        totalRooms: roomsSnapshot.size,
        totalMessages: messagesSnapshot.size,
        averageRating: ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length || 0,
        dailyUsage: messages.reduce((acc, msg) => {
          const date = msg.createdAt.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        popularityScore: calculatePopularityScore(roomsSnapshot.size, messagesSnapshot.size, ratings.length)
      };
    },

    // Bulk approve personas
    bulkApprovePersonas: async (personaIds: string[]): Promise<void> => {
      const batch = adminDb.batch();

      personaIds.forEach(personaId => {
        const personaRef = adminDb.collection('personas').doc(personaId);
        batch.update(personaRef, {
          isPublic: true,
          approvedAt: new Date(),
          updatedAt: new Date()
        });
      });

      await batch.commit();
    },

    // Get trending personas
    getTrendingPersonas: async (days: number = 7, limit: number = 20): Promise<Persona[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get recent room activity
      const recentRoomsSnapshot = await adminDb.collection('rooms')
        .where('createdAt', '>=', Timestamp.fromDate(startDate))
        .get();

      // Count persona usage
      const personaUsage = recentRoomsSnapshot.docs.reduce((acc, doc) => {
        const personaId = doc.data().personaId;
        acc[personaId] = (acc[personaId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get top personas
      const topPersonaIds = Object.entries(personaUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);

      // Fetch persona details
      const personaPromises = topPersonaIds.map(id => adminDb.collection('personas').doc(id).get());
      const personaDocs = await Promise.all(personaPromises);

      return personaDocs
        .filter(doc => doc.exists)
        .map(doc => doc.data() as Persona);
    }
  },

  // System maintenance operations
  systemMaintenance: {
    // Clean up old data
    cleanupOldData: async (days: number = 90): Promise<any> => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const [
        oldMessagesSnapshot,
        oldMoodsSnapshot,
        archivedRoomsSnapshot
      ] = await Promise.all([
        adminDb.collection('messages')
          .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
          .limit(1000)
          .get(),
        adminDb.collection('moods')
          .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
          .limit(1000)
          .get(),
        adminDb.collection('rooms')
          .where('isArchived', '==', true)
          .where('updatedAt', '<', Timestamp.fromDate(cutoffDate))
          .limit(1000)
          .get()
      ]);

      const batch = adminDb.batch();

      // Delete old messages
      oldMessagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete old moods
      oldMoodsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete old archived rooms
      archivedRoomsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return {
        deletedMessages: oldMessagesSnapshot.size,
        deletedMoods: oldMoodsSnapshot.size,
        deletedRooms: archivedRoomsSnapshot.size,
        cleanupDate: new Date().toISOString()
      };
    },

    // Optimize database performance
    optimizeDatabase: async (): Promise<any> => {
      // This would include operations like:
      // - Rebuilding indexes
      // - Compacting collections
      // - Updating denormalized data
      // - Cleaning up orphaned documents

      const optimizationTasks = [
        // Update persona usage counts
        updatePersonaUsageCounts(),
        // Update room message counts
        updateRoomMessageCounts(),
        // Clean up orphaned memories
        cleanupOrphanedMemories(),
        // Update analytics
        AnalyticsAdminDb.generateCurrentAnalytics()
      ];

      const results = await Promise.allSettled(optimizationTasks);

      return {
        tasksCompleted: results.filter(r => r.status === 'fulfilled').length,
        tasksFailed: results.filter(r => r.status === 'rejected').length,
        optimizationDate: new Date().toISOString()
      };
    }
  }
};

// Helper functions for advanced operations
const getMostActiveHour = (messages: Message[]): number => {
  const hourCounts = messages.reduce((acc, msg) => {
    const hour = msg.createdAt.getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return Object.entries(hourCounts).reduce((max, [hour, count]) =>
    count > hourCounts[max] ? parseInt(hour) : max, 0
  );
};

const calculateEngagementScore = (rooms: number, messages: number, moods: number): number => {
  // Simple engagement scoring algorithm
  return (rooms * 10) + (messages * 2) + (moods * 5);
};

const calculatePopularityScore = (rooms: number, messages: number, ratings: number): number => {
  // Simple popularity scoring algorithm
  return (rooms * 5) + (messages * 1) + (ratings * 3);
};

const updatePersonaUsageCounts = async (): Promise<void> => {
  const roomsSnapshot = await adminDb.collection('rooms').get();
  const usageCounts = roomsSnapshot.docs.reduce((acc, doc) => {
    const personaId = doc.data().personaId;
    acc[personaId] = (acc[personaId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const batch = adminDb.batch();
  Object.entries(usageCounts).forEach(([personaId, count]) => {
    const personaRef = adminDb.collection('personas').doc(personaId);
    batch.update(personaRef, { usageCount: count });
  });

  await batch.commit();
};

const updateRoomMessageCounts = async (): Promise<void> => {
  const roomsSnapshot = await adminDb.collection('rooms').get();

  const batch = adminDb.batch();
  for (const roomDoc of roomsSnapshot.docs) {
    const messagesSnapshot = await adminDb.collection('messages')
      .where('roomId', '==', roomDoc.id)
      .count()
      .get();

    batch.update(roomDoc.ref, {
      messageCount: messagesSnapshot.data().count,
      updatedAt: new Date()
    });
  }

  await batch.commit();
};

const cleanupOrphanedMemories = async (): Promise<void> => {
  const memoriesSnapshot = await adminDb.collection('memories').get();
  const userIds = new Set();

  // Get all user IDs
  const usersSnapshot = await adminDb.collection('users').get();
  usersSnapshot.docs.forEach(doc => userIds.add(doc.id));

  // Find orphaned memories
  const orphanedMemories = memoriesSnapshot.docs.filter(doc =>
    !userIds.has(doc.data().userId)
  );

  // Delete orphaned memories
  const batch = adminDb.batch();
  orphanedMemories.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};
