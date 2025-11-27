// components/FCMInitializer.tsx - FIXED VERSION
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import { saveFcmToken } from '@/lib/action/fcm/fcm';
import { getAccessToken } from '@/lib/autoRefresh';
import { useNotifications } from '@/contexts/NotificationContext';

export default function FCMInitializer() {
  const [retryCount, setRetryCount] = useState(0);
  const isInitializing = useRef(false);
  const isLoggedIn = useRef(false);
  const { addNotification } = useNotifications();

  // ✅ FOREGROUND MESSAGE HANDLER - DIPINDAH KE LUAR
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📨 [FCM] Received foreground message:', payload);

      // ✅ Add to context notifications
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

      // ✅ Optional: Show browser notification juga
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'New Notification', {
          body: payload.notification.body,
          icon: payload.notification.image || '/icons/icon-192x192.png',
        });
      }
    });

    return () => unsubscribe();
  }, [addNotification]);

  // ✅ GUNAKAN useCallback UNTUK checkLoginStatus - TANPA useEffect DI DALAM
  const checkLoginStatus = useCallback((): boolean => {
    const accessToken = getAccessToken();
    const currentlyLoggedIn = !!accessToken;

    // Jika status berubah dari login → logout
    if (isLoggedIn.current && !currentlyLoggedIn) {
      console.log('🔐 [FCM] User logged out - cleaning up...');
      handleLogoutCleanup();
    }

    isLoggedIn.current = currentlyLoggedIn;
    return currentlyLoggedIn;
  }, []);

  // ✅ CLEANUP SAAT LOGOUT
  const handleLogoutCleanup = async (): Promise<void> => {
    if (!messaging) return;

    try {
      console.log('🧹 [FCM] Cleaning up FCM tokens...');

      // Hapus FCM token dari browser
      await deleteToken(messaging);
      console.log('✅ [FCM] FCM token deleted from browser');

    } catch (error) {
      console.log('🔐 [FCM] Cleanup during logout:', error);
    }
  };

  // ✅ TYPE-SAFE FCM INITIALIZATION
  const initializeFCM = useCallback(async (): Promise<void> => {
    // ✅ TYPE GUARD: Pastikan messaging tersedia
    if (!messaging) {
      console.log('❌ [FCM] Messaging not available');
      return;
    }

    // ✅ PREVENT MULTIPLE INITIALIZATION
    if (isInitializing.current) {
      return;
    }

    isInitializing.current = true;

    try {
      console.log(`🔄 [FCM] Initialization attempt ${retryCount + 1}...`);

      // ✅ CHECK LOGIN STATUS LAGI SEBELUM MELANJUTKAN
      if (!checkLoginStatus()) {
        console.log('🔐 [FCM] User logged out during initialization - stopping');
        return;
      }

      // ✅ SERVICE WORKER REGISTRATION
      let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        try {
          serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✅ [FCM] Service Worker registered');
        } catch (error) {
          console.error('❌ [FCM] Service Worker registration failed:', error);

          if (retryCount < 2) {
            console.log(`🔄 [FCM] Retrying in 3 seconds... (${retryCount + 1}/3)`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 3000);
          }
          return;
        }
      } else {
        console.log('❌ [FCM] Service Worker not supported');
        return;
      }

      // ✅ CHECK PERMISSION
      const currentPermission = Notification.permission;
      console.log('🔔 [FCM] Current permission:', currentPermission);

      if (currentPermission === 'default') {
        try {
          const newPermission = await Notification.requestPermission();
          console.log('✅ [FCM] Permission result:', newPermission);

          if (newPermission !== 'granted') {
            console.log('❌ [FCM] User denied notification permission');
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

      // ✅ CHECK LOGIN STATUS SEBELUM GET TOKEN
      if (!checkLoginStatus()) {
        console.log('🔐 [FCM] User logged out before token generation');
        return;
      }

      // ✅ GET FCM TOKEN - TYPE SAFE
      try {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration
        });

        if (token) {
          console.log('✅ [FCM] Token obtained');

          // ✅ CHECK LOGIN STATUS SEBELUM SAVE TOKEN
          if (!checkLoginStatus()) {
            console.log('🔐 [FCM] User logged out before saving token');
            return;
          }

          // ✅ SAVE TOKEN
          const saved = await saveFcmToken(token);
          if (saved) {
            console.log('✅ [FCM] Token saved to backend');
            setRetryCount(0);
          } else {
            console.log('⚠️ [FCM] Token not saved to backend (user might be logging out)');
          }
        } else {
          console.error('❌ [FCM] Token is empty');
        }
      } catch (tokenError) {
        console.error('❌ [FCM] Error getting token:', tokenError);
      }

    } catch (error) {
      console.error('❌ [FCM] Initialization error:', error);
    } finally {
      isInitializing.current = false;
    }
  }, [retryCount, checkLoginStatus]);

  // ✅ MAIN EFFECT
  useEffect(() => {
    // ✅ CHECK LOGIN STATUS SEBELUM INIT
    if (!checkLoginStatus()) {
      // console.log('🔐 [FCM] User not logged in - skipping initialization');
      return;
    }

    const timeoutId = setTimeout(initializeFCM, 1000);

    return () => clearTimeout(timeoutId);
  }, [initializeFCM, checkLoginStatus]); // ✅ INCLUDED DEPENDENCIES

  // ✅ LISTEN FOR LOGOUT EVENTS
  useEffect(() => {
    const handleLogout = (): void => {
      console.log('🔐 [FCM] Logout event received');
      handleLogoutCleanup();
    };

    // Listen untuk custom logout event
    window.addEventListener('user-logout', handleLogout);

    return () => {
      window.removeEventListener('user-logout', handleLogout);
    };
  }, []);

  return null;
}