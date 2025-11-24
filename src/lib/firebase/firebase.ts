import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase only on client side
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  // Client-side initialization
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);

  try {
    db = getFirestore(app);
  } catch {
    db = initializeFirestore(app, {
      localCache:
        persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  }

  googleProvider = new GoogleAuthProvider();

  // Initialize Analytics (only in browser and if supported)
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("🔥 Firebase Analytics initialized");
    }
  });
}

export { app, auth, db, googleProvider, analytics };
export default app!;
