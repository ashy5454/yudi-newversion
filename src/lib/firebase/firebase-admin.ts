import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import type { App } from 'firebase-admin/app';

let adminApp: App;

// 1. Force formatting for the Private Key
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey) {
  // Aggressive normalization: handles quotes, double-slashes, and literal newlines
  privateKey = privateKey
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\\n/g, '\n')       // Convert literal \n to actual newlines
    .replace(/\n/g, '\n');       // Ensure newlines are correctly parsed
}

// 2. Initialize App
if (!admin.apps.length) {
  try {
    if (projectId && clientEmail && privateKey) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('🚀 Firebase Admin initialized successfully via ENV variables');
    } else {
      console.warn('⚠️ Firebase ENV variables missing. Falling back to default.');
      adminApp = admin.initializeApp();
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    // Don't throw a hard error here so the dev server can still start
  }
} else {
  adminApp = admin.app();
}

// 3. EXPORTS (Must include isFirebaseEnabled for your route.ts)
export const adminDb = getFirestore(adminApp);
export const isFirebaseEnabled = !!admin.apps.length; // This fixes the import error
export { adminApp };

export const verifyIdToken = async (token: string) => {
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};