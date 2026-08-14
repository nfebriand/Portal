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
  const cacheKey = `swara_cache_col_${collectionName}`;

  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // Check local cache first
      const cached = localStorage.getItem(cacheKey);
      if (cached !== null) {
        try {
          return JSON.parse(cached) as T[];
        } catch (e) {}
      }
      return fallbackData;
    }
    const data: T[] = [];
    snapshot.forEach((doc) => {
      data.push(doc.data() as T);
    });
    // Cache for offline use
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (error: any) {
    console.warn(`Fetch notice for ${collectionName} (using offline cache):`, error?.message || error);
    const cached = localStorage.getItem(cacheKey);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T[];
      } catch (e) {}
    }
    return fallbackData;
  }
}

// Fetch single document (like settings/identity)
export async function fetchDocument<T>(collectionName: string, docId: string, fallbackData: T): Promise<T> {
  const cacheKey = `swara_cache_doc_${collectionName}_${docId}`;

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as T;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    } else {
      const cached = localStorage.getItem(cacheKey);
      if (cached !== null) {
        try {
          return JSON.parse(cached) as T;
        } catch (e) {}
      }
      return fallbackData;
    }
  } catch (error: any) {
    console.warn(`Fetch notice for ${collectionName}/${docId} (using offline cache):`, error?.message || error);
    const cached = localStorage.getItem(cacheKey);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch (e) {}
    }
    return fallbackData;
  }
}

// Save document helper
export async function saveDocument(collectionName: string, docId: string, data: any): Promise<void> {
  const cacheKey = `swara_cache_doc_${collectionName}_${docId}`;
  localStorage.setItem(cacheKey, JSON.stringify(data));

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
  } catch (error: any) {
    console.warn(`Saved ${collectionName}/${docId} to local cache (offline sync pending):`, error?.message || error);
  }
}

// Save list (bulk write) helper with automatic deletion of removed items
export async function saveCollectionList<T extends { id: string }>(collectionName: string, list: T[]): Promise<void> {
  const cacheKey = `swara_cache_col_${collectionName}`;
  localStorage.setItem(cacheKey, JSON.stringify(list));

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
  } catch (error: any) {
    console.warn(`Saved ${collectionName} list to local cache (offline sync pending):`, error?.message || error);
  }
}

// System initialization status helpers to prevent re-seeding dummy data when collections are emptied
export async function isSystemSeeded(): Promise<boolean> {
  const isDev = isDevelopmentEnvironment();
  if (isDev) {
    const val = localStorage.getItem('dev_firestore_system_seeded');
    return val === 'true';
  }

  const localSeeded = localStorage.getItem('swara_system_seeded');
  if (localSeeded === 'true') {
    return true;
  }

  try {
    const docSnap = await getDoc(doc(db, 'system', 'init'));
    const isSeeded = docSnap.exists() && docSnap.data()?.seeded === true;
    if (isSeeded) {
      localStorage.setItem('swara_system_seeded', 'true');
    }
    return isSeeded;
  } catch (error: any) {
    // When offline or initial check, gracefully fallback without triggering unhandled console errors
    console.warn("Firestore system init check (offline/cached fallback):", error?.message || error);
    return localSeeded === 'true';
  }
}

export async function markSystemSeeded(): Promise<void> {
  localStorage.setItem('swara_system_seeded', 'true');
  const isDev = isDevelopmentEnvironment();
  if (isDev) {
    localStorage.setItem('dev_firestore_system_seeded', 'true');
    return;
  }

  try {
    await setDoc(doc(db, 'system', 'init'), { seeded: true });
  } catch (error: any) {
    console.warn("Notice: Marking system seeded saved to local cache (offline mode):", error?.message || error);
  }
}

// Delete document helper
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  const cacheKey = `swara_cache_doc_${collectionName}_${docId}`;
  localStorage.removeItem(cacheKey);

  // Sync the local storage collection list representation if present
  const colCacheKey = `swara_cache_col_${collectionName}`;
  const localCol = localStorage.getItem(colCacheKey);
  if (localCol !== null) {
    try {
      const list = JSON.parse(localCol) as { id: string }[];
      const filtered = list.filter(item => item.id !== docId);
      localStorage.setItem(colCacheKey, JSON.stringify(filtered));
    } catch (e) {}
  }

  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.warn(`Deleted document ${collectionName}/${docId} from local cache (offline sync pending):`, error?.message || error);
  }
}
