// components/FCMInitializer.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { messaging } from "@/lib/firebase";
import {
  getToken,
  deleteToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import { saveFcmToken } from "@/lib/action/fcm/fcm";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext"; // ⬅ penting

export default function FCMInitializer() {
  const isInitializing = useRef(false);
  const lastSavedToken = useRef<string | null>(null);
  const { addNotification } = useNotifications();
  const { isAuthenticated, accessToken } = useAuth(); // ⬅ cek login

  // -------------------------------------------------------------------
  // SAVE TOKEN HANYA JIKA USER LOGIN & TOKEN BERUBAH
  // -------------------------------------------------------------------
  const saveTokenIfNeeded = useCallback(
    async (token: string) => {
      if (!isAuthenticated || !accessToken) {
        console.warn("⏳ [FCM] Skip save — user belum login");
        return;
      }

      if (token === lastSavedToken.current) return;

      const success = await saveFcmToken(token);
      if (success) {
        lastSavedToken.current = token;
        localStorage.setItem("fcm-token", token);
        console.log("🔐 [FCM] Token saved/updated:", token);
      }
    },
    [isAuthenticated, accessToken]
  );

  // -------------------------------------------------------------------
  // FOREGROUND LISTENER
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("🔥 [FCM Foreground] Payload:", payload);

      const title =
        payload.notification?.title || payload.data?.title || "Notification";

      const body = payload.notification?.body || payload.data?.body || "";

      const notification = {
        id: payload.data?.notificationId ?? `fcm-${Date.now()}`,
        userId: payload.data?.userId ?? "",
        title,
        body,
        timestamp: new Date(),
        read: false,
        type: payload.data?.type ?? "general",
        imageUrl: payload.notification?.image ?? payload.data?.imageUrl,
        actionUrl: payload.data?.actionUrl,
        data: payload.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addNotification(notification);

      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: notification.imageUrl || "/icons/icon-192x192.png",
        });
      }
    });

    return () => unsubscribe();
  }, [addNotification]);

  // -------------------------------------------------------------------
  // INISIALISASI FCM HANYA SETELAH LOGIN
  // -------------------------------------------------------------------
  const initializeFCM = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return; // ⬅ user belum login
    if (!messaging || isInitializing.current) return;
    isInitializing.current = true;

    try {
      if (!await isSupported()) return;

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        console.warn("⚠️ [FCM] Token unavailable");
        return;
      }

      await saveTokenIfNeeded(token);
    } catch (err) {
      console.error("❌ [FCM] Initialize error:", err);
    } finally {
      isInitializing.current = false;
    }
  }, [isAuthenticated, accessToken, saveTokenIfNeeded]);

  useEffect(() => {
    if (!isAuthenticated) return;
    initializeFCM();
  }, [isAuthenticated, initializeFCM]);

  // -------------------------------------------------------------------
  // CLEAR TOKEN SAAT LOGOUT
  // -------------------------------------------------------------------
  useEffect(() => {
    const logoutHandler = async () => {
      try {
        if (!messaging) return;
        await deleteToken(messaging);
        localStorage.removeItem("fcm-token");
        console.log("🧹 [FCM] Token removed on logout");
      } catch (err) {
        console.error("❌ [FCM] Logout cleanup error:", err);
      }
    };

    window.addEventListener("user-logout", logoutHandler);
    return () => window.removeEventListener("user-logout", logoutHandler);
  }, []);

  return null;
}
