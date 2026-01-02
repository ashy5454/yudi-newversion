# 🚀 QUICK START GUIDE - YUDI CHAT

## ✅ Everything is Set! Here's How to Run:

---

## 📋 STEP 1: Check Environment Variables

Make sure your `.env` file exists in the project root with these variables:

### **Required for Voice (Gemini Live API)**
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### **Required for Text Chat & Firebase**
```env
# Firebase Config (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API (for text chat backend)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Backend URL (only if using text chat)
BACKEND_URL=http://localhost:5002
```

---

## 📦 STEP 2: Install Dependencies

```bash
# Install frontend dependencies
npm install
```

**Note**: Backend is **NOT required** for voice chat anymore! Voice uses pure Gemini Live API (frontend-only).

---

## 🎤 STEP 3: Run the App

### **For Voice Chat (Gemini Live API - NO BACKEND NEEDED)**
```bash
npm run dev
```

That's it! Voice chat works with just the frontend.

### **For Text Chat (Optional - Requires Backend)**
If you want text chat, you also need the Flask backend:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (for text chat)
cd backend
source venv/bin/activate  # Activate virtual environment
python main.py            # Runs on port 5002
```

---

## 🌐 STEP 4: Open in Browser

Go to: **http://localhost:3000**

---

## 🎯 What Works:

### ✅ **Voice Chat** (Works WITHOUT backend)
- Navigate to: `/m/[roomId]/call`
- Click "Connect"
- Start speaking!
- **Uses**: Gemini Live API (pure frontend WebSocket)

### ✅ **Text Chat** (Requires backend)
- Navigate to: `/m/[roomId]/chat`
- Type messages
- **Uses**: Next.js API route → Gemini API → Backend (optional)

---

## 🔍 Quick Check:

### Test Voice Chat:
1. Start frontend: `npm run dev`
2. Login with Google
3. Create/select a persona
4. Go to voice call page
5. Click "Connect"
6. Speak!

**If voice works**: ✅ Everything is set correctly!

### Test Text Chat:
1. Start frontend: `npm run dev`
2. Start backend: `cd backend && python main.py` (optional)
3. Go to chat page
4. Type a message

---

## ⚠️ Troubleshooting

### Voice Chat Not Working?
1. ✅ Check `NEXT_PUBLIC_GEMINI_API_KEY` is set in `.env`
2. ✅ Restart dev server after adding env vars
3. ✅ Check browser console for errors
4. ✅ Ensure microphone permission is granted

### Text Chat Not Working?
1. ✅ Check `GEMINI_API_KEY` is set in `.env`
2. ✅ Start backend server (optional, but recommended)
3. ✅ Check Firebase config is correct

---

## 📝 Summary

**Voice Chat**: 
- ✅ Frontend only (`npm run dev`)
- ✅ Uses Gemini Live API
- ✅ No backend needed

**Text Chat**: 
- ✅ Frontend (`npm run dev`)
- ✅ Optional: Backend (`python main.py`)

---

**You're all set! Just run `npm run dev` and start chatting! 🚀**

