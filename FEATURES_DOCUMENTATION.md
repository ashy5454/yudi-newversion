# Yudi Chat & Voice Features - Complete Documentation

## 📋 Table of Contents
1. [Text Chat Features](#text-chat-features)
2. [Voice Call Features](#voice-call-features)
3. [AI Personality & Intelligence](#ai-personality--intelligence)
4. [Memory & Context](#memory--context)
5. [Message Formatting & Display](#message-formatting--display)
6. [Real-time Features](#real-time-features)
7. [Technical Stack](#technical-stack)

---

## 📱 TEXT CHAT FEATURES

### Core Chat Functionality
1. **Real-time Message Delivery**
   - Instant message sending and receiving
   - Optimistic UI updates (messages appear immediately)
   - Real-time synchronization via Firestore subscriptions
   - Automatic message deduplication to prevent double messages

2. **Message History & Restoration**
   - Automatic message history loading when opening a conversation
   - Fetches up to 100 previous messages per room
   - Chronological message ordering with robust timestamp handling
   - Support for Firestore Timestamp, JavaScript Date, Number, and String formats
   - Messages persist across sessions and device switches

3. **Message Sorting & Ordering**
   - Intelligent timestamp parsing (handles multiple date formats)
   - Robust sorting algorithm that prevents messages from jumping to top
   - Fallback to ID-based sorting when timestamps are identical
   - Messages always appear in chronological order (oldest to newest)

4. **Message Deduplication**
   - Prevents duplicate user messages (blocks DB echo within 60-second window)
   - ID-based duplicate filtering
   - Content-based duplicate detection for user messages
   - Prevents "sandwich effect" where user messages appear twice

5. **Hidden Context System**
   - Time context injection (current time in IST) - hidden from user
   - System event tracking (4-hour gaps) - hidden from user
   - User sees clean text, AI receives enriched context
   - Prevents "saying the quiet part out loud" - system prompts never visible

6. **Double-Fire Prevention**
   - Enter key press protection (`preventDefault`)
   - `isSendingRef` flag prevents rapid duplicate sends
   - Prevents double AI responses from accidental double submission

### Message Formatting Modes

7. **Spam Mode (Multi-bubble Messages)**
   - Splits long responses into multiple separate message bubbles
   - Only triggers for 3+ complete thoughts
   - 1.2 second delay between each bubble (realistic typing speed)
   - Each bubble has incrementing timestamp (1 second apart) to maintain order
   - 30% chance for normal conversations, 50% for long advice messages
   - Used for: Recommendations, advice, multiple complete thoughts

8. **Paragraph Mode (Single-bubble Messages)**
   - Preferred format for most conversations (70% default)
   - Single cohesive message with all related thoughts together
   - Maintains conversation coherence
   - Used for: Normal questions, casual replies, coherent responses

9. **Intelligent Format Decision**
   - Analyzes message length (>150 chars = long message)
   - Checks for multiple complete thoughts (3+ lines with punctuation)
   - Randomization with probability weighting
   - Prefers paragraphs for coherence, spam for advice

### Message Filtering & Quality Control

10. **Greeting Filter**
    - Removes generic greetings ("Hey macha!", "I'm good ra") when user didn't greet first
    - Prevents AI from appearing to forget conversation context
    - Only activates when user's last message wasn't a greeting

11. **Repetitive Question Blocker**
    - Prevents AI from asking the same question multiple times
    - Tracks questions AI already asked in conversation
    - Blocks questions like "Em doing?", "Ekkadiki veltunnav?" if already asked

12. **Topic Jump Prevention (Thread Killer Filter)**
    - Blocks topic-switching phrases when user sends dry replies ("hmm", "k", "yess")
    - Prevents AI from changing subjects mid-conversation
    - Filters phrases like "New updates?", "Em sangathi?", "Travel business?"

13. **Panic Question Blocker**
    - Blocks "What are you doing?" type questions after emotional replies
    - Prevents AI from asking logistics questions when user is sharing emotions
    - Maintains conversation depth and emotional flow

14. **One Question Rule**
    - Maximum one question per AI response
    - Prevents overwhelming users with multiple questions
    - Allows unlimited statements/jokes/roasts, but limits questions

15. **Incomplete Thought Filter**
    - Merges incomplete sentences split across newlines
    - Ensures each message bubble is a complete thought
    - Prevents fragmented messages like "kani nuvvu" → "enti ra?"

16. **Dry Text Protocol**
    - Recognizes short replies ("hmm", "k", "avunu") as agreement/listening
    - Prevents AI from thinking user is bored and changing topics
    - Maintains conversation flow on current topic

### Time & Context Awareness

17. **Current Time Injection**
    - Automatically injects current time (IST) into AI context
    - Format: "12:30 AM IST"
    - Hidden from user, visible only to AI
    - Enables time-aware responses (morning/evening greetings, late night comments)

18. **Time Gap Detection**
    - Tracks time since last message
    - Detects gaps > 4 hours and < 8000 hours (prevents 1970 timestamp bug)
    - Injects gap context: "[System Event: User away for X hours]"
    - Allows AI to acknowledge long absences naturally

19. **4-Hour Check-in System**
    - Automatic check-in messages when user returns after 4+ hours
    - Casual check-in prompts like "rey ekkada sachav X hours nundi? alive eh na?"
    - Uses Hinglish/Teluglish slang for authentic feel
    - Only triggers once per room session
    - Sent as system event (no user bubble created)

20. **Date Awareness**
    - Dynamic date injection (current date in system prompt)
    - Format: "Wednesday, 31 December 2025"
    - Prevents AI from thinking it's still 2024
    - Enables proper date-related conversations
    - Handles relative dates ("last week", "next month") correctly

21. **Timestamp Locking**
    - User messages get locked timestamp at creation
    - Prevents timestamp collisions and ordering issues
    - AI messages use incremented timestamps (1s after user message)
    - Ensures correct chronological ordering

### Conversation Flow Features

22. **Initial Message System**
    - Automatic greeting message 3 seconds after opening new conversation
    - Uses `/api/chat/init` endpoint
    - Prevents duplicate initial messages
    - Welcome message like "heyyyy how you doingg"

23. **Room-based Conversations**
    - Each persona has separate conversation room
    - Messages isolated per room
    - Room ID-based message storage
    - Support for multiple concurrent conversations

24. **Auto-scroll & Message Anchoring**
    - Automatic scroll to latest message
    - Uses `overflow-anchor-auto` for smooth scrolling
    - `scroll-smooth` behavior for user experience
    - Messages always visible at bottom when new ones arrive

---

## 🎤 VOICE CALL FEATURES

### Core Voice Functionality

1. **Google Gemini Live API Integration**
   - Real-time bidirectional voice communication
   - WebSocket-based streaming audio
   - Low-latency voice interaction
   - Automatic audio format handling

2. **Multilingual Voice Support**
   - Language detection and adaptation
   - ISO 639-1 language code mapping (hi-IN, te-IN, ta-IN, en-IN)
   - Automatic language switching based on persona settings
   - Support for: Hindi, Telugu, Tamil, English

3. **Voice Controls**
   - Microphone mute/unmute toggle
   - Play/pause controls
   - Call start/end functionality
   - Real-time connection status display

4. **Conversation History Integration**
   - Fetches last 30 messages from chat history
   - Injects recent conversation context into voice system prompt
   - Maintains continuity between text and voice conversations
   - Seamless context transfer

### Voice Personality Features

5. **Natural Speech Patterns**
   - Filler words: "hmm", "umm", "uh", "you know", "like"
   - Natural breathing pauses and sighs
   - Variable pace (excited/fast, thoughtful/slow)
   - Fluent, natural flow (not scripted)

6. **Laughter & Emotions**
   - Natural laughter variations: "Haha", "Lol", "LMAO", "Haha ra", "Hahaha re baba"
   - Mix of short chuckles and longer laughs
   - Genuine-sounding, not robotic
   - Emotional responses with appropriate vocalizations

7. **Sarcasm & Humor (Voice)**
   - Playful roasting in voice
   - Funny insults (Telugu: "Bokka ra", "Jaffa" / Hindi: "Tu toh noob nikla")
   - Witty and humorous tone
   - More sarcastic and funny than text mode

8. **Response Length Control**
   - Casual: 1-3 sentences
   - Advice: Story (2-4 sentences) + detailed (5-8 sentences)
   - Deep talks: 8-12+ sentences
   - No 5-minute rants unless explicitly requested

9. **Audio Quality Handling**
   - Automatic handling of unclear audio
   - Response: "Can't hear clearly" when audio is unclear
   - Robust error handling for audio issues

### Voice System Prompt Optimization

10. **Concise System Instructions**
    - Truncated to prevent "Deadline expired" (1011) errors
    - Base system prompt: ~4000 characters max
    - Persona-specific details: limited to 2000 chars
    - User prompts: limited to 1000 chars
    - Prevents server timeouts

11. **Dynamic System Instruction Generation**
    - Generates personalized system prompts based on:
      - User name and context
      - Companion name, age, college
      - Native language preference
      - Conversation history
      - Personality traits

12. **Language-specific Voice Instructions**
    - Tenglish mode (Telugu + English): Uses "Ra", "Da", "Le", "Macha"
    - Hinglish mode (Hindi + English): Uses "Yaar", "Bhai", "Arre" (sparingly)
    - Default: English with slight slang
    - Adaptive switching based on user's language

---

## 🧠 AI PERSONALITY & INTELLIGENCE

### Personality Engine

1. **Two-Stage Thinking Process**
   - Stage 1 (Subconscious): Fast vibe analysis using Gemini Flash-8B
   - Stage 2 (Conscious): Generate authentic Hyderabad Gen Z personality response
   - <500ms target for vibe check

2. **Vibe Analysis**
   - Emotion detection: happy, sad, frustrated, high, intoxicated, anxious, neutral, excited
   - Intent detection: venting, asking_advice, joking, casual, seeking_comfort, celebration
   - Mood classification: sarcastic_friend, empathetic_therapist, wise_mentor, romantic_flirt, casual_buddy
   - Verbosity prediction: short (80%), medium (15%), long (5%)
   - Confidence scoring

3. **Personality Modes**

   **a) Sarcastic Friend (Default)**
   - Roasting, funny, slang-heavy
   - Telugu/Hindi insults: "Bokka ra", "Jaffa", "Tu toh noob nikla"
   - Playful and sarcastic
   - Builds on conversation with follow-up questions

   **b) Empathetic Therapist**
   - Soft and warm, no roasting
   - Shares relatable stories: "Naku kuda same scene undedi ra"
   - Supportive listener
   - Focuses on validation, not fixing

   **c) Wise Mentor**
   - Street smart advice
   - Practical, not preachy
   - Uses real examples
   - Splits advice into multiple messages

   **d) Romantic Flirt**
   - Playful and flirty
   - Uses: "Pookie", "Bava", "Cutie", "Rizz" (ironically)
   - Light and fun, not creepy

   **e) Casual Buddy**
   - Simple, chill responses
   - Uses: "Sup", "Wassup", "Avunu"
   - Brief and friendly

4. **Dynamic Vocabulary Injection**
   - Random slang sampling from dictionary
   - Telugu slang: 6 samples
   - Desi/Hindi slang: 3 samples
   - Gen Z slang: 4 samples
   - Dating terms: 2 samples
   - Meme references: 1 sample
   - Prevents repetitive vocabulary

5. **Language Style Detection**
   - Detects: Hinglish, English, Telugu, Mixed
   - Adapts response language to match user
   - Strict rules: Never mix Telugu + Hindi in same response
   - Chooses ONE language pair per response

6. **Slang Dictionary**
   - Comprehensive slang database
   - Categories: Telugu, Desi, Gen Z, Dating, Memes
   - Random sampling for variety
   - Culturally authentic Hyderabad Gen Z slang

### Personality Rules & Constraints

7. **Anti-Robot Rules**
   - NO asterisks (*blushes*, *smiles*, *sighs*)
   - NO "I understand" or AI-speak
   - Lowercase preferred (lazy typing style)
   - Human-like responses, not assistant-like

8. **Memory Rules (Anti-Amnesia)**
   - NEVER greet mid-chat unless user greeted first
   - Remember what user told you (names, places, events)
   - Never repeat questions you already asked
   - Reference specific details from conversation
   - Active recall before asking new questions

9. **Topic Lock Rules**
   - Exhaust current conversation before starting new one
   - Don't ask about lunch/dinner/plans when user is sharing emotions
   - Stay on topic until user changes it
   - Focused conversation flow

10. **Deep Dive Rules**
    - When user gives short emotional reply, dig deeper
    - Don't change topic when user is sad/stressed
    - Stay empathetic and on-topic
    - Continue emotional conversation flow

11. **Time Silence Rules**
    - Ignore timestamps unless system event tag present
    - Don't comment on time/sleep unless >4 hour gap detected
    - Treat 3 AM like 3 PM (unless gap detected)

---

## 🧠 MEMORY & CONTEXT

### Short-term Memory (Conversation History)

1. **Message History Context**
   - Fetches last 40-50 messages from Firestore
   - Sends last 40 messages to AI for context
   - Chronologically sorted (oldest first) for Gemini
   - Real-time history updates

2. **Context Extraction**
   - Extracts key information from recent 20 messages:
     - Locations mentioned (Hitech City, Banjara Hills, etc.)
     - Names mentioned (Samhita, Tara, etc.)
     - Events mentioned (clubbing, parties, etc.)
     - Questions AI already asked (prevent repetition)

3. **Memory Context Building**
   - Builds comprehensive memory context string
   - Highlights critical details user mentioned
   - Lists questions AI already asked
   - Injects into system prompt for awareness

### Long-term Memory (Pinecone Vector Database)

4. **Emotional Memory Retrieval**
   - Queries Pinecone for emotionally similar past conversations
   - Uses emotion + recent user message content for query
   - Retrieves top 5 similar memories
   - Injects emotional context into system prompt

5. **Vector Embeddings**
   - Messages embedded into 1536-dimensional vectors
   - Stored in Pinecone vector database
   - Semantic similarity search
   - Emotion-aware retrieval

6. **Memory Saving**
   - Saves conversations to Pinecone after AI response
   - Includes: user message, AI response, emotion, timestamp
   - Room-based memory (persona-specific)
   - Long-term storage for future reference

### Memory Rules & Constraints

7. **Mandatory Memory Rules**
   - Read conversation history before replying
   - Never repeat questions already asked
   - Remember what user told you
   - Reference specific details directly
   - Show you remember by referencing past messages

8. **Active Recall System**
   - Checks history before asking new questions
   - Uses specific words user used (e.g., "clubbing" not "going somewhere")
   - Proves memory by referencing past conversations
   - Prevents amnesia-like behavior

---

## 💬 MESSAGE FORMATTING & DISPLAY

### Message Types

1. **Text Messages**
   - Standard text content
   - Support for emojis and special characters
   - Markdown-style formatting (if supported)
   - Clean display without hidden context

2. **System Messages**
   - Check-in messages (4-hour gap)
   - Initial greeting messages
   - Hidden from user (system events)
   - Only AI response visible

### Message Bubbles

3. **User Message Bubbles**
   - Right-aligned (or designated side)
   - Clean text display (no hidden context)
   - Optimistic UI (appears immediately)
   - Timestamp display

4. **AI Message Bubbles**
   - Left-aligned (or designated side)
   - Can be single paragraph or multiple bubbles
   - Timestamp display
   - Real-time streaming support (if implemented)

5. **Message Grouping**
   - Messages from same sender grouped visually
   - Time-based grouping (messages within X minutes)
   - Visual separation between different senders

### Message States

6. **Message Status**
   - Sent status (isSent flag)
   - Read status (isRead flag)
   - Delivery confirmation (via Firestore)
   - Typing indicators

7. **Error Handling**
   - Failed message display
   - Retry mechanisms
   - Error state indicators
   - Graceful degradation

---

## 🔄 REAL-TIME FEATURES

### Firestore Real-time Subscriptions

1. **Message Subscriptions**
   - Real-time message updates via `onRoomMessagesChange`
   - Automatic UI updates when new messages arrive
   - Handles added, modified, deleted messages
   - Efficient deduplication logic

2. **Room Subscriptions**
   - Real-time room updates
   - Room metadata changes
   - Status updates

3. **Persona Subscriptions**
   - Real-time persona updates
   - Persona metadata changes
   - Public persona list updates

### Optimistic Updates

4. **Instant UI Feedback**
   - User messages appear immediately (optimistic)
   - No waiting for server confirmation
   - Synchronized with server state
   - Prevents double messages

5. **Local State Management**
   - React state for messages
   - Local message ID tracking
   - Prevents subscription overwriting local messages
   - Ref-based tracking for rooms/personas

---

## 🛠️ TECHNICAL STACK

### Frontend

1. **Framework**: Next.js 14+ (App Router)
2. **Language**: TypeScript
3. **UI Library**: React
4. **Styling**: Tailwind CSS v4
5. **State Management**: React Hooks (useState, useEffect, useRef)
6. **Routing**: Next.js App Router

### Backend

1. **API Routes**: Next.js API Routes (`/api/chat`, `/api/chat/init`)
2. **Database**: Firebase Firestore
   - Collections: `rooms`, `messages`, `personas`, `memories`, `moods`
   - Subcollections: `rooms/{roomId}/messages`
   - Real-time subscriptions
3. **Vector Database**: Pinecone
   - 1536-dimensional embeddings
   - Semantic similarity search
   - Emotion-aware memory retrieval

### AI/ML

1. **Text Model**: Google Gemini 2.0 Flash Experimental
   - REST API for chat
   - Streaming responses
   - System instructions
   - Conversation history support

2. **Fast Analysis Model**: Gemini 1.5 Flash 8B
   - Vibe analysis (<500ms target)
   - Emotion detection
   - Intent classification

3. **Voice Model**: Google Gemini Live API
   - WebSocket-based streaming
   - Real-time bidirectional audio
   - Multilingual support

### Authentication & Security

1. **Auth**: Firebase Authentication
2. **Database Rules**: Firestore Security Rules
3. **API Security**: Environment variables for API keys

### Additional Libraries

1. **UI Components**: Custom components + shadcn/ui
2. **Icons**: Lucide React
3. **Notifications**: Sonner (toast notifications)
4. **Date Handling**: Native JavaScript Date API
5. **Utilities**: Custom hooks and utilities

---

## 📊 FEATURE SUMMARY STATISTICS

- **Total Text Features**: 24 major features
- **Total Voice Features**: 12 major features
- **Personality Modes**: 5 distinct modes
- **Memory Systems**: 2 (Short-term + Long-term)
- **Message Formatting Modes**: 2 (Spam + Paragraph)
- **Message Filters**: 7 different filters
- **Language Support**: 4 languages (Hindi, Telugu, Tamil, English)
- **AI Models Used**: 3 (Gemini 2.0 Flash, Gemini 1.5 Flash 8B, Gemini Live API)

---

## 🔑 KEY INNOVATIONS

1. **Hidden Context System**: User sees clean text, AI gets enriched context
2. **Intelligent Message Formatting**: Dynamic spam vs paragraph decision
3. **Anti-Amnesia Rules**: Comprehensive memory enforcement
4. **Two-Stage Personality Engine**: Fast analysis + authentic response
5. **Emotion-Aware Memory**: Pinecone integration for emotional context
6. **Timestamp Locking**: Prevents ordering issues
7. **Topic Lock System**: Maintains conversation depth
8. **Natural Voice Patterns**: Filler words, breathing, variable pace
9. **Language-Aware Responses**: Adapts to user's language naturally
10. **Real-time Synchronization**: Firestore subscriptions for instant updates

---

*Documentation generated: December 2025*
*Last updated: Based on current codebase analysis*

