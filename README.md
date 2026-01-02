# Yudi Chat - AI Voice & Text Chat Application

A modern Next.js application featuring AI-powered voice and text chat with customizable personas.

## 🌟 Features

- **Voice Chat**: Real-time voice conversations with AI using Gemini 2.0 Flash Live API
  - Gender-based voice selection (Male, Female, Neutral)
  - Natural, conversational AI responses
  - Multiple voice options per gender
  
- **Text Chat**: Traditional text-based chat interface
  - Real-time messaging
  - Persona-based conversations
  
- **Custom Personas**: Create and customize AI personalities
  - AI-powered persona enhancement
  - Custom system prompts
  - Age, gender, and personality customization
  
- **Firebase Integration**:
  - Google OAuth authentication
  - Firestore database for messages and personas
  - Cloud Storage for avatars
  
- **Modern UI**:
  - Dark/Light theme support
  - Responsive design
  - Beautiful animations and transitions

## 🚀 Tech Stack

- **Framework**: Next.js 15.3.5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **AI**: Google Gemini API
- **Voice**: Gemini Live API

## 📋 Prerequisites

- Node.js 18+ 
- Firebase project
- Google Gemini API key

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd yudi-chat-master
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Google Authentication
3. Create Firestore database
4. Add authorized domains in Firebase Console

### Gemini API
1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env`

## 📦 Deployment

### Firebase App Hosting
```bash
npm run build
firebase deploy --only apphosting
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🎨 Features in Detail

### Voice Chat
- **Natural Conversations**: AI responds with human-like speech patterns
- **Multiple Voices**: Randomly selected from gender-appropriate voice pools
- **Real-time Audio**: Low-latency voice streaming

### Persona System
- Create custom AI personalities
- AI-enhanced persona generation
- Persistent persona storage
- Public/Private persona sharing

## 📝 License

MIT

## 👥 Contributors

Yudi Team

## 🙏 Acknowledgments

- Google Gemini API
- Firebase
- Next.js
- Radix UI
