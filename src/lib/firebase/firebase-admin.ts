import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import type { App } from 'firebase-admin/app'
import path from 'path'

let adminApp: App

if (!admin.apps.length) {
  // In Firebase App Hosting, credentials are automatically provided
  // Only use service account file in local development
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    // App Hosting provides credentials automatically
    adminApp = admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  } else {
    // Use service account file for local development
    const serviceAccountPath = path.join(process.cwd(), 'credentials', 'firebase-admin-service-account.json')
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  }
} else {
  adminApp = admin.app()
}

const adminDb = getFirestore()

export const verifyIdToken = async (token: string) => {
  try {
    return await admin.auth().verifyIdToken(token)
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export { adminApp, adminDb }
