// components/FCMInitializer.tsx - SIMPLIFIED VERSION
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import { saveFcmToken } from '@/lib/action/fcm/fcm';
import { useNotifications } from '@/contexts/NotificationContext';

export default function FCMInitializer() {
  const isInitializing = useRef(false);
  const { addNotification } = useNotifications();

  // ✅ FOREGROUND MESSAGE HANDLER
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const newNotification = {
        id: payload.data?.notificationId || `fcm-${Date.now()}`,
        userId: 'current-user',
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        timestamp: new Date(),
        read: false,
        type: payload.data?.type || 'general',
        imageUrl: payload.notification?.image,
        actionUrl: payload.data?.actionUrl,
        data: payload.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addNotification(newNotification);

      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'New Notification', {
          body: payload.notification.body,
          icon: payload.notification.image || '/icons/icon-192x192.png',
        });
      }
    });

    return () => unsubscribe();
  }, [addNotification]);

  // ✅ CLEANUP SAAT LOGOUT
  const handleLogoutCleanup = useCallback(async (): Promise<void> => {
    if (!messaging) return;

    try {
      // console.log('🧹 [FCM] Cleaning up FCM tokens...');
      await deleteToken(messaging);
      // console.log('✅ [FCM] FCM token deleted from browser');
    } catch (error) {
      console.log('🔐 [FCM] Cleanup during logout:', error);
    }
  }, []);

  // ✅ FCM INITIALIZATION - SIMPLE & DIRECT
  const initializeFCM = useCallback(async (): Promise<void> => {
    if (!messaging) {
      // console.log('❌ [FCM] Messaging not available');
      return;
    }

    if (isInitializing.current) {
      return;
    }

    isInitializing.current = true;

    try {
      // console.log('🚀 [FCM] Starting FCM initialization...');

      // ✅ SERVICE WORKER REGISTRATION
      let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;

      if ('serviceWorker' in navigator) {
        try {
          serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          // console.log('✅ [FCM] Service Worker registered');
        } catch (error) {
          console.error('❌ [FCM] Service Worker registration failed:', error);
          return;
        }
      } else {
        console.log('❌ [FCM] Service Worker not supported');
        return;
      }

      // ✅ CHECK PERMISSION
      const currentPermission = Notification.permission;

      if (currentPermission === 'default') {
        try {
          const newPermission = await Notification.requestPermission();
          console.log('✅ [FCM] Permission result:', newPermission);

          if (newPermission !== 'granted') {
            // console.log('❌ [FCM] User denied notification permission');
            return;
          }
        } catch (permissionError) {
          console.error('❌ [FCM] Error requesting permission:', permissionError);
          return;
        }
      } else if (currentPermission !== 'granted') {
        console.log('❌ [FCM] Notification permission not granted');
        return;
      }

      // ✅ GET FCM TOKEN
      // console.log('🔑 [FCM] Getting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration
      });

      if (token) {
        console.log('✅ [FCM] Token obtained:', token.substring(0, 20) + '...');

        // ✅ SAVE TOKEN
        // console.log('💾 [FCM] Saving token to backend...');
        const saved = await saveFcmToken(token);

        if (saved) {
          console.log('✅ [FCM] Token saved to backend');
        } else {
          console.log('⚠️ [FCM] Token not saved to backend');
        }
      } else {
        console.error('❌ [FCM] Token is empty');
      }

    } catch (error) {
      console.error('❌ [FCM] Initialization error:', error);
    } finally {
      isInitializing.current = false;
    }
  }, []);

  // ✅ MAIN EFFECT - LANGSUNG JALAN KARENA USER SUDAH LOGIN
  useEffect(() => {
    // console.log('🎯 [FCM] Component mounted - user is logged in, starting FCM...');

    const timer = setTimeout(() => {
      initializeFCM();
    }, 1000); // Delay kecil untuk pastikan semuanya ready

    return () => clearTimeout(timer);
  }, [initializeFCM]);

  // ✅ LISTEN FOR LOGOUT EVENTS
  useEffect(() => {
    const handleLogout = (): void => {
      // console.log('🔐 [FCM] Logout event received');
      handleLogoutCleanup();
    };

    window.addEventListener('user-logout', handleLogout);

    return () => {
      window.removeEventListener('user-logout', handleLogout);
    };
  }, [handleLogoutCleanup]);

  return null;
}