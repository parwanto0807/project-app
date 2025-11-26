// lib/action/fcm/fcm.ts

const BASE_DOMAIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${BASE_DOMAIN}/sessions/update-session-fcm`;
const API_URL_NOTIF = `${BASE_DOMAIN}/api/notifications`;

// ✅ DEFINE PROPER TYPES
export interface NotificationData {
  type?: string;
  productId?: string;
  productCode?: string;
  orderId?: string;
  userId?: string;
  [key: string]: string | undefined;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  imageUrl?: string;
  actionUrl?: string;
  data?: NotificationData;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface GetNotificationsOptions {
  limit?: number;
  unreadOnly?: boolean;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  count?: number;
  notifications?: Notification[];
}

export interface DeviceInfo {
  platform: string;
  userAgent: string;
  timestamp: string;
}

/**
 * Mendapatkan access token dari cookies
 */
const getAccessToken = (): string | null => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const accessTokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("accessTokenReadable=")
  );

  if (accessTokenCookie) {
    return accessTokenCookie.split("=")[1];
  }

  return null;
};

/**
 * Mengirim FCM Token ke Backend untuk disimpan di UserSession aktif.
 */
export const saveFcmToken = async (token: string): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.warn(
        "⚠️ [FCM] Access token tidak ditemukan - user mungkin sedang logout"
      );
      return false; // Return false tanpa error
    }

    console.log("✅ [FCM] Access token ditemukan, mengirim FCM token...");

    const deviceInfo: DeviceInfo = {
      platform: typeof window !== "undefined" ? "web" : "unknown",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({
        fcmToken: token,
        deviceInfo: JSON.stringify(deviceInfo),
      }),
    });

    if (!response.ok) {
      // ✅ JANGAN LOG ERROR JIKA STATUS 401 (UNAUTHORIZED)
      if (response.status === 401) {
        console.warn("⚠️ [FCM] User unauthorized - mungkin sedang logout");
        return false;
      }

      const errorData = await response.json().catch(() => ({}));
      console.error("❌ [FCM] Gagal simpan token:", errorData);
      return false;
    }

    const result = await response.json();
    console.log("✅ [FCM] Token berhasil disinkronkan:", result);
    return true;
  } catch (error) {
    // ✅ JANGAN LOG ERROR JIKA INI ADALAH NETWORK ERROR SAAT LOGOUT
    if (error instanceof Error && error.name === "TypeError") {
      console.warn("⚠️ [FCM] Network error - mungkin sedang logout");
    } else {
      console.error("❌ [FCM] Error koneksi backend:", error);
    }
    return false;
  }
};

// ✅ API FUNCTIONS UNTUK NOTIFICATIONS

/**
 * Mendapatkan notifications dari server
 */
export const getNotifications = async (
  options: GetNotificationsOptions = {}
): Promise<Notification[]> => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.warn(
        "⚠️ [Notifications] Access token tidak ditemukan - return empty"
      );
      return [];
    }

    const { limit = 50, unreadOnly = false } = options;
    const params = new URLSearchParams({
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
    });

    const response = await fetch(`${API_URL_NOTIF}?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // ✅ HANDLE UNAUTHORIZED GRACEFULLY
      if (response.status === 401) {
        console.warn("⚠️ [Notifications] Unauthorized - return empty");
        return [];
      }
      console.warn(`⚠️ [Notifications] Gagal mengambil: ${response.status}`);
      return [];
    }

    const notifications: Notification[] = await response.json();
    return notifications;
  } catch (error) {
    console.warn("⚠️ [Notifications] Error:", error);
    return [];
  }
};

/**
 * Mark notifications sebagai read
 */
export const markNotificationsAsRead = async (
  notificationIds: string[]
): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.warn(
        "⚠️ [Notifications] Access token tidak ditemukan - skip mark read"
      );
      return false;
    }

    if (!notificationIds || notificationIds.length === 0) {
      return true;
    }

    const response = await fetch(`${API_URL_NOTIF}/mark-read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("⚠️ [Notifications] Unauthorized - skip mark read");
        return false;
      }
      console.warn(`⚠️ [Notifications] Gagal mark read: ${response.status}`);
      return false;
    }

    const result: { success: boolean } = await response.json();
    return result.success;
  } catch (error) {
    console.warn("⚠️ [Notifications] Error mark as read:", error);
    return false;
  }
};

/**
 * Mark semua notifications sebagai read
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.warn(
        "⚠️ [Notifications] Access token tidak ditemukan - skip mark all"
      );
      return false;
    }

    const response = await fetch(`${API_URL_NOTIF}/mark-all-read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("⚠️ [Notifications] Unauthorized - skip mark all");
        return false;
      }
      console.warn(`⚠️ [Notifications] Gagal mark all: ${response.status}`);
      return false;
    }

    const result: { success: boolean } = await response.json();
    return result.success;
  } catch (error) {
    console.warn("⚠️ [Notifications] Error mark all as read:", error);
    return false;
  }
};

