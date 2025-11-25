import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  Messaging,
  getToken,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGIN_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID,
};

// 1. Initialize Firebase
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Gunakan instance yang sudah ada jika re-render
}

// 2. Initialize Messaging
let messaging: Messaging | undefined; // Beri tipe 'undefined' karena di server nilainya kosong

if (typeof window !== "undefined") {
  // Hanya jalankan getMessaging di Client Side (Browser)
  messaging = getMessaging(app);
}

export { messaging, getToken, onMessage };
