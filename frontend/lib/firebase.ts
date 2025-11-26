import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  Messaging,
  getToken,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBR2CWIcT2i80RoerJi3nRVreUcN7izgG0",
  authDomain: "project-app-7225a.firebaseapp.com",
  projectId: "project-app-7225a",
  storageBucket: "project-app-7225a.firebasestorage.app",
  messagingSenderId: "192039876000",
  appId: "1:192039876000:web:c14390b83d1ff1a705a0c5",
  measurementId: "G-JVW7D82DEY",
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
