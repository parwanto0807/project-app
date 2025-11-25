importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

// Config yang sama persis dengan yang ada di lib/firebase.ts
// (Kita harus copy-paste ke sini karena file ini tidak bisa membaca file .ts di luar folder public)
const firebaseConfig = {
  apiKey: "AIzaSyBR2CWIcT2i80RoerJi3nRVreUcN7izgG0",
  authDomain: "project-app-7225a.firebaseapp.com",
  projectId: "project-app-7225a",
  storageBucket: "project-app-7225a.firebasestorage.app",
  messagingSenderId: "192039876000",
  appId: "1:192039876000:web:c14390b83d1ff1a705a0c5",
  measurementId: "G-JVW7D82DEY",
};

// 1. Initialize Firebase di dalam Service Worker
firebase.initializeApp(firebaseConfig);

// 2. Retrieve instance messaging
const messaging = firebase.messaging();

// 3. Handler untuk pesan background
// Ini akan jalan kalau tab browser user sedang ditutup atau user ada di tab lain
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Custom judul notifikasi (opsional, jika payload dari server kurang lengkap)
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png", // Ganti dengan icon logo aplikasimu di folder public
  };

  // Tampilkan notifikasi native browser
  self.registration.showNotification(notificationTitle, notificationOptions);
});
