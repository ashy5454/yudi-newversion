// Types for GenAI Live API
export interface LiveAPIConfig {
  responseModalities: string[];
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: string };
    };
  };
  systemInstruction: {
    parts: Array<{
      text: string;
    }>;
  };
}

// Types for audio processing
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

// Types for connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Types for API responses
export interface APIResponse<T = unknown> {
  message?: string;
  error?: string;
  data?: T;
  status?: number;
}

// Types for user settings
export interface UserSettings {
  voice: string;
  language: string;
  volume: number;
}

// Types for agent configuration
export interface AgentConfig {
  name: string;
  voice: string;
  personality: string;
  systemPrompt: string;
}

// Types for UI state
export interface UIState {
  showUserConfig: boolean;
  showAgentEdit: boolean;
  isConnecting: boolean;
  isConnected: boolean;
}

// Types for audio events
export interface AudioEvent {
  type: 'start' | 'stop' | 'volume' | 'error';
  data?: unknown;
  timestamp: number;
}

// Types for WebSocket events
export interface WebSocketEvent {
  type: 'open' | 'close' | 'error' | 'message';
  data?: unknown;
  code?: number;
  reason?: string;
}

// Firebase Auth Types
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// Auth Context Types
export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Common types
export type Timestamp = string; // ISO 8601 string or Date, adjust as needed
export type Vector = number[];