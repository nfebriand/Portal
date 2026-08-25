import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot,
  Unsubscribe
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
  // Always use the real live Firestore database
  return false;
}

/**
 * Recursively cleans an object for Firestore and localStorage by removing undefined fields,
 * functions, or unsupported object prototypes that Firestore throws errors on.
 */
export function cleanObjectForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObjectForFirestore(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanObjectForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Generic fetch array collection directly from live Firestore.
 * LocalStorage acts strictly as an offline/read-through cache; it will NEVER resurrect deleted documents.
 */
export async function fetchCollection<T extends { id: string }>(collectionName: string, fallbackData: T[]): Promise<T[]> {
  const cacheKey = `swara_cache_col_${collectionName}`;

  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      const seeded = await isSystemSeeded();
      if (seeded) {
        // Collection is legitimately empty in live Firestore
        try {
          localStorage.setItem(cacheKey, JSON.stringify([]));
        } catch (e) {}
        return [];
      }
      // System has never been seeded before
      return fallbackData;
    }

    const data: T[] = [];
    snapshot.forEach((docSnap) => {
      const docData = docSnap.data();
      if (docData && typeof docData === 'object') {
        data.push(docData as T);
      }
    });

    // Update local cache with live Firestore data
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {}

    return data;
  } catch (error: any) {
    console.warn(`Fetch notice for ${collectionName} (using offline cache fallback):`, error?.message || error);
    const cached = localStorage.getItem(cacheKey);
    if (cached !== null) {
      try {
        const parsed = JSON.parse(cached) as T[];
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return fallbackData;
  }
}

/**
 * Real-time subscription to a Firestore collection.
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const cacheKey = `swara_cache_col_${collectionName}`;
  const colRef = collection(db, collectionName);

  return onSnapshot(colRef, (snapshot) => {
    const data: T[] = [];
    snapshot.forEach((docSnap) => {
      const docData = docSnap.data();
      if (docData && typeof docData === 'object') {
        data.push(docData as T);
      }
    });

    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {}

    onData(data);
  }, (error) => {
    console.warn(`Firestore onSnapshot error on ${collectionName}:`, error);
    if (onError) onError(error);
  });
}

/**
 * Fetch single document directly from live Firestore.
 */
export async function fetchDocument<T>(collectionName: string, docId: string, fallbackData: T): Promise<T> {
  const cacheKey = `swara_cache_doc_${collectionName}_${docId}`;

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as T;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {}
      return data;
    } else {
      const seeded = await isSystemSeeded();
      if (seeded) {
        return fallbackData;
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

/**
 * Real-time subscription to a single Firestore document.
 */
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  onData: (data: T) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const cacheKey = `swara_cache_doc_${collectionName}_${docId}`;
  const docRef = doc(db, collectionName, docId);

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as T;
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {}
      onData(data);
    }
  }, (error) => {
    console.warn(`Firestore onSnapshot error on ${collectionName}/${docId}:`, error);
    if (onError) onError(error);
  });
}

/**
 * Save single document helper with auto-clean and instant local backup.
 */
export async function saveDocument(collectionName: string, docId: string, data: any): Promise<void> {
  const cacheKey = `swara_cache_doc_${collectionName}_${docId}`;
  const cleaned = cleanObjectForFirestore(data);

  try {
    localStorage.setItem(cacheKey, JSON.stringify(cleaned));
  } catch (e) {}

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, cleaned);
  } catch (error: any) {
    console.warn(`Error saving ${collectionName}/${docId} to live Firestore:`, error?.message || error);
    throw error;
  }
}

/**
 * Save list (bulk write) helper with automatic sanitization, chunking (<= 350 ops/batch), and deletion of stale documents.
 */
export async function saveCollectionList<T extends { id: string }>(collectionName: string, list: T[]): Promise<void> {
  const cacheKey = `swara_cache_col_${collectionName}`;
  const safeList = Array.isArray(list) ? list : [];
  const cleanedList = safeList
    .map(item => cleanObjectForFirestore(item))
    .filter((item): item is T => Boolean(item && typeof item === 'object' && item.id));

  // Mirror to local cache
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cleanedList));
  } catch (e) {
    console.warn(`LocalStorage write warning for ${collectionName}:`, e);
  }

  // Persist directly to live Firestore
  try {
    const listIds = new Set(cleanedList.map(item => String(item.id)));
    const operations: { type: 'delete' | 'set'; id: string; data?: any }[] = [];

    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const existingIds = snapshot.docs.map(docSnap => docSnap.id);

      // Delete documents that are no longer in the list
      existingIds.forEach((id) => {
        if (!listIds.has(id)) {
          operations.push({ type: 'delete', id });
        }
      });
    } catch (fetchErr) {
      console.warn(`Non-blocking warning fetching existing IDs for ${collectionName}:`, fetchErr);
    }

    // Write/Update current items
    cleanedList.forEach((item) => {
      operations.push({ type: 'set', id: String(item.id), data: item });
    });

    if (operations.length === 0) return;

    // Chunk writes into safe batches of 350 ops
    const CHUNK_SIZE = 350;
    for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
      const chunk = operations.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(op => {
        const docRef = doc(db, collectionName, op.id);
        if (op.type === 'delete') {
          batch.delete(docRef);
        } else {
          batch.set(docRef, op.data);
        }
      });
      await batch.commit();
    }
  } catch (error: any) {
    console.warn(`Error persisting ${collectionName} list to live Firestore:`, error?.message || error);
    throw error;
  }
}

/**
 * System initialization check. Ensures we NEVER accidentally overwrite live Firestore data with initial dummy data.
 */
export async function isSystemSeeded(): Promise<boolean> {
  const localSeeded = localStorage.getItem('swara_system_seeded');
  if (localSeeded === 'true') {
    return true;
  }

  try {
    const docSnap = await getDoc(doc(db, 'system', 'init'));
    if (docSnap.exists() && docSnap.data()?.seeded === true) {
      localStorage.setItem('swara_system_seeded', 'true');
      return true;
    }

    // Also verify if Firestore contains existing documents in any core collection
    const empSnap = await getDocs(collection(db, 'employees'));
    if (!empSnap.empty) {
      await markSystemSeeded();
      return true;
    }

    const agSnap = await getDocs(collection(db, 'agreements'));
    if (!agSnap.empty) {
      await markSystemSeeded();
      return true;
    }

    const repSnap = await getDocs(collection(db, 'newsReports'));
    if (!repSnap.empty) {
      await markSystemSeeded();
      return true;
    }

    return false;
  } catch (error: any) {
    console.warn("Firestore system init check (defaulting to true for safety):", error?.message || error);
    // In case of network check failure, ALWAYS treat as seeded to protect user data from being wiped
    return true;
  }
}

export async function markSystemSeeded(): Promise<void> {
  localStorage.setItem('swara_system_seeded', 'true');
  try {
    await setDoc(doc(db, 'system', 'init'), { 
      seeded: true,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.warn("Notice: Marking system seeded saved locally:", error?.message || error);
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
    console.warn(`Error deleting document ${collectionName}/${docId} from live Firestore:`, error?.message || error);
    throw error;
  }
}
