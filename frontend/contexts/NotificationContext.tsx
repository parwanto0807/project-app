// contexts/NotificationContext.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";

import {
  Notification as ApiNotification,
  NotificationData,
  getNotifications,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from "@/lib/action/fcm/fcm";

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
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  loadFromServer: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  stopAllNotificationOperations: () => void; // 🔥 NEW
}

const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialLoad = useRef(false);
  const isMountedRef = useRef(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🔥 NEW: Flags untuk kontrol
  const shouldSkipOperationsRef = useRef(false);
  const logoutInProgressRef = useRef(false);

  // 🔥 NEW: Function untuk stop semua operations
  const stopAllNotificationOperations = useCallback(() => {
    console.log('[Notifications] 🛑 Stopping all operations');

    logoutInProgressRef.current = true;
    shouldSkipOperationsRef.current = true;

    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Clear state
    setNotifications([]);
    setIsLoading(false);

    // Auto reset setelah 30 detik
    setTimeout(() => {
      logoutInProgressRef.current = false;
      shouldSkipOperationsRef.current = false;
    }, 30000);
  }, []);

  // 🔥 NEW: Function untuk cek apakah boleh operasi
  const shouldProceed = useCallback(() => {
    return (
      isMountedRef.current &&
      !logoutInProgressRef.current &&
      !shouldSkipOperationsRef.current &&
      !window.location.pathname.includes('/auth/login')
    );
  }, []);

  const convertApiToLocalNotification = useCallback(
    (apiNotif: ApiNotification): Notification => ({
      id: apiNotif.id ?? `srv-${Date.now()}`,
      userId: apiNotif.userId ?? "",
      title: apiNotif.title ?? "",
      body: apiNotif.body ?? "",
      timestamp: apiNotif.createdAt ? new Date(apiNotif.createdAt) : new Date(),
      read: typeof apiNotif.read === "boolean" ? apiNotif.read : false,
      type: apiNotif.type ?? "general",
      imageUrl: apiNotif.imageUrl,
      actionUrl: apiNotif.actionUrl,
      data: apiNotif.data,
      createdAt: apiNotif.createdAt ?? new Date().toISOString(),
      updatedAt: apiNotif.updatedAt ?? new Date().toISOString(),
    }),
    []
  );

  const persistToLocalStorage = useCallback((data: Notification[]) => {
    try {
      localStorage.setItem("fcm-notifications", JSON.stringify(data));
    } catch (error) {
      console.error("❌ Failed to persist notifications:", error);
    }
  }, []);

  const loadCacheFallback = useCallback((): Notification[] => {
    try {
      const cached = localStorage.getItem("fcm-notifications");
      if (!cached) return [];

      return JSON.parse(cached).map((notif: Notification) => ({
        ...notif,
        timestamp: new Date(notif.timestamp),
      }));
    } catch (err) {
      console.error("❌ Failed to load cache notifications:", err);
      return [];
    }
  }, []);

  // 🔥 PERBAIKAN: loadFromServer dengan auth check
  const loadFromServer = useCallback(async () => {
    // 🔥 SKIP JIKA SEDANG LOGOUT ATAU DI LOGIN PAGE
    if (!shouldProceed()) {
      console.log('[Notifications] ⏸️ Skipping load - logout in progress or on login page');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔄 [Notifications] fetching from server...");
      const serverData = await getNotifications({ limit: 100 });

      // 🔥 CHECK: Jika unauthorized, stop operations
      if (serverData === null || (Array.isArray(serverData) && serverData.length === 0)) {
        console.log('[Notifications] ⚠️ Unauthorized or empty response');

        // Clear cache dan stop polling jika unauthorized
        setNotifications([]);
        persistToLocalStorage([]);

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        setIsLoading(false);
        return;
      }

      const formatted = serverData.map(convertApiToLocalNotification);

      setNotifications(formatted);
      persistToLocalStorage(formatted);
      hasInitialLoad.current = true;

      console.log(`✅ [Notifications] loaded ${formatted.length} items from server`);
    } catch (err) {
      console.error("❌ [Notifications] Server load error, using cache", err);

      // 🔥 SKIP CACHE JIKA SEDANG LOGOUT
      if (!logoutInProgressRef.current) {
        const cached = loadCacheFallback();
        setNotifications(cached);
        hasInitialLoad.current = true;
        console.log(`ℹ️ [Notifications] loaded ${cached.length} items from cache`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [convertApiToLocalNotification, loadCacheFallback, persistToLocalStorage, shouldProceed]);

  const refreshNotifications = useCallback(async () => {
    // 🔥 SKIP JIKA TIDAK BOLEH
    if (!shouldProceed()) return;
    await loadFromServer();
  }, [loadFromServer, shouldProceed]);

  const updateLocalState = useCallback((updater: (prev: Notification[]) => Notification[]) => {
    // 🔥 SKIP JIKA SEDANG LOGOUT
    if (logoutInProgressRef.current) return;

    setNotifications((prev) => {
      const updated = updater(prev);
      persistToLocalStorage(updated);
      return updated;
    });
  }, [persistToLocalStorage]);

  const addNotification = useCallback((notif: Notification) => {
    if (!shouldProceed()) return;

    updateLocalState((prev) => {
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });
  }, [updateLocalState, shouldProceed]);

  // 🔥 PERBAIKAN: syncWithServer dengan proper cleanup
  const syncWithServer = useCallback(async () => {
    if (!shouldProceed() || !hasInitialLoad.current) return;

    console.log("🔁 [Notifications] Syncing with server...");

    try {
      const serverData = await getNotifications({ limit: 100 });

      // 🔥 CHECK: Jika unauthorized, stop sync
      if (serverData === null) {
        console.log('[Notifications] ⚠️ Unauthorized during sync');
        stopAllNotificationOperations();
        return;
      }

      const formatted = serverData.map(convertApiToLocalNotification);

      setNotifications(prev => {
        const isEqual =
          prev.length === formatted.length &&
          prev.every((n, i) => n.id === formatted[i].id && n.read === formatted[i].read);

        if (isEqual) {
          return prev;
        }

        persistToLocalStorage(formatted);
        return formatted;
      });

      console.log("✅ [Notifications] Sync complete");
    } catch (err) {
      console.error("❌ [Notifications] Sync failed:", err);

      // 🔥 JIKA 401 ERROR, STOP POLLING
      if (err && typeof err === 'object' && 'response' in err) {
        const errorWithResponse = err as { response?: { status?: number } };
        if (errorWithResponse.response?.status === 401) {
          console.log('[Notifications] 🔒 401 detected, stopping polling');
          stopAllNotificationOperations();
        }
      }
    }
  }, [convertApiToLocalNotification, persistToLocalStorage, shouldProceed, stopAllNotificationOperations]);

  // 🔥 PERBAIKAN: useEffect dengan proper cleanup
  useEffect(() => {
    isMountedRef.current = true;
    logoutInProgressRef.current = false;
    shouldSkipOperationsRef.current = false;

    // 🔥 TUNDA INITIAL LOAD - tunggu auth check selesai
    const initialLoadTimer = setTimeout(() => {
      if (isMountedRef.current && !hasInitialLoad.current) {
        loadFromServer();
      }
    }, 1000); // Delay 1 detik

    // Setup polling hanya jika authenticated
    const setupPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // 🔥 ONLY POLL JIKA BOLEH
      if (shouldProceed()) {
        pollingIntervalRef.current = setInterval(() => {
          if (shouldProceed()) {
            syncWithServer();
          }
        }, 60000); // 1 menit
      }
    };

    // Visibility change handler
    const handleVisibility = () => {
      if (!document.hidden && shouldProceed()) {
        syncWithServer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    // Setup polling setelah delay
    const pollingTimer = setTimeout(setupPolling, 2000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialLoadTimer);
      clearTimeout(pollingTimer);

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadFromServer, syncWithServer, shouldProceed]);

  const markAsRead = useCallback(async (id: string) => {
    if (!shouldProceed()) return;

    updateLocalState((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      const success = await markNotificationsAsRead([id]);
      if (!success) throw new Error();
    } catch {
      // Rollback hanya jika masih mounted dan tidak logout
      if (isMountedRef.current && !logoutInProgressRef.current) {
        updateLocalState((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: false } : n))
        );
      }
    }
  }, [updateLocalState, shouldProceed]);

  const markAllAsRead = useCallback(async () => {
    if (!shouldProceed()) return;

    updateLocalState((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const success = await markAllNotificationsAsRead();
      if (!success) throw new Error();
    } catch {
      await loadFromServer();
    }
  }, [updateLocalState, loadFromServer, shouldProceed]);

  const clearAll = useCallback(async () => {
    if (!shouldProceed()) return;

    updateLocalState(() => []);

    try {
      const success = await clearAllNotifications();
      if (!success) throw new Error();
    } catch {
      await loadFromServer();
    }
  }, [updateLocalState, loadFromServer, shouldProceed]);

  // 🔥 LISTENER UNTUK LOGOUT EVENT
  useEffect(() => {
    const handleLogout = () => {
      console.log('[Notifications] Received logout event');
      stopAllNotificationOperations();
    };

    // Listen untuk custom logout event
    window.addEventListener('app:logout', handleLogout);

    return () => {
      window.removeEventListener('app:logout', handleLogout);
    };
  }, [stopAllNotificationOperations]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(() => ({
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
    stopAllNotificationOperations, // 🔥 EXPORT
  }), [
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
    stopAllNotificationOperations,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be in NotificationProvider");
  return ctx;
}