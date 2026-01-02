# Supported Languages in Yudi Chat Voice

## 🗣️ Currently Supported Languages

The Gemini Live API voice chat supports the following languages with native voice synthesis:

### 1. **Hindi (हिंदी)**
- **Language Code:** `hi-IN`
- **Voice Style:** Hinglish (Hindi + English mix)
- **Status:** ✅ Fully Supported (Default)
- **Usage:** Natural mix of Hindi and English words, Indian slang

### 2. **Tamil (தமிழ்)**
- **Language Code:** `ta-IN`
- **Voice Style:** Tanglish (Tamil + English mix)
- **Status:** ✅ Fully Supported
- **Usage:** Natural mix of Tamil and English words

### 3. **Telugu (తెలుగు)**
- **Language Code:** `te-IN`
- **Voice Style:** Tenglish (Telugu + English mix)
- **Status:** ✅ Fully Supported
- **Usage:** Natural mix of Telugu and English words

### 4. **English**
- **Language Code:** `en-IN`
- **Voice Style:** English with Indian slang
- **Status:** ✅ Fully Supported
- **Usage:** English with Indian expressions and casual slang

## 📍 Language Configuration

Languages are configured per persona in the database:
- Each persona has a `language` field
- The system automatically maps persona language to the correct ISO 639-1 code
- Language determines both:
  1. **Voice Synthesis Language** (what the AI speaks in)
  2. **System Instruction Style** (how the AI structures responses)

## 🔧 How It Works

1. **Persona Language Setting:**
   - Set in persona configuration (e.g., "Hindi", "Tamil", "Telugu", "English")
   - Stored in Firestore database

2. **Automatic Mapping:**
   - System converts language name to ISO code (e.g., "Hindi" → "hi-IN")
   - Used in Gemini Live API `speechConfig.languageCode`

3. **System Instruction Adaptation:**
   - Language style adapts based on selected language
   - Hindi → Hinglish style
   - Tamil → Tanglish style
   - Telugu → Tenglish style
   - English → English with Indian slang

## 🎯 Default Language

**Default:** Hindi (`hi-IN`)
- Used when no language is specified
- Most common use case for Indian users

## 🚀 Future Language Support

The Gemini Live API may support additional languages in the future. Check Google's documentation for updates:
- Current API supports limited languages for native audio synthesis
- Text chat supports many more languages via standard Gemini API
- Voice chat is limited to languages with native TTS support

## 📝 Notes

- **Language mixing is encouraged:** The system is designed for natural code-switching (e.g., Hinglish, Tanglish)
- **Voice selection:** Available voices work across all supported languages
- **Best experience:** Use the language that matches your primary communication style

