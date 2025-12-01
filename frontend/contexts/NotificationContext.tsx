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
}

const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialLoad = useRef(false);

  const convertApiToLocalNotification = useCallback(
    (apiNotif: ApiNotification): Notification => ({
      // make sure required fields exist; provide safe defaults
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

  // ----------------- FIXED: removed early-return guard -----------------
  const loadFromServer = useCallback(async () => {
    // previously there was: if (isLoading) return; <-- this blocks first load since isLoading initial true
    setIsLoading(true);
    try {
      // console.log("🔄 [Notifications] fetching from server...");
      const serverData = await getNotifications({ limit: 100 });
      // console.log("📥 [Notifications] raw server response:", serverData);

      const formatted = serverData.map(convertApiToLocalNotification);

      setNotifications(formatted);
      persistToLocalStorage(formatted);
      hasInitialLoad.current = true;
      // console.log(`✅ [Notifications] loaded ${formatted.length} items from server`);
    } catch (err) {
      console.error("❌ [Notifications] Server load error, using cache", err);
      const cached = loadCacheFallback();
      setNotifications(cached);
      hasInitialLoad.current = true;
      // console.log(`ℹ️ [Notifications] loaded ${cached.length} items from cache`);
    } finally {
      setIsLoading(false);
    }
  }, [convertApiToLocalNotification, loadCacheFallback, persistToLocalStorage]);

  const refreshNotifications = useCallback(async () => {
    await loadFromServer();
  }, [loadFromServer]);

  const updateLocalState = useCallback((updater: (prev: Notification[]) => Notification[]) => {
    setNotifications((prev) => {
      const updated = updater(prev);
      persistToLocalStorage(updated);
      return updated;
    });
  }, [persistToLocalStorage]);

  const addNotification = useCallback((notif: Notification) => {
    updateLocalState((prev) => {
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });
  }, [updateLocalState]);

  const syncWithServer = useCallback(async () => {
    if (!hasInitialLoad.current) return;

    // console.log("🔁 [Notifications] Syncing with server...");

    try {
      const serverData = await getNotifications({ limit: 100 });
      const formatted = serverData.map(convertApiToLocalNotification);

      setNotifications(prev => {
        const isEqual =
          prev.length === formatted.length &&
          prev.every((n, i) => n.id === formatted[i].id && n.read === formatted[i].read);

        if (isEqual) {
          // console.log("⏸ No state changes → skip update, skip re-render");
          return prev; // ⛔ prevent infinite re-render
        }

        // console.log("🔄 Updating state with new server data...");
        persistToLocalStorage(formatted);
        return formatted;
      });

      // console.log("✅ [Notifications] Sync complete");
    } catch (err) {
      console.error("❌ [Notifications] Sync failed:", err);
    }
  }, [convertApiToLocalNotification, persistToLocalStorage]);


  useEffect(() => {
    if (!hasInitialLoad.current) return;

    const handleVisibility = () => {
      if (!document.hidden) syncWithServer();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    const interval = setInterval(syncWithServer, 60000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [syncWithServer]);

  const markAsRead = useCallback(async (id: string) => {
    updateLocalState((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      const success = await markNotificationsAsRead([id]);
      if (!success) throw new Error();
    } catch {
      updateLocalState((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  }, [updateLocalState]);

  const markAllAsRead = useCallback(async () => {
    updateLocalState((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const success = await markAllNotificationsAsRead();
      if (!success) throw new Error();
    } catch {
      await loadFromServer();
    }
  }, [updateLocalState, loadFromServer]);

  const clearAll = useCallback(async () => {
    updateLocalState(() => []);

    try {
      const success = await clearAllNotifications();
      if (!success) throw new Error();
    } catch {
      await loadFromServer();
    }
  }, [updateLocalState, loadFromServer]);

  useEffect(() => {
    if (!hasInitialLoad.current) {
      loadFromServer();
    }
  }, [loadFromServer]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{
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
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be in NotificationProvider");
  return ctx;
}