/**
 * Hapus notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.warn(
        "⚠️ [Notifications] Access token tidak ditemukan - skip delete"
      );
      return false;
    }

    const response = await fetch(`${API_URL_NOTIF}/${notificationId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("⚠️ [Notifications] Unauthorized - skip delete");
        return false;
      }
      return false;
    }

    return true;
  } catch (error) {
    console.warn("⚠️ [Notifications] Error delete:", error);
    return false;
  }
};

/**
 * Hapus semua notifications
 */
// lib/action/fcm/fcm.ts - PERBAIKI clearAllNotifications
export const clearAllNotifications = async (): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.warn("⚠️ [Notifications] Access token tidak ditemukan");
      return false;
    }

    console.log("🔄 [Notifications] Clearing all notifications using individual delete...");

    // ✅ DAPATKAN SEMUA NOTIFICATIONS
    const notifications = await getNotifications({ limit: 100 });
    
    if (notifications.length === 0) {
      console.log("ℹ️ [Notifications] No notifications to clear");
      return true;
    }

    console.log(`🗑️ [Notifications] Deleting ${notifications.length} notifications...`);

    // ✅ HAPUS SATU PER SATU
    const deletePromises = notifications.map(notification => 
      deleteNotification(notification.id)
    );

    const results = await Promise.allSettled(deletePromises);
    
    const successfulDeletes = results.filter(result => 
      result.status === 'fulfilled' && result.value === true
    ).length;

    console.log(`✅ [Notifications] Successfully deleted ${successfulDeletes} out of ${notifications.length} notifications`);
    
    // Return true jika berhasil menghapus setidaknya satu notifikasi
    return successfulDeletes > 0;
    
  } catch (error) {
    console.error("❌ [Notifications] Error clearing all notifications:", error);
    return false;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return 0; // Return 0 tanpa warning
    }

    const response = await fetch(`${API_URL_NOTIF}/unread-count`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return 0;
      }
      return 0;
    }

    const result: { count: number } = await response.json();
    return result.count;
  } catch (error) {
    console.error("❌ [Notifications] Error Read count:", error);
    return 0;
  }
};

/**
 * Sync local notifications dengan server
 */
export const syncNotificationsWithServer = async (
  localNotifications: Notification[]
): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.error("❌ [Notifications] Access token tidak ditemukan");
      return false;
    }

    // Cari notifications yang belum di-mark as read di server
    const unreadNotifications = localNotifications.filter(
      (notif) => !notif.read
    );

    if (unreadNotifications.length === 0) {
      console.log("ℹ️ [Notifications] No unread notifications to sync");
      return true;
    }

    const notificationIds = unreadNotifications
      .map((notif) => notif.id)
      .filter(Boolean);

    if (notificationIds.length > 0) {
      return await markNotificationsAsRead(notificationIds);
    }

    return true;
  } catch (error) {
    console.error("❌ [Notifications] Error sync with server:", error);
    return false;
  }
};

export const removeFcmToken = async (token: string): Promise<boolean> => {
  try {
    const accessToken = getAccessToken();

    // ✅ JIKA SUDAH TIDAK ADA ACCESS TOKEN, LANGSUNG RETURN TRUE
    if (!accessToken) {
      console.log("🔐 [FCM] User sudah logout - skip remove token");
      return true;
    }

    console.log("🔐 [FCM] Menghapus FCM token saat logout...");

    const response = await fetch(`${API_URL_NOTIF}/remove-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ fcmToken: token }),
    });

    // ✅ JANGAN THROW ERROR JIKA UNAUTHORIZED (SUDAH LOGOUT)
    if (!response.ok) {
      if (response.status === 401) {
        console.log("🔐 [FCM] User sudah logout - token cleanup skipped");
        return true;
      }
      console.warn("⚠️ [FCM] Gagal hapus token:", response.status);
      return false;
    }

    console.log("✅ [FCM] Token berhasil dihapus");
    return true;
  } catch (error) {
    // ✅ JANGAN LOG ERROR UNTUK NETWORK ISSUES SAAT LOGOUT
    if (error instanceof Error && error.name === "TypeError") {
      console.log("🔐 [FCM] Network error selama logout - diabaikan");
    } else {
      console.error("❌ [FCM] Error hapus token:", error);
    }
    return false;
  }
};

// ✅ CREATE NOTIFICATION HELPER
export const createNotification = (data: {
  id?: string;
  title: string;
  body: string;
  type?: string;
  userId?: string;
  imageUrl?: string;
  actionUrl?: string;
  data?: NotificationData;
}): Notification => {
  const now = new Date().toISOString();

  return {
    id:
      data.id ||
      `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: data.userId || "unknown",
    title: data.title,
    body: data.body,
    type: data.type || "general",
    read: false,
    createdAt: now,
    updatedAt: now,
    imageUrl: data.imageUrl,
    actionUrl: data.actionUrl,
    data: data.data,
  };
};

// ✅ TYPE GUARDS
export const isNotification = (obj: unknown): obj is Notification => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "userId" in obj &&
    "title" in obj &&
    "body" in obj &&
    "type" in obj &&
    "read" in obj &&
    "createdAt" in obj
  );
};

export const isNotificationArray = (obj: unknown): obj is Notification[] => {
  return Array.isArray(obj) && obj.every(isNotification);
};
