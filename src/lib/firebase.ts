import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDj_4H34ieRIZibBmPavuSZqJoyGv5EUMs",
  authDomain: "artful-design-vlrqd.firebaseapp.com",
  projectId: "artful-design-vlrqd",
  storageBucket: "artful-design-vlrqd.firebasestorage.app",
  messagingSenderId: "553759552752",
  appId: "1:553759552752:web:d2eb2ad8f530daaf3d7e35"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-portalkomandorri-c2023b9f-2e21-4774-af1d-619e281c8d21");

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection verified successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase is offline. Please check your network and configuration.");
    } else {
      console.log("Firebase connection response:", error);
    }
  }
}

testConnection();
