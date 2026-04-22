import { loadEnvConfig } from '@next/env';
import * as admin from 'firebase-admin';
import path from 'path';

// Load environment variables manually
const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function test() {
  console.log("PROJECT ID:", process.env.FIREBASE_ADMIN_PROJECT_ID);
  console.log("CLIENT EMAIL:", process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  console.log("PRIVATE KEY length:", process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length);

  if (!admin.apps.length) {
    try {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
      console.log("Initializing firebase-admin...");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log("Initialized.");
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      process.exit(1);
    }
  }

  try {
    const adminDb = admin.firestore();
    const testDoc = { test: true, timestamp: admin.firestore.FieldValue.serverTimestamp() };
    console.log("Attempting to write to firestore...");
    const res = await adminDb.collection("test_connection").add(testDoc);
    console.log("Write success! ID:", res.id);
    
    console.log("Attempting to delete...");
    await adminDb.collection("test_connection").doc(res.id).delete();
    console.log("Delete success!");
  } catch (error) {
    console.error('Firestore operation failed:', error);
  }
}

test();
