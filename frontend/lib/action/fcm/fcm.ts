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

// ❌ helper getAccessToken DIHAPUS karena tidak lagi relevan (httpOnly)

/**
 * Mengirim FCM Token ke Backend untuk disimpan di UserSession aktif.
 */
export const saveFcmToken = async (token: string): Promise<boolean> => {
  try {
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
      },
      credentials: "include",
      body: JSON.stringify({
        fcmToken: token,
        deviceInfo: JSON.stringify(deviceInfo),
      }),
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
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
    const { limit = 50, unreadOnly = false } = options;
    const params = new URLSearchParams({
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
    });

    const response = await fetch(`${API_URL_NOTIF}?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // ✅ WAJIB: Tambahkan ini di SEMUA fetch auth
      credentials: "include",
    });

    if (!response.ok) {
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
    if (!notificationIds || notificationIds.length === 0) {
      return true;
    }

    const response = await fetch(`${API_URL_NOTIF}/mark-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ WAJIB
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return false;
      }
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
    const response = await fetch(`${API_URL_NOTIF}/mark-all-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ WAJIB
    });

    if (!response.ok) {
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
    const response = await fetch(`${API_URL_NOTIF}/${notificationId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ WAJIB
    });

    if (!response.ok) {
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
export const clearAllNotifications = async (): Promise<boolean> => {
  try {
    // ❌ HAPUS Check accessToken manual di sini, karena pasti null
    /* const accessToken = getAccessToken();
    if (!accessToken) return false; */

    console.log(
      "🔄 [Notifications] Clearing all notifications using individual delete..."
    );

    // ✅ Fungsi getNotifications di bawah ini sudah pakai credentials: include
    // Jadi jika unauthorized (401), dia akan return [] dan fungsi berhenti dengan aman.
    const notifications = await getNotifications({ limit: 100 });

    if (notifications.length === 0) {
      console.log("ℹ️ [Notifications] No notifications to clear");
      return true;
    }

    const deletePromises = notifications.map((notification) =>
      deleteNotification(notification.id)
    );

    const results = await Promise.allSettled(deletePromises);

    const successfulDeletes = results.filter(
      (result) => result.status === "fulfilled" && result.value === true
    ).length;

    return successfulDeletes > 0;
  } catch (error) {
    console.error(
      "❌ [Notifications] Error clearing all notifications:",
      error
    );
    return false;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_URL_NOTIF}/unread-count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ WAJIB
    });

    if (!response.ok) {
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
    const unreadNotifications = localNotifications.filter(
      (notif) => !notif.read
    );

    if (unreadNotifications.length === 0) {
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
    const response = await fetch(`${API_URL_NOTIF}/remove-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ WAJIB
      body: JSON.stringify({ fcmToken: token }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log("🔐 [FCM] User sudah logout - token cleanup skipped");
        return true;
      }
      return false;
    }

    console.log("✅ [FCM] Token berhasil dihapus");
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "TypeError") {
      console.log("🔐 [FCM] Network error selama logout - diabaikan");
    } else {
      console.error("❌ [FCM] Error hapus token:", error);
    }
    return false;
  }
};

// ✅ CREATE NOTIFICATION HELPER (Client side only)
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

export async function getStoredFcmToken(): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_DOMAIN}/sessions/cekToken`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ WAJIB
    });

    if (response.ok) {
      const data = await response.json();
      return data.token || null;
    }

    return null;
  } catch (error) {
    console.error("Error getting stored FCM token:", error);
    return null;
  }
}
