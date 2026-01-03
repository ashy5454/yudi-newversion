'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Config: env 
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyCJL0zm1lrejfzLQpZNiWExtjo_vT_l1zQ',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'yudi-8bd6f.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'yudi-8bd6f',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'yudi-8bd6f.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '882569998626',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:882569998626:web:4669942f4304a1f2fb757b',
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    'G-53L2NNJH0W', // <--- Update this value
};

if (!firebaseConfig.apiKey) {
  throw new Error(
    'Firebase API key missing. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env'
  );
}

// Single app instance
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

//  Auth + Google Provider
const auth: Auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firestore (with persistence fallback)
let db: Firestore;
try {
  db = getFirestore(app);
} catch {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
}

// Analytics (optional)
let analytics: Analytics | null = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log('🔥 Firebase Analytics initialized');
  }
});

export { app, auth, db, googleProvider, analytics };
