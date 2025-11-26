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
  authDomain: "rylif-app.com",
  // authDomain: "project-app-7225a.firebaseapp.com",
  projectId: "project-app-7225a",
  storageBucket: "project-app-7225a.firebasestorage.app",
  messagingSenderId: "192039876000",
  appId: "1:192039876000:web:c14390b83d1ff1a705a0c5",
  measurementId: "G-JVW7D82DEY",
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ✅ FIXED INSTALL EVENT - Better cache handling
self.addEventListener("install", (event) => {
  console.log("🔔 [SW] Service Worker installed");

  event.waitUntil(
    caches.open("fcm-assets-v1").then((cache) => {
      // ✅ GUNAKAN PATH YANG BENAR: /icons/
      const assetsToCache = [
        "/icons/icon-48x48.png",
        "/icons/icon-72x72.png",
        "/icons/icon-96x96.png",
        "/icons/icon-144x144.png",
        "/icons/icon-192x192.png",
        "/icons/icon-256x256.png",
        "/icons/icon-512x512.png",
        "/icons/icon-1024x1024.png",
      ].filter(Boolean);

      console.log("🔔 [SW] Caching assets:", assetsToCache);

      const cachePromises = assetsToCache.map((asset) => {
        return cache.add(asset).catch((error) => {
          console.log(`🔔 [SW] Failed to cache ${asset}:`, error);
        });
      });

      return Promise.allSettled(cachePromises);
    })
  );

  self.skipWaiting(); // Activate immediately
});

// ✅ ACTIVATE EVENT - Clean up
self.addEventListener("activate", (event) => {
  console.log("🔔 [SW] Service Worker activated");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== "fcm-assets-v1") {
            console.log("🔔 [SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim(); // Take control immediately
});

// ✅ BACKGROUND MESSAGE HANDLER
messaging.onBackgroundMessage((payload) => {
  console.log("🔔 [SW] Received background message:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationBody = payload.notification?.body || "";
  const notificationImage = payload.notification?.image;
  const notificationData = payload.data || {};

  const notificationOptions = {
    body: notificationBody,
    icon: "/icons/icon-72x72.png", // ✅ PATH YANG BENAR
    badge: "/icons/icon-72x72.png", // ✅ Bisa pakai same icon untuk badge
    image: notificationImage,
    data: {
      ...notificationData,
      click_action: notificationData.actionUrl || "/",
    },
    tag: notificationData.notificationId || "general-notification",
    requireInteraction: true,
    actions: [
      {
        action: "open",
        title: "📱 Open",
      },
      {
        action: "dismiss",
        title: "❌ Dismiss",
      },
    ],
  };

  console.log("🔔 [SW] Showing notification:", notificationTitle);
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// ✅ NOTIFICATION CLICK HANDLER
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 [SW] Notification clicked:", event.notification);

  event.notification.close();
  const action = event.action;
  const notificationData = event.notification.data;
  const targetUrl =
    notificationData?.actionUrl || notificationData?.click_action || "/";

  if (action === "dismiss") {
    console.log("🔔 [SW] User dismissed notification");
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            console.log("🔔 [SW] Focusing existing app tab");
            return client.focus();
          }
        }

        console.log("🔔 [SW] Opening new app tab");
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

console.log("🔔 [SW] Firebase Messaging Service Worker loaded successfully");
