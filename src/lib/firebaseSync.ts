
// REPLACED FIREBASE WITH POSTGRESQL (via Express API)
import { Unsubscribe } from 'firebase/firestore'; // Keep for type compatibility

// A mock unsubscribe function since we'll use polling or just fetch once for now
const mockUnsubscribe: Unsubscribe = () => {};

export function isDevelopmentEnvironment(): boolean {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('run.app');
}

export function cleanObjectForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanObjectForFirestore) as any;

  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value === null) {
      cleaned[key] = null;
    } else if (typeof value === 'object') {
      cleaned[key] = cleanObjectForFirestore(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

export async function fetchCollection<T>(collectionName: string, fallbackData: T[]): Promise<T[]> {
  try {
    const res = await fetch(`/api/data/${collectionName}`);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : fallbackData;
  } catch (err) {
    console.warn(`Fetch error ${collectionName}, using fallback:`, err);
    return fallbackData;
  }
}

export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  // Use polling for subscription emulation
  let isSubscribed = true;
  
  const poll = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/data/${collectionName}`);
      if (res.ok) {
        const data = await res.json();
        onData(data);
      }
    } catch (e) {
      if (onError) onError(e);
    }
    if (isSubscribed) setTimeout(poll, 5000); // poll every 5s
  };
  
  poll();
  
  return () => {
    isSubscribed = false;
  };
}

export async function fetchDocument<T>(collectionName: string, docId: string, fallbackData: T): Promise<T> {
  try {
    const res = await fetch(`/api/data/${collectionName}/${docId}`);
    if (!res.ok) return fallbackData;
    return await res.json();
  } catch (err) {
    return fallbackData;
  }
}

export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  onData: (data: T) => void,
  onError?: (error: any) => void
): Unsubscribe {
  let isSubscribed = true;
  
  const poll = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/data/${collectionName}/${docId}`);
      if (res.ok) {
        const data = await res.json();
        onData(data);
      }
    } catch (e) {
      if (onError) onError(e);
    }
    if (isSubscribed) setTimeout(poll, 5000); // poll every 5s
  };
  
  poll();
  
  return () => {
    isSubscribed = false;
  };
}

export async function saveDocument(collectionName: string, docId: string, data: any): Promise<void> {
  const cleaned = cleanObjectForFirestore(data);
  const res = await fetch(`/api/data/${collectionName}/${docId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleaned)
  });
  if (!res.ok) {
    throw new Error(`Failed to save ${collectionName}/${docId}`);
  }
}

export async function saveCollectionList<T extends { id: string }>(collectionName: string, list: T[]): Promise<void> {
  const safeList = Array.isArray(list) ? list : [];
  const cleanedList = safeList.map(cleanObjectForFirestore);
  
  // Just save them one by one for now since Postgres can handle it easily locally
  for (const item of cleanedList) {
    if (item && item.id) {
      await saveDocument(collectionName, String(item.id), item);
    }
  }
}

export async function isSystemSeeded(): Promise<boolean> {
  return true;
}

export async function markSystemSeeded(): Promise<void> {
  // no-op
}

export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  const res = await fetch(`/api/data/${collectionName}/${docId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete');
}
