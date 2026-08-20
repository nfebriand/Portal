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

// Generic fetch array collection with dual-layer Firestore + Local Cache recovery
export async function fetchCollection<T extends { id: string }>(collectionName: string, fallbackData: T[]): Promise<T[]> {
  const cacheKey = `swara_cache_col_${collectionName}`;

  // 1. Read local cache first
  let cachedList: T[] | null = null;
  const cached = localStorage.getItem(cacheKey);
  if (cached !== null) {
    try {
      const parsed = JSON.parse(cached) as T[];
      if (Array.isArray(parsed)) {
        cachedList = parsed;
      }
    } catch (e) {}
  }

  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      // If Firestore is empty but we have local cache with items, PRESERVE and re-sync to Firestore!
      if (cachedList && cachedList.length > 0) {
        saveCollectionList(collectionName, cachedList).catch(err => 
          console.warn(`Background re-sync for ${collectionName}:`, err)
        );
        return cachedList;
      }

      // If both Firestore and local cache are empty:
      if (fallbackData.length === 0) {
        return [];
      }
      return fallbackData;
    }

    const data: T[] = [];
    snapshot.forEach((docSnap) => {
      const docData = docSnap.data();
      if (docData && typeof docData === 'object') {
        data.push(docData as T);
      }
    });

    // If Firestore has documents, but local cache had newly added/imported records that were not yet in Firestore,
    // merge them by id so that nothing is lost across rapid reloads!
    if (cachedList && cachedList.length > 0) {
      const fireIds = new Set(data.map(d => d.id));
      const missingFromFirestore = cachedList.filter(item => item && item.id && !fireIds.has(item.id));
      if (missingFromFirestore.length > 0) {
        const merged = [...data, ...missingFromFirestore];
        try {
          localStorage.setItem(cacheKey, JSON.stringify(merged));
        } catch (e) {}
        saveCollectionList(collectionName, merged).catch(err => 
          console.warn(`Background sync merged ${collectionName} to Firestore:`, err)
        );
        return merged;
      }
    }

    // Cache locally for instant offline/reload access
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {}

    return data;
  } catch (error: any) {
    console.warn(`Fetch notice for ${collectionName} (using offline cache):`, error?.message || error);
    if (cachedList !== null) {
      return cachedList;
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
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {}
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

// Save document helper with auto-clean and instant local backup
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
    console.warn(`Saved ${collectionName}/${docId} to local cache (offline sync pending):`, error?.message || error);
  }
}

// Save list (bulk write) helper with automatic sanitization, chunking (<= 350 ops/batch), and deletion
export async function saveCollectionList<T extends { id: string }>(collectionName: string, list: T[]): Promise<void> {
  const cacheKey = `swara_cache_col_${collectionName}`;
  const safeList = Array.isArray(list) ? list : [];
  const cleanedList = safeList
    .map(item => cleanObjectForFirestore(item))
    .filter((item): item is T => Boolean(item && typeof item === 'object' && item.id));

  // 1. Immediately mirror to local cache to ensure zero data loss on browser refresh
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cleanedList));
  } catch (e) {
    console.warn(`LocalStorage write warning for ${collectionName}:`, e);
  }

  // 2. Persist to Firestore with chunked batches (Firestore maximum is 500 operations per batch)
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const existingIds = snapshot.docs.map(docSnap => docSnap.id);
    const listIds = new Set(cleanedList.map(item => String(item.id)));

    const operations: { type: 'delete' | 'set'; id: string; data?: any }[] = [];

    // Delete documents that are no longer in the list
    existingIds.forEach((id) => {
      if (!listIds.has(id)) {
        operations.push({ type: 'delete', id });
      }
    });

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
    console.warn(`Saved ${collectionName} list to local cache (cloud notice):`, error?.message || error);
  }
}

// System initialization status helpers to prevent re-seeding dummy data when collections are emptied or populated
export async function isSystemSeeded(): Promise<boolean> {
  const localSeeded = localStorage.getItem('swara_system_seeded');
  if (localSeeded === 'true') {
    return true;
  }

  // Check if any existing collection has data in localStorage
  const keysToCheck = [
    'swara_cache_col_newsReports',
    'swara_cache_col_employees',
    'swara_cache_col_agreements',
    'swara_cache_col_contracts',
    'swara_cache_col_reporterTargets'
  ];
  for (const k of keysToCheck) {
    const val = localStorage.getItem(k);
    if (val) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem('swara_system_seeded', 'true');
          return true;
        }
      } catch (e) {}
    }
  }

  try {
    const docSnap = await getDoc(doc(db, 'system', 'init'));
    const isSeeded = docSnap.exists() && docSnap.data()?.seeded === true;
    if (isSeeded) {
      localStorage.setItem('swara_system_seeded', 'true');
      return true;
    }

    // Also check if Firestore already contains documents in employees or newsReports
    const empSnap = await getDocs(collection(db, 'employees'));
    if (!empSnap.empty) {
      await markSystemSeeded();
      return true;
    }

    return false;
  } catch (error: any) {
    console.warn("Firestore system init check (offline/cached fallback):", error?.message || error);
    return localSeeded === 'true';
  }
}

export async function markSystemSeeded(): Promise<void> {
  localStorage.setItem('swara_system_seeded', 'true');
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
