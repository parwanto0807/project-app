// contexts/NotificationContext.tsx
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';

// ✅ IMPORT FUNCTIONS & TYPES DARI FCM
import {
  Notification as ApiNotification,
  NotificationData,
  getNotifications,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from '@/lib/action/fcm/fcm';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  type: string;
  imageUrl?: string;
  actionUrl?: string;
  data?: NotificationData;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => Promise<void>;
  clearAll: () => void;
  loadFromServer: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasInitialLoad = useRef(false);

  // ✅ DEBUG: Log setiap perubahan notifications
  // useEffect(() => {
  //   console.log('🔔 Notifications updated:', {
  //     total: notifications.length,
  //     unread: notifications.filter(n => !n.read).length,
  //     notifications: notifications.map(n => ({ id: n.id, read: n.read, title: n.title }))
  //   });
  // }, [notifications]);

  const convertApiToLocalNotification = (apiNotif: ApiNotification): Notification => ({
    id: apiNotif.id,
    userId: apiNotif.userId,
    title: apiNotif.title,
    body: apiNotif.body,
    timestamp: new Date(apiNotif.createdAt),
    read: apiNotif.read,
    type: apiNotif.type,
    imageUrl: apiNotif.imageUrl,
    actionUrl: apiNotif.actionUrl,
    data: apiNotif.data,
    createdAt: apiNotif.createdAt,
    updatedAt: apiNotif.updatedAt,
  });

  // ✅ LOAD FROM SERVER - TAMBAHKAN DEBUG DETAILED
  const loadFromServer = useCallback(async (): Promise<void> => {
    try {
      // console.log('🔄 Starting loadFromServer...');
      setIsLoading(true);

      const serverNotifications = await getNotifications({ limit: 100 });
      // console.log('📥 Raw server notifications:', serverNotifications);

      const formattedNotifications: Notification[] = serverNotifications.map(
        convertApiToLocalNotification
      );

      // console.log('📨 Formatted notifications:', formattedNotifications);

      // ✅ DEBUG: Check read status dari server
      const unreadFromServer = formattedNotifications.filter(n => !n.read);
      console.log(`📊 Server data: ${unreadFromServer.length} unread from total ${formattedNotifications.length}`);

      setNotifications(formattedNotifications);
      localStorage.setItem('fcm-notifications', JSON.stringify(formattedNotifications));

      hasInitialLoad.current = true;
      // console.log('✅ loadFromServer completed');
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      // Fallback ke cache
      try {
        const cached = localStorage.getItem('fcm-notifications');
        if (cached) {
          const cachedNotifications: Notification[] = JSON.parse(cached).map((notif: Notification) => ({
            ...notif,
            timestamp: new Date(notif.timestamp),
          }));
          // console.log('📂 Loading from cache:', cachedNotifications);
          setNotifications(cachedNotifications);
          hasInitialLoad.current = true;
        }
      } catch (cacheError) {
        console.error('❌ Error loading from cache:', cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ SYNC WITH SERVER - DISABLE DULU UNTUK DEBUG
  const syncWithServer = useCallback(async (): Promise<void> => {
    // ✅ COMMENT DULU UNTUK DEBUG - HENTIKAN SEMUA SYNC OTOMATIS
    // console.log('🚫 syncWithServer disabled for debugging');
    return;

    /*
    if (isLoading || !hasInitialLoad.current || isSyncing.current) {
      console.log('⏸️ Sync skipped - loading:', isLoading, 'hasInitialLoad:', hasInitialLoad.current, 'isSyncing:', isSyncing.current);
      return;
    }

    try {
      isSyncing.current = true;
      console.log('🔄 Starting syncWithServer...', notifications);
      
      const success = await syncNotificationsWithServer(notifications);

      if (success) {
        console.log('✅ Sync successful');
      } else {
        console.error('❌ Sync failed');
      }
    } catch (error) {
      console.error('❌ Error syncing with server:', error);
    } finally {
      isSyncing.current = false;
    }
    */
  }, []);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    await loadFromServer();
  }, [loadFromServer]);

  const addNotification = useCallback((notification: Notification): void => {
    setNotifications(prev => {
      const exists = prev.find(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      return [notification, ...prev];
    });
  }, []);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    console.log('🎯 markAsRead called for:', id);

    try {
      // ✅ OPTIMISTIC UPDATE
      setNotifications(prev => {
        const updated = prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        );
        console.log('🔄 Local state updated for:', id);
        return updated;
      });

      // ✅ GUNAKAN markNotificationsAsRead DARI FCM
      const success = await markNotificationsAsRead([id]);

      if (!success) {
        throw new Error('Failed to mark as read on server');
      }

      console.log('✅ Successfully marked as read on server:', id);

    } catch (error) {
      console.error('❌ Error marking as read:', error);

      // ✅ ROLLBACK
      setNotifications(prev => {
        const rolledBack = prev.map(notif =>
          notif.id === id ? { ...notif, read: false } : notif
        );
        console.log('🔄 Rolled back local state for:', id);
        return rolledBack;
      });
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    console.log('🎯 markAllAsRead called');

    // ✅ UPDATE LOCAL STATE DULU
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      console.log('🔄 All notifications marked as read locally');
      return updated;
    });

    // ✅ GUNAKAN FUNCTION YANG SUDAH ADA
    try {
      console.log('🔄 Calling markAllNotificationsAsRead on server...');
      const success = await markAllNotificationsAsRead();

      if (success) {
        console.log('✅ Server markAllAsRead successful');
      } else {
        console.error('❌ Server markAllAsRead failed');
        // ✅ RELOAD DARI SERVER UNTUK DAPATKAN STATE YANG SEBENARNYA
        await loadFromServer();
      }
    } catch (error) {
      console.error('❌ Error in markAllAsRead:', error);
      await loadFromServer();
    }
  }, [loadFromServer]);

  const clearAll = useCallback(async (): Promise<void> => {
    try {
      console.log('🗑️ [Notifications] Clearing all notifications...');

      // ✅ OPTIMISTIC UPDATE - clear local state dulu
      setNotifications([]);
      localStorage.removeItem('fcm-notifications');

      // ✅ GUNAKAN FUNCTION DARI FCM
      const success = await clearAllNotifications();

      if (success) {
        console.log('✅ [Notifications] Successfully cleared all notifications from server');
      } else {
        console.error('❌ [Notifications] Failed to clear notifications from server');
        // Optional: reload dari server untuk sync state
        await loadFromServer();
      }

    } catch (error) {
      console.error('❌ [Notifications] Error clearing all:', error);
      // Rollback dengan reload dari server
      await loadFromServer();
    }
  }, [loadFromServer]);

  // ✅ AUTO-LOAD ON MOUNT - HANYA SEKALI
  useEffect(() => {
    if (!hasInitialLoad.current) {
      // console.log('🚀 Initial load on mount');
      loadFromServer();
    }
  }, [loadFromServer]);

  // ✅ COMMENT AUTO-SYNC UNTUK DEBUG
  /*
  useEffect(() => {
    if (hasInitialLoad.current && !isLoading && notifications.length > 0) {
      const timeoutId = setTimeout(() => {
        syncWithServer();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [notifications, isLoading, syncWithServer]);
  */

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    loadFromServer,
    syncWithServer,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};