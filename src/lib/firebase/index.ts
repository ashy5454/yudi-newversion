// Export all admin database operations
export {
  UserAdminDb,
  AiModelAdminDb,
  PersonaAdminDb,
  RoomAdminDb,
  MessageAdminDb,
  MoodAdminDb,
  MemoryAdminDb,
  ResponseDataAdminDb,
  AdminAdminDb,
  AnalyticsAdminDb,
  BatchAdminDb,
  AdvancedAdminDb
} from './adminDb';

// Export all client database operations
export {
  UserClientDb,
  AiModelClientDb,
  PersonaClientDb,
  RoomClientDb,
  MessageClientDb,
  MoodClientDb,
  MemoryClientDb,
  ClientUtils,
  AdvancedClientDb
} from './clientDb';

// Export database types
export * from './dbTypes';

// Export Firebase configurations
export { adminDb, adminApp, verifyIdToken } from './firebase-admin';
export { db, auth, googleProvider } from './firebase';

// Database operation types for better TypeScript support
import {
  UserAdminDb,
  AiModelAdminDb,
  PersonaAdminDb,
  RoomAdminDb,
  MessageAdminDb,
  MoodAdminDb,
  MemoryAdminDb,
  ResponseDataAdminDb,
  AdminAdminDb,
  AnalyticsAdminDb,
  BatchAdminDb,
  AdvancedAdminDb
} from './adminDb';

import type { User, Persona, Room, Message, Mood, Memory } from './dbTypes';
import {
  UserClientDb,
  AiModelClientDb,
  PersonaClientDb,
  RoomClientDb,
  MessageClientDb,
  MoodClientDb,
  MemoryClientDb,
  ClientUtils,
  AdvancedClientDb
} from './clientDb';

export type AdminDbOperations = {
  users: typeof UserAdminDb;
  aiModels: typeof AiModelAdminDb;
  personas: typeof PersonaAdminDb;
  rooms: typeof RoomAdminDb;
  messages: typeof MessageAdminDb;
  moods: typeof MoodAdminDb;
  memories: typeof MemoryAdminDb;
  responseData: typeof ResponseDataAdminDb;
  admins: typeof AdminAdminDb;
  analytics: typeof AnalyticsAdminDb;
  batch: typeof BatchAdminDb;
  advanced: typeof AdvancedAdminDb;
};

export type ClientDbOperations = {
  users: typeof UserClientDb;
  aiModels: typeof AiModelClientDb;
  personas: typeof PersonaClientDb;
  rooms: typeof RoomClientDb;
  messages: typeof MessageClientDb;
  moods: typeof MoodClientDb;
  memories: typeof MemoryClientDb;
  utils: typeof ClientUtils;
  advanced: typeof AdvancedClientDb;
};

