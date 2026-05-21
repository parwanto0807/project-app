// hooks/useFCM.ts
import { useEffect, useState } from 'react';
import { getToken, onMessage, deleteToken, MessagePayload } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { saveFcmToken } from '@/lib/action/fcm/fcm';
import type { IncomingMessage } from '@/types/fcm';

// Helper function untuk convert Firebase MessagePayload ke IncomingMessage
const convertToIncomingMessage = (payload: MessagePayload): IncomingMessage => {
  return {
    notification: payload.notification ? {
      title: payload.notification.title || '',
      body: payload.notification.body || '',
      image: payload.notification.image
    } : undefined,
    data: payload.data as { [key: string]: string } | undefined,
    from: payload.from,
    messageId: payload.messageId,
    fcmOptions: payload.fcmOptions
  };
};

export const useFCM = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<IncomingMessage | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Check FCM support on component mount
  useEffect(() => {
    const checkSupport = () => {
      const isFcmSupported = 
        typeof window !== 'undefined' && 
        'Notification' in window &&
        'serviceWorker' in navigator &&
        messaging !== undefined;
      
      setIsSupported(isFcmSupported);
      
      if (!isFcmSupported) {
        (() => {})('❌ FCM not supported in this environment');
      } else {
        (() => {})('✅ FCM supported');
      }
    };

    checkSupport();
  }, []);

  // Request permission dan dapatkan token
  const requestPermission = async (): Promise<string | null> => {
    try {
      if (!messaging) {
        (() => {})('❌ Messaging not available');
        return null;
      }

      (() => {})('🔔 Requesting notification permission...');
      
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        (() => {})('✅ Notification permission granted');
        
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        
        if (token) {
          (() => {})('✅ FCM Token received:', token);
          setFcmToken(token);
          
          // Simpan ke backend
          const saved = await saveFcmToken(token);
          if (saved) {
            (() => {})('✅ FCM Token saved to backend');
          } else {
            (() => {})('❌ Failed to save FCM token to backend');
          }
          
          return token;
        } else {
          (() => {})('❌ No FCM token received');
        }
      } else {
        (() => {})(`❌ Notification permission ${permission}`);
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
    }
    
    return null;
  };

  // Handle incoming messages ketika app dalam foreground
  useEffect(() => {
    if (!messaging) return;

    (() => {})('🎯 Setting up FCM message listener...');
    
    const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
      (() => {})('📨 Received foreground message:', payload);
      
      // Convert Firebase payload ke custom type
      const incomingMessage = convertToIncomingMessage(payload);
      setNotification(incomingMessage);
      
      // Show notification
      if (incomingMessage.notification && incomingMessage.notification.title && incomingMessage.notification.body) {
        const { title, body } = incomingMessage.notification;
        (() => {})(`📢 Showing notification: ${title} - ${body}`);
        showBrowserNotification(title, body);
      }
    });

    return () => {
      (() => {})('🧹 Cleaning up FCM message listener');
      unsubscribe();
    };
  }, []);

  // Show browser notification
  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'fcm-notification'
        });

        // Handle notification click
        notification.onclick = () => {
          (() => {})('🖱️ Notification clicked');
          window.focus();
          notification.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

      } catch (error) {
        console.error('❌ Error showing browser notification:', error);
      }
    }
  };

  // Delete token (untuk logout)
  const deleteFcmToken = async (): Promise<void> => {
    try {
      if (!messaging) {
        (() => {})('❌ Messaging not available');
        return;
      }

      await deleteToken(messaging);
      setFcmToken(null);
      (() => {})('✅ FCM Token deleted');
    } catch (error) {
      console.error('❌ Error deleting FCM token:', error);
    }
  };

  return {
    fcmToken,
    notification,
    requestPermission,
    deleteFcmToken,
    showBrowserNotification,
    isSupported
  };
};