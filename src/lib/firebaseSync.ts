import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { 
  Employee, 
  AppSettings, 
  InstitutionalIdentity, 
  CriticalNotification, 
  PerformanceAgreement, 
  CooperationContract, 
  ReporterTarget, 
  NewsReport 
} from '../types';

// Helper to identify if the app is currently running in a development/preview environment
export function isDevelopmentEnvironment(): boolean {
  // Always use the real Firestore database
  return false;
}

// Generic fetch array collection
export async function fetchCollection<T extends { id: string }>(collectionName: string, fallbackData: T[]): Promise<T[]> {
  const isDev = isDevelopmentEnvironment();

  // In development, check the local sandbox first to avoid modifying production data
  if (isDev) {
    const local = localStorage.getItem(`dev_firestore_col_${collectionName}`);
    if (local !== null) {
      try {
        return JSON.parse(local) as T[];
      } catch (e) {
        console.error("Error parsing local dev collection:", e);
      }
    }
    // If local sandbox is empty, seed it with fallbackData and return it immediately
    localStorage.setItem(`dev_firestore_col_${collectionName}`, JSON.stringify(fallbackData));
    return fallbackData;
  }

  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      if (fallbackData && fallbackData.length > 0 && !isDev) {
        // Seed fallback data to Firestore ONLY in production/published mode
        const batch = writeBatch(db);
        fallbackData.forEach((item) => {
          const docRef = doc(db, collectionName, item.id);
          batch.set(docRef, item);
        });
        await batch.commit();
      }
      return fallbackData;
    }
    const data: T[] = [];
    snapshot.forEach((doc) => {
      data.push(doc.data() as T);
    });
    return data;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return fallbackData;
  }
}

// Fetch single document (like settings/identity)
export async function fetchDocument<T>(collectionName: string, docId: string, fallbackData: T): Promise<T> {
  const isDev = isDevelopmentEnvironment();

  // In development, check the local sandbox first
  if (isDev) {
    const local = localStorage.getItem(`dev_firestore_doc_${collectionName}_${docId}`);
    if (local !== null) {
      try {
        return JSON.parse(local) as T;
      } catch (e) {
        console.error("Error parsing local dev document:", e);
      }
    }
    // If local sandbox is empty, seed it with fallbackData and return it immediately
    localStorage.setItem(`dev_firestore_doc_${collectionName}_${docId}`, JSON.stringify(fallbackData));
    return fallbackData;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as T;
    } else {
      // Seed fallback data ONLY if in production/published mode
      if (!isDev) {
        await setDoc(docRef, fallbackData as any);
      }
      return fallbackData;
    }
  } catch (error) {
    console.error(`Error fetching document ${collectionName}/${docId}:`, error);
    return fallbackData;
  }
}

// Save document helper
export async function saveDocument(collectionName: string, docId: string, data: any): Promise<void> {
  const isDev = isDevelopmentEnvironment();

  if (isDev) {
    console.warn(`[Dev Sandbox] Database write bypassed. Saving document to localStorage: ${collectionName}/${docId}`);
    localStorage.setItem(`dev_firestore_doc_${collectionName}_${docId}`, JSON.stringify(data));
    return;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Error saving document ${collectionName}/${docId}:`, error);
  }
}

// Save list (bulk write) helper with automatic deletion of removed items
export async function saveCollectionList<T extends { id: string }>(collectionName: string, list: T[]): Promise<void> {
  const isDev = isDevelopmentEnvironment();

  if (isDev) {
    console.warn(`[Dev Sandbox] Database write bypassed. Saving collection to localStorage: ${collectionName} (${list.length} items)`);
    localStorage.setItem(`dev_firestore_col_${collectionName}`, JSON.stringify(list));
    return;
  }

  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const existingIds = snapshot.docs.map(doc => doc.id);
    const listIds = new Set(list.map(item => item.id));

    const batch = writeBatch(db);
    let hasOps = false;
    
    // Delete documents that are no longer in the list
    existingIds.forEach((id) => {
      if (!listIds.has(id)) {
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
        hasOps = true;
      }
    });

    // Write/Update current items
    list.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item);
      hasOps = true;
    });

    if (hasOps) {
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error saving collection list ${collectionName}:`, error);
  }
}

// System initialization status helpers to prevent re-seeding dummy data when collections are emptied
export async function isSystemSeeded(): Promise<boolean> {
  const isDev = isDevelopmentEnvironment();
  if (isDev) {
    const val = localStorage.getItem('dev_firestore_system_seeded');
    return val === 'true';
  }

  try {
    const docSnap = await getDoc(doc(db, 'system', 'init'));
    return docSnap.exists() && docSnap.data().seeded === true;
  } catch (error) {
    console.error("Error checking system init status:", error);
    return false;
  }
}

export async function markSystemSeeded(): Promise<void> {
  const isDev = isDevelopmentEnvironment();
  if (isDev) {
    localStorage.setItem('dev_firestore_system_seeded', 'true');
    return;
  }

  try {
    await setDoc(doc(db, 'system', 'init'), { seeded: true });
  } catch (error) {
    console.error("Error marking system as seeded:", error);
  }
}

// Delete document helper
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  const isDev = isDevelopmentEnvironment();

  if (isDev) {
    console.warn(`[Dev Sandbox] Database delete bypassed. Removing document from localStorage: ${collectionName}/${docId}`);
    localStorage.removeItem(`dev_firestore_doc_${collectionName}_${docId}`);
    
    // Sync the local storage collection list representation if present
    const localCol = localStorage.getItem(`dev_firestore_col_${collectionName}`);
    if (localCol !== null) {
      try {
        const list = JSON.parse(localCol) as { id: string }[];
        const filtered = list.filter(item => item.id !== docId);
        localStorage.setItem(`dev_firestore_col_${collectionName}`, JSON.stringify(filtered));
      } catch (e) {
        console.error("Error updating collection on delete:", e);
      }
    }
    return;
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${collectionName}/${docId}:`, error);
  }
}
