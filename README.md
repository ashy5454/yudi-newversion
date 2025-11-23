# Yudi Chat

A Next.js application with Firebase Google OAuth authentication and AI chat capabilities.

## Features

- 🔐 Firebase Google OAuth Authentication
- 🛡️ Protected Routes
- 🎨 Modern UI with Tailwind CSS
- 🎤 Real-time Audio Chat Interface
- 🤖 AI Persona Management
- 📱 Responsive Design

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project
- Google Cloud account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd yudi-chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication with Google provider
   - Get your Firebase configuration

4. Create environment variables:
   Create a `.env.local` file in the project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for server-side operations)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key_here
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

### 1. Enable Authentication
- Go to Firebase Console > Authentication > Sign-in method
- Enable Google provider
- Add your authorized domains (localhost:3000 for development)

### 2. Get Firebase Config
- Go to Project Settings > General
- Scroll down to "Your apps"
- Click on the web app or create a new one
- Copy the configuration object

### 3. Set up Firebase Admin
- Go to Project Settings > Service Accounts
- Click "Generate new private key"
- Download the JSON file
- Use the values for admin environment variables

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (main)/            # Main app routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── AuthContext.tsx    # Authentication context
│   ├── LoginButton.tsx    # Login/logout component
│   ├── ProtectedRoute.tsx # Route protection
│   └── ui/               # UI components
├── lib/                   # Utilities and configurations
│   ├── firebase.ts       # Firebase client config
│   ├── firebase-admin.ts # Firebase admin config
│   ├── auth-utils.ts     # Auth utilities
│   └── types.ts          # TypeScript types
└── hooks/                # Custom React hooks
    └── useAuthToken.ts   # Auth token hook
```

## Authentication Flow

1. **Client-side**: Users sign in with Google OAuth
2. **Context**: Authentication state is managed globally
3. **Protected Routes**: Unauthenticated users are redirected
4. **API Calls**: Server-side token verification
5. **Database**: Firebase Admin for secure operations

## Database Schema

The application uses the following data models:

- **User**: User profiles and preferences
- **Persona**: AI chat personas
- **Room**: Chat rooms between users and personas
- **Message**: Chat messages
- **Call**: Voice call records
- **UserCredit**: Credit system
- **Analytic**: Usage analytics
- **Admin**: Admin roles
- **Mood**: User mood tracking
- **Memory**: User memory storage
- **ResponseData**: Response guidelines

## API Routes

- `GET /api/user` - Get current user data
- `POST /api/user` - Create/update user profile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
