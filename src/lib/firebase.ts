import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5BueTngR-1aOo6bUuveoUgz7ghZQcRQQ",
  authDomain: "nlwc-ikorodu.firebaseapp.com",
  projectId: "nlwc-ikorodu",
  storageBucket: "nlwc-ikorodu.firebasestorage.app",
  messagingSenderId: "5883069998",
  appId: "1:5883069998:web:7b6faf94fe1763baf981bf",
  measurementId: "G-E3FPZEJWHV",
};

// Initialize Firebase (prevent duplicate initialization)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export default app;
