export interface User {
    id: string; // Firebase UID
    displayName: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
    isPhoneVerified?: boolean;
    age?: number;
    gender?: string;
    language?: string;
    languagePreference?: string; // ISO code, e.g., "en-IN", "es-ES"
    genderPreference?: string; // "male", "female", "non-binary", "any"
    agePreference?: number; // Preferred age for interactions
    credit?: Credit;
    status?: string;
    lastSeen?: Date;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Credit {
    amount: number;
    type?: string; // e.g., "purchase", "bonus", "spent"
    totalCredits: number; // Current total credits
    totalSpent: number;
    totalEarned: number;
    description?: string;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt?: Date;
}

export interface AiModel {
    name: string;
    description?: string;
    systemPrompt: string;
    voiceModel: string;
    voiceName: string;
    gender: "male" | "female" | "neutral";
    textCostInCredits: number;
    voiceCostInCredits: number;
    languageCode?: string; // ISO 639-1 code, e.g., "en-IN", "es-ES"
    textModel: string;
    toolModel: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Persona {
    id: string; // Firebase UID
    creatorId: string;
    name: string;
    userPrompt?: string;
    gender?: string;
    language?: string; // ISO 639-1 code, e.g., "en-IN", "es-ES"
    age?: number;
    isPublic: boolean;
    description?: string;
    avatarUrl?: string;
    personality?: string;
    bodyColor: string;
    model: AiModel;
    isActive: boolean;
    category?: string; // e.g., "Therapist", "Friend", "Tutor"
    tags?: string[]; // e.g., ["friendly", "wise", "funny"]
    usageCount: number;
    rating?: number; // Average rating from users
    createdAt: Date;
    updatedAt?: Date;
}

export interface Room {
    id: string; // Firebase UID
    userId: string;
    avatarUrl?: string;
    bodyColor?: string;
    personaId: string;
    createdAt: Date;
    title?: string; // Auto-generated or user-defined title for the chat
    lastMessageAt?: Date;
    lastMessageContent?: string; // Snippet of the last message
    messageCount?: number;
    totalDuration?: number;
    isArchived?: boolean;
    updatedAt?: Date;
}

export interface Message {
    id: string; // Firebase UID
    roomId: string;
    personaId?: string; // Denormalized for easier access
    senderType: string; // "user" or "persona"
    content: string;
    createdAt: Date;
    updatedAt?: Date;
    isRead?: boolean;
    isDelivered?: boolean;
    isSent?: boolean;
    isReceived?: boolean;
    isEdited?: boolean;
    isDeleted?: boolean;
    isSystemMessage?: boolean; // For messages like "Persona joined"
    isError?: boolean;
    errorMessage?: string;
    messageType?: string; // e.g., "text", "audio", "image", "voice_transcript"
    type?: string; // Alternative type field (e.g., "voice") for compatibility with admin dashboard filtering
    metadata?: string; // JSON string for additional data (e.g., audio duration, image URL)
    status?: string; // e.g., "sent", "failed", "processing"
    embedding?: FirebaseFirestore.VectorValue; // Vector with size 1536
}

export interface Mood {
    id: string; // Firebase UID
    userId: string;
    moodType: string;
    intensity?: number;
    triggerThought?: string; // What led to this mood?
    notes?: string;
    moodDurationInMinutes?: number;
    createdAt: Date;
    updatedAt?: Date;
    embedding?: FirebaseFirestore.VectorValue; // Vector with size 1536
}

export interface Memory {
    id: string; // Firebase UID
    userId: string;
    key: string;
    value: string; // The actual memory content
    source?: string; // Where did this memory come from? (e.g., "chat", "user_input", "system")
    createdAt: Date;
    updatedAt?: Date;
    embedding?: FirebaseFirestore.VectorValue; // Vector with size 1536
}

export interface ResponseData {
    id: string; // Firebase UID
    ageMin?: number;
    ageMax?: number; // Age range for which this response is suitable
    gender?: string;
    languageCode?: string; // ISO 639-1 code, e.g., "en-IN", "es-ES"
    personaPersonalityMatch?: string;
    responseStyleName: string;
    sampleResponse: string;
    guidelines?: string; // Instructions for generating similar responses
    createdAt: Date;
    updatedAt?: Date;
    embedding?: FirebaseFirestore.VectorValue; // Vector with size 1536
}

export interface Admin {
    id: string; // Firebase UID
    userId: string;
    role: string; // e.g., "super_admin", "content_manager", "support"
    permissions: string[]; // List of specific permissions
    createdAt: Date;
    updatedAt?: Date;
}

export interface Analytic {
    id: string; // Firebase UID
    userCount: number;
    currentActiveUserCount: number;
    personaCount: number;
    roomCount: number;
    messageCount: number;
    moodCount: number;
    memoryCount: number;
    creditCount: number;
    creditBoughtCount: number;
    creditSpentCount: number;
    responseDataCount: number;
    totalMessageCount: number;
    totalRoomCount: number;
    totalPersonaCount: number;
    totalMoodCount: number;
    totalMemoryCount: number;
    totalCreditCount: number;
    totalCreditBoughtCount: number;
    totalCreditSpentCount: number;
    totalResponseDataCount: number;
    createdAt: Date;
    updatedAt: Date;
}
