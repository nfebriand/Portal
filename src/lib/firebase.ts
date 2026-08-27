import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely (avoid duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Validate connection to Firestore backend.
 * Gracefully handles offline fallback mode when connection is establishing.
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable') || (error as any).code === 'unavailable')) {
      console.warn("Firestore operates in offline/local-cache mode until connection is established.");
    }
  }
}

testConnection();