// Utility functions for database operations
export const DatabaseUtils = {
  // Common validation functions
  validation: {
    isValidEmail: (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    isValidPhoneNumber: (phone: string): boolean => {
      const phoneRegex = /^\+?[\d\s-()]+$/;
      return phoneRegex.test(phone) && phone.length >= 10;
    },

    isValidLanguageCode: (code: string): boolean => {
      const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
      return languageRegex.test(code);
    },

    isValidAge: (age: number): boolean => {
      return age >= 13 && age <= 120;
    },

    isValidCreditAmount: (amount: number): boolean => {
      return amount >= 0 && amount <= 1000000;
    }
  },

  // Common formatting functions
  formatting: {
    formatDisplayName: (name: string): string => {
      return name.trim().replace(/\s+/g, ' ');
    },

    formatPhoneNumber: (phone: string): string => {
      return phone.replace(/[^\d+]/g, '');
    },

    formatLanguageCode: (code: string): string => {
      return code.toLowerCase().replace('_', '-');
    },

    truncateText: (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + '...';
    }
  },

  // Common error handling
  errorHandling: {
    handleFirebaseError: (error: { code?: string }): { code: string; message: string } => {
      console.error('Firebase error:', error);

      const errorMap: { [key: string]: string } = {
        'permission-denied': 'You do not have permission to perform this action',
        'not-found': 'The requested document was not found',
        'already-exists': 'The document already exists',
        'invalid-argument': 'Invalid argument provided',
        'unavailable': 'The service is currently unavailable',
        'unauthenticated': 'Authentication required'
      };

      return {
        code: error.code || 'unknown',
        message: errorMap[error.code ?? 'unknown'] || 'An unexpected error occurred'
      };
    }
  },

  // Common query builders
  queryBuilders: {
    buildPaginationQuery: <T extends { [key: string]: unknown }>(
      lastDoc: T | null,
      limit: number,
      orderField: string = 'createdAt'
    ) => {
      return {
        limit,
        orderBy: orderField,
        startAfter: lastDoc
      };
    },

    buildDateRangeQuery: (startDate: Date, endDate: Date, field: string = 'createdAt') => {
      return {
        startDate,
        endDate,
        field
      };
    },

    buildSearchQuery: (searchTerm: string, field: string) => {
      return {
        field,
        startAt: searchTerm,
        endAt: searchTerm + '\uf8ff'
      };
    }
  },

  // Constants
  constants: {
    MAX_BATCH_SIZE: 500,
    MAX_QUERY_LIMIT: 1000,
    DEFAULT_PAGE_SIZE: 20,
    CACHE_TTL: 300000, // 5 minutes in milliseconds

    MOOD_TYPES: ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'confused', 'motivated', 'tired', 'stressed'],

    PERSONA_CATEGORIES: ['Friend', 'Therapist', 'Tutor', 'Coach', 'Mentor', 'Companion', 'Expert', 'Character', 'Assistant', 'Other'],

    MESSAGE_TYPES: ['text', 'audio', 'image', 'system', 'error'],

    USER_STATUSES: ['active', 'inactive', 'suspended', 'banned'],

    ADMIN_ROLES: ['super_admin', 'admin', 'moderator', 'content_manager', 'support'],

    ADMIN_PERMISSIONS: [
      'users.read',
      'users.write',
      'users.delete',
      'personas.read',
      'personas.write',
      'personas.delete',
      'personas.moderate',
      'messages.read',
      'messages.delete',
      'messages.moderate',
      'analytics.read',
      'system.maintain'
    ]
  }
};

// Type guards for better type safety
export const TypeGuards = {
  isUser: (obj: unknown): obj is User => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as User).id === 'string' &&
      typeof (obj as User).email === 'string'
    );
  },

  isPersona: (obj: unknown): obj is Persona => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as Persona).id === 'string' &&
      typeof (obj as Persona).name === 'string'
    );
  },

  isRoom: (obj: unknown): obj is Room => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as Room).id === 'string' &&
      typeof (obj as Room).userId === 'string'
    );
  },

  isMessage: (obj: unknown): obj is Message => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as Message).id === 'string' &&
      typeof (obj as Message).content === 'string'
    );
  },

  isMood: (obj: unknown): obj is Mood => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as Mood).id === 'string' &&
      typeof (obj as Mood).moodType === 'string'
    );
  },

  isMemory: (obj: unknown): obj is Memory => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as Memory).id === 'string' &&
      typeof (obj as Memory).key === 'string'
    );
  }
};

// Database performance monitoring
export const PerformanceMonitor = {
  // Track query performance
  trackQuery: async <T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();

    try {
      const result = await queryFunction();
      const endTime = performance.now();

      console.log(`Query ${queryName} took ${endTime - startTime} milliseconds`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`Query ${queryName} failed after ${endTime - startTime} milliseconds:`, error);
      throw error;
    }
  },

  // Simple performance metrics
  metrics: {
    slowQueries: [] as { name: string; duration: number; timestamp: Date }[],

    recordSlowQuery: (name: string, duration: number) => {
      if (duration > 1000) { // More than 1 second
        PerformanceMonitor.metrics.slowQueries.push({
          name,
          duration,
          timestamp: new Date()
        });

        // Keep only last 100 slow queries
        if (PerformanceMonitor.metrics.slowQueries.length > 100) {
          PerformanceMonitor.metrics.slowQueries.shift();
        }
      }
    },

    getSlowQueries: () => PerformanceMonitor.metrics.slowQueries,

    clearMetrics: () => {
      PerformanceMonitor.metrics.slowQueries = [];
    }
  }
};

// Configuration for different environments
export const DatabaseConfig = {
  development: {
    enableLogging: true,
    enableCaching: false,
    batchSize: 100,
    queryTimeout: 30000
  },

  production: {
    enableLogging: false,
    enableCaching: true,
    batchSize: 500,
    queryTimeout: 10000
  },

  getCurrentConfig: () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'production' ? DatabaseConfig.production : DatabaseConfig.development;
  }
};
