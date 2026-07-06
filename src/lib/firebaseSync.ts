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

// Generic fetch array collection
export async function fetchCollection<T extends { id: string }>(collectionName: string, fallbackData: T[]): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // Seed fallback data to Firestore
      const batch = writeBatch(db);
      fallbackData.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
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
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as T;
    } else {
      // Seed fallback data
      await setDoc(docRef, fallbackData as any);
      return fallbackData;
    }
  } catch (error) {
    console.error(`Error fetching document ${collectionName}/${docId}:`, error);
    return fallbackData;
  }
}

// Save document helper
export async function saveDocument(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Error saving document ${collectionName}/${docId}:`, error);
  }
}

// Save list (bulk write) helper with automatic deletion of removed items
export async function saveCollectionList<T extends { id: string }>(collectionName: string, list: T[]): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const existingIds = snapshot.docs.map(doc => doc.id);
    const listIds = new Set(list.map(item => item.id));

    const batch = writeBatch(db);
    
    // Delete documents that are no longer in the list
    existingIds.forEach((id) => {
      if (!listIds.has(id)) {
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
      }
    });

    // Write/Update current items
    list.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item);
    });

    await batch.commit();
  } catch (error) {
    console.error(`Error saving collection list ${collectionName}:`, error);
  }
}

// System initialization status helpers to prevent re-seeding dummy data when collections are emptied
export async function isSystemSeeded(): Promise<boolean> {
  try {
    const docSnap = await getDoc(doc(db, 'system', 'init'));
    return docSnap.exists() && docSnap.data().seeded === true;
  } catch (error) {
    console.error("Error checking system init status:", error);
    return false;
  }
}

export async function markSystemSeeded(): Promise<void> {
  try {
    await setDoc(doc(db, 'system', 'init'), { seeded: true });
  } catch (error) {
    console.error("Error marking system as seeded:", error);
  }
}

// Delete document helper
export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${collectionName}/${docId}:`, error);
  }
}
