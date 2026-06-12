// frontend/lib/autoRefresh.ts
// Util untuk menyimpan accessToken di memori, refresh proaktif, dan sinkron antar tab.

interface JwtPayload {
  exp: number;
  iat?: number;
  sub?: string;
  username?: string;
  role?: string;
  [key: string]: unknown;
}

type TokenListener = (token: string | null) => void;
type AuthEvent =
  | "tokenChanged"
  | "refreshSuccess"
  | "refreshFailed"
  | "logout"
  | "healthCheck";
type AuthEventListener = (data: unknown) => void;

// State management
let accessToken: string | null = null;
let refreshTimer: number | undefined;
let refreshQueue: Promise<string | null> | null = null;
let refreshAttempts = 0;
let refreshCount = 0;
let lastRefreshTime: number | null = null;

// Listeners
const tokenListeners = new Set<TokenListener>();
const eventListeners = new Map<AuthEvent, Set<AuthEventListener>>();

// Communication
let bc: BroadcastChannel | null = null;
let isRefreshing = false;

let isLoggingOut = false;

export function startLogout() {
  isLoggingOut = true;
  cleanup(); // hentikan timer & health monitoring
}

export function endLogout() {
  isLoggingOut = false;
}

// Configuration
export const IS_CLIENT = typeof window !== "undefined";
export const PERSIST_TO_LOCALSTORAGE =
  IS_CLIENT &&
  !window.location.hostname.includes("localhost") &&
  !window.location.hostname.includes("127.0.0.1");
export const LS_KEY = "access_token";

// Constants
const MAX_REFRESH_ATTEMPTS = 3;
const BASE_DELAY = 1000; // 1 second
const DEFAULT_SKEW_MS = 45_000; // 45 seconds
const MAX_DELAY = 24 * 60 * 60 * 1000; // 24 hours
const HEALTH_CHECK_INTERVAL = 60_000; // 1 minute

// Health monitoring
let healthCheckInterval: number | undefined;

// ==================== EVENT SYSTEM ====================

export function onAuthEvent(
  event: AuthEvent,
  listener: AuthEventListener
): () => void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }

  eventListeners.get(event)!.add(listener);

  return () => {
    eventListeners.get(event)?.delete(listener);
  };
}
function setupVisibilityHandler(): void {
  if (!IS_CLIENT) return;

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      // ;((...args: any[]) => {})("🔄 App became visible, checking token health");

      // Tunggu sebentar untuk memastikan tab benar-benar aktif
      setTimeout(() => {
        const health = getTokenHealth();

        if (health.health === "expired" || health.health === "expiring_soon") {
          // ;((...args: any[]) => {})("⚠️ Token needs refresh after app wake-up");
          refreshToken().catch((error) => {
            console.error("❌ Wake-up refresh failed:", error);
          });
        } else if (
          health.health === "healthy" &&
          health.expiresIn &&
          health.expiresIn < 300
        ) {
          // Jika token masih valid tapi akan segera expired, schedule refresh
          // ;((...args: any[]) => {})("⏰ Rescheduling refresh after wake-up");
          if (accessToken) {
            scheduleProactiveRefresh(accessToken);
          }
        }
      }, 1000);
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function emitAuthEvent(event: AuthEvent, data?: unknown): void {
  if (!IS_CLIENT) return;

  const listeners = eventListeners.get(event);
  if (!listeners) return;

  // Convert to array to avoid modification during iteration
  const listenersArray = Array.from(listeners);

  for (const listener of listenersArray) {
    try {
      setTimeout(() => listener(data), 0);
    } catch (error) {
      console.error(`Error in auth event listener for ${event}:`, error);
    }
  }
}

// ==================== JWT UTILITIES ====================

export function parseJwt(token: string): JwtPayload | null {
  try {
    if (!token || typeof token !== "string" || token.split(".").length !== 3) {
      return null;
    }

    const [, payloadB64] = token.split(".");
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function parseJwtExp(token: string): number | null {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== "number") return null;

  const now = Math.floor(Date.now() / 1000);
  const leeway = 60; // 1 minute leeway for clock skew
  return payload.exp > now - leeway ? payload.exp : null;
}

/** Manual token validation dengan detailed error */
export function validateToken(token: string): {
  isValid: boolean;
  error?: string;
  expiresAt?: Date;
  claims?: JwtPayload;
} {
  // ✅ Enhanced validation
  if (!token || typeof token !== "string") {
    return { isValid: false, error: "Token is empty or not a string" };
  }

  if (token.length < 10) {
    return { isValid: false, error: "Token too short" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { isValid: false, error: "Invalid JWT format" };
  }

  try {
    const payload = parseJwt(token);
    if (!payload) {
      return { isValid: false, error: "Failed to parse JWT payload" };
    }

    if (typeof payload.exp !== "number") {
      return {
        isValid: false,
        error: "Missing expiration claim",
        claims: payload,
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const leeway = 60; // 1 minute leeway for clock skew

    if (payload.exp <= now - leeway) {
      return {
        isValid: false,
        error: "Token expired",
        expiresAt: new Date(payload.exp * 1000),
        claims: payload,
      };
    }

    return {
      isValid: true,
      expiresAt: new Date(payload.exp * 1000),
      claims: payload,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Token validation error: ${error}`,
    };
  }
}

// ==================== BROADCAST & STORAGE ====================

function startBroadcast(): void {
  if (!IS_CLIENT) return;

  if (!bc) {
    try {
      if (typeof BroadcastChannel === "undefined") {
        setupStorageFallback();
        return;
      }

      bc = new BroadcastChannel("auth");
      bc.onmessage = (e) => {
        if (e?.data?.type === "token") {
          if (e.data.token !== accessToken) {
            // ;((...args: any[]) => {})("📡 Received token broadcast");
            setAccessToken(e.data.token, {
              broadcast: false,
              schedule: true,
              persist: PERSIST_TO_LOCALSTORAGE,
            });
          }
        }
      };
    } catch (error) {
      console.warn(
        "BroadcastChannel not supported, using storage fallback",
        error
      );
      setupStorageFallback();
    }
  }
}

function setupStorageFallback(): void {
  if (!IS_CLIENT) return;

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === LS_KEY && e.newValue !== e.oldValue) {
      // ;((...args: any[]) => {})("📦 Received token from storage sync");
      setAccessToken(e.newValue, {
        broadcast: false,
        schedule: true,
        persist: false,
      });
    }
  };

  window.addEventListener("storage", handleStorageEvent);
}

// ==================== REFRESH LOGIC ====================

/** Akan dipasang dari http.ts untuk mengeksekusi refresh */
let refreshExecutor: (() => Promise<string | null>) | null = null;

export function setRefreshExecutor(fn: () => Promise<string | null>): void {
  refreshExecutor = async () => {
    try {
      return await fn();
    } catch (error) {
      console.error("Refresh executor failed:", error);
      throw error;
    }
  };
}

async function executeRefreshWithBackoff(): Promise<string | null> {
  if (!refreshExecutor) {
    console.error("❌ No refresh executor configured");
    return null;
  }

  // ✅ Circuit breaker pattern
  if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
    console.error("❌ Max refresh attempts reached, giving up");
    return null;
  }

  try {
    // ;((...args: any[]) => {})(`🔄 Attempting token refresh (attempt ${refreshAttempts + 1})`);

    const newToken = await refreshExecutor();

    if (newToken) {
      const validation = validateToken(newToken);
      if (!validation.isValid) {
        throw new Error(`Refreshed token is invalid: ${validation.error}`);
      }
    }

    refreshAttempts = 0; // Reset on success
    refreshCount++;
    lastRefreshTime = Date.now();

    emitAuthEvent("refreshSuccess", {
      newToken: !!newToken,
      timestamp: new Date().toISOString(),
      refreshCount,
      attempts: refreshAttempts + 1,
    });

    // ;((...args: any[]) => {})("✅ Token refresh successful");
    return newToken;
  } catch (error) {
    refreshAttempts++;

    // ✅ Better error classification without 'any'
    const errorMessage = error instanceof Error ? error.message : String(error);
    const responseStatus = (error as { response?: { status?: number } })
      ?.response?.status;

    const isNetworkError =
      errorMessage.includes("Network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("fetch");
    const isAuthError =
      responseStatus === 401 ||
      responseStatus === 403 ||
      errorMessage.includes("401") ||
      errorMessage.includes("403");

    // console.error(`❌ Refresh failed (attempt ${refreshAttempts}):`, {
    //   error: errorMessage,
    //   isNetworkError,
    //   isAuthError,
    // });

    emitAuthEvent("refreshFailed", {
      error: errorMessage,
      attempts: refreshAttempts,
      isNetworkError,
      isAuthError,
      timestamp: new Date().toISOString(),
    });

    // ✅ Clear token hanya untuk auth errors, bukan network errors
    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS || isAuthError) {
      if (isAuthError) {
        // console.error("🔒 Auth error detected, clearing token");
        setAccessToken(null, {
          broadcast: true,
          schedule: false,
          persist: true,
        });
      }
      return null;
    }

    const delay = Math.min(
      BASE_DELAY * Math.pow(2, refreshAttempts - 1),
      30000 // Max 30 seconds
    );

    // ;((...args: any[]) => {})(`⏳ Retrying refresh in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return executeRefreshWithBackoff();
  }
}

export async function refreshToken(): Promise<string | null> {
  if (isLoggingOut) {
    // ;((...args: any[]) => {})("⛔ Skipping refresh: user is logging out");
    return null;
  }

  if (refreshQueue) return refreshQueue;
  refreshQueue = executeRefreshWithBackoff();
  try {
    return await refreshQueue;
  } finally {
    refreshQueue = null;
  }
}

// ==================== SCHEDULING ====================

export function clearRefreshTimer(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
  }
}

/** Jadwalkan refresh ~45 detik sebelum expired */
export function scheduleProactiveRefresh(
  token: string,
  skewMs = DEFAULT_SKEW_MS
): void {
  if (!IS_CLIENT) return;
  clearRefreshTimer();

  const expSec = parseJwtExp(token);
  if (!expSec) {
    console.warn("⚠️ Cannot schedule refresh: invalid token expiration");
    return;
  }

  const expMs = expSec * 1000;
  const now = Date.now();
  const delay = Math.max(expMs - now - skewMs, 0);

  // Safety check: jika delay terlalu panjang, batasi
  const safeDelay = Math.min(delay, MAX_DELAY);

  // ;((...args: any[]) => {})(`⏰ Scheduling refresh in ${Math.round(safeDelay / 1000)}s`);

  if (safeDelay === 0 || expMs <= now) {
    // Immediate refresh needed
    // ;((...args: any[]) => {})("🔔 Token expired or about to expire, refreshing immediately");
    refreshToken().catch((error) => {
      console.error("❌ Immediate refresh failed:", error);
    });
    return;
  }

  refreshTimer = window.setTimeout(async () => {
    try {
      // ;((...args: any[]) => {})("⏰ Scheduled refresh triggered");
      await refreshToken();
    } catch (error) {
      console.error("❌ Scheduled refresh failed:", error);
    }
  }, safeDelay);
}

// ==================== HEALTH MONITORING ====================

export function startHealthMonitoring(
  intervalMs: number = HEALTH_CHECK_INTERVAL
): void {
  if (!IS_CLIENT || healthCheckInterval) return;

  // ;((...args: any[]) => {})("🏥 Starting token health monitoring");

  healthCheckInterval = window.setInterval(() => {
    const health = getTokenHealth();

    emitAuthEvent("healthCheck", {
      health: health.health,
      expiresIn: health.expiresIn,
      timestamp: new Date().toISOString(),
    });

    // ✅ Enhanced auto-refresh logic
    if (accessToken) {
      if (health.health === "expired") {
        // console.warn("🧹 Token expired, attempting refresh...");
        refreshToken().catch((error) => {
          console.error("❌ Auto-refresh failed:", error);
          // Jika refresh gagal, clear token
          setAccessToken(null, {
            broadcast: true,
            schedule: false,
            persist: true,
          });
        });
      } else if (health.health === "expiring_soon" && !refreshQueue) {
        // ;((...args: any[]) => {})("🔄 Token expiring soon, refreshing proactively");
        refreshToken().catch((error) => {
          console.error("❌ Proactive refresh failed:", error);
        });
      }
    }

    // Log health status periodically
    if (health.expiresIn !== null && health.expiresIn < 300) {
      ;((...args: any[]) => {})(`⚠️ Token expiring in ${health.expiresIn}s`);
    }
  }, intervalMs);
}

export function stopHealthMonitoring(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = undefined;
    ;((...args: any[]) => {})("🛑 Stopped token health monitoring");
  }
}

// ==================== CORE TOKEN MANAGEMENT ====================

export function getAccessToken(): string | null {
  return accessToken;
}

export function onTokenChange(fn: TokenListener): () => void {
  tokenListeners.add(fn);
  return () => tokenListeners.delete(fn);
}

function notify(token: string | null): void {
  const listenersArray = Array.from(tokenListeners);
  // ;((...args: any[]) => {})(`📢 Notifying ${listenersArray.length} token listeners`);

  for (const fn of listenersArray) {
    try {
      fn(token);
    } catch (error) {
      console.error("❌ Error in token listener:", error);
    }
  }
}

/** Set token ke memori (+ broadcast, + schedule, + optional persist) */
export function setAccessToken(
  token: string | null,
  opts: { broadcast?: boolean; schedule?: boolean; persist?: boolean } = {
    broadcast: true,
    schedule: true,
    persist: PERSIST_TO_LOCALSTORAGE,
  }
): void {
  // ✅ Improved race condition handling
  if (isLoggingOut && token !== null) {
    ;((...args: any[]) => {})("⛔ Skipping setAccessToken during logout");
    return;
  }
  if (isRefreshing && token !== null) {
    console.warn("⏸️ Token update skipped during refresh operation");
    return;
  }

  isRefreshing = true;

  try {
    // Validasi token sebelum disimpan
    if (token) {
      const validation = validateToken(token);
      if (!validation.isValid) {
        // console.warn(`❌ Token validation failed: ${validation.error}`);
        token = null;
      } else {
        ;((...args: any[]) => {})("✅ Token validated successfully");
      }
    }

    const oldToken = accessToken;
    accessToken = token;

    // Only persist if token actually changed
    if (opts.persist && token !== oldToken && IS_CLIENT) {
      try {
        if (token) {
          localStorage.setItem(LS_KEY, token);
          // ;((...args: any[]) => {})("💾 Token persisted to localStorage");
        } else {
          localStorage.removeItem(LS_KEY);
          // ;((...args: any[]) => {})("🧹 Token removed from localStorage");
        }
      } catch (error) {
        console.error("❌ localStorage error:", error);
      }
    }

    if (opts.broadcast !== false && token !== oldToken) {
      startBroadcast();
      try {
        bc?.postMessage({ type: "token", token: accessToken });
        // ;((...args: any[]) => {})("📡 Token broadcasted to other tabs");
      } catch (error) {
        console.error("❌ Broadcast error:", error);
      }
    }

    if (opts.schedule !== false && token) {
      scheduleProactiveRefresh(token);
    } else if (!token) {
      clearRefreshTimer();
      ;((...args: any[]) => {})("🛑 Refresh scheduling stopped (no token)");
    }

    if (token !== oldToken) {
      notify(accessToken);
      emitAuthEvent("tokenChanged", {
        oldToken: !!oldToken,
        newToken: !!token,
        hadToken: !!oldToken,
        hasToken: !!token,
        timestamp: new Date().toISOString(),
      });

      if (!token && oldToken) {
        // ;((...args: any[]) => {})("🚪 Logout event emitted");
        emitAuthEvent("logout", { timestamp: new Date().toISOString() });
      }
    } else {
      ;((...args: any[]) => {})("ℹ️ Token unchanged, skipping notifications");
    }
  } catch (error) {
    console.error("❌ Error in setAccessToken:", error);
  } finally {
    isRefreshing = false;
  }
}

// ==================== INITIALIZATION & CLEANUP ====================

/** Panggil di _app/layout mount untuk restore token dari storage */
export function initAuthFromStorage(): void {
  if (!IS_CLIENT) return;

  // ;((...args: any[]) => {})("🚀 Initializing auth from storage");
  startBroadcast();
  startHealthMonitoring();
  setupVisibilityHandler(); // ✅ Tambahkan ini
  setupPageLoadRecovery(); // ✅ Tambahkan ini

  if (!PERSIST_TO_LOCALSTORAGE) {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // Silent catch
    }
    return;
  }

  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      // ;((...args: any[]) => {})("🔍 Found saved token in localStorage");
      const validation = validateToken(saved);
      if (validation.isValid) {
        setAccessToken(saved, {
          broadcast: false,
          schedule: true,
          persist: true,
        });
        // ;((...args: any[]) => {})("✅ Token restored from localStorage");

        // ✅ Force health check setelah restore
        setTimeout(() => {
          const health = getTokenHealth();
          if (
            health.health === "expiring_soon" ||
            health.health === "expired"
          ) {
            // ;((...args: any[]) => {})("🔄 Token needs immediate refresh after restore");
            refreshToken().catch((error) => {
              console.error(
                "❌ Immediate refresh after restore failed:",
                error
              );
            });
          }
        }, 1000);
      } else {
        // console.warn("❌ Saved token invalid, removing:", validation.error);
        localStorage.removeItem(LS_KEY);
      }
    } else {
      ;((...args: any[]) => {})("🔍 No saved token found in localStorage");
    }
  } catch (error) {
    console.error("❌ Error initializing auth from storage:", error);
  }
}

/** Cleanup untuk mencegah memory leaks */
export function cleanup(): void {
  // ;((...args: any[]) => {})("🧹 Cleaning up auth system");
  clearRefreshTimer();
  stopHealthMonitoring();
  tokenListeners.clear();
  eventListeners.clear();
  try {
    bc?.close();
  } catch {
    // Silent catch
  }
  bc = null;
  refreshExecutor = null;
  refreshQueue = null;
  accessToken = null;
  isRefreshing = false;
  refreshAttempts = 0;
  refreshCount = 0;
  lastRefreshTime = null;
}

function setupPageLoadRecovery(): void {
  if (!IS_CLIENT) return;

  const handlePageLoad = () => {
    // Tunggu sampai DOM fully loaded
    if (document.readyState === "complete") {
      checkAndRecoverToken();
    } else {
      window.addEventListener("load", checkAndRecoverToken);
    }
  };

  const checkAndRecoverToken = () => {
    // ;((...args: any[]) => {})("🔍 Page loaded, checking token state...");

    setTimeout(() => {
      const health = getTokenHealth();
      const hasToken = !!accessToken;

      // ;((...args: any[]) => {})("📊 Token state on page load:", {
      //   hasToken,
      //   health: health.health,
      //   expiresIn: health.expiresIn,
      // });

      // Jika ada token tapi expired, coba refresh
      if (hasToken && health.health === "expired") {
        ;((...args: any[]) => {})("🔄 Token expired on page load, attempting recovery...");
        refreshToken().catch((error) => {
          console.error("❌ Page load recovery failed:", error);
        });
      }

      // Jika tidak ada token di memory tapi ada di localStorage, restore
      if (!hasToken && PERSIST_TO_LOCALSTORAGE) {
        try {
          const saved = localStorage.getItem(LS_KEY);
          if (saved) {
            const validation = validateToken(saved);
            if (validation.isValid) {
              // ;((...args: any[]) => {})("🔄 Restoring token from storage on page load");
              setAccessToken(saved, {
                broadcast: false,
                schedule: true,
                persist: true,
              });
            }
          }
        } catch (error) {
          console.error("❌ Error restoring token on page load:", error);
        }
      }
    }, 500);
  };

  // Jalankan untuk existing page load
  handlePageLoad();

  // Juga handle future page loads (SPA navigation)
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      // Reset refresh attempts saat pindah page
      refreshAttempts = 0;
    });
  }
}

// ==================== UTILITY FUNCTIONS ====================

/** Force refresh token */
export async function forceRefresh(): Promise<string | null> {
  // ;((...args: any[]) => {})("🔧 Manual force refresh requested");
  const result = await refreshToken();
  return result;
}

/** Cek jika token masih valid */
export function isTokenValid(): boolean {
  if (!accessToken) return false;
  return parseJwtExp(accessToken) !== null;
}

/** Dapatkan waktu kedaluwarsa token */
export function getTokenExpiration(): number | null {
  if (!accessToken) return null;
  return parseJwtExp(accessToken);
}

/** Check token health status */
export function getTokenHealth(): {
  isValid: boolean;
  expiresIn: number | null;
  willAutoRefresh: boolean;
  health: "healthy" | "expiring_soon" | "expired" | "invalid";
  refreshMetrics: {
    count: number;
    lastRefresh: Date | null;
    attempts: number;
  };
} {
  if (!accessToken) {
    return {
      isValid: false,
      expiresIn: null,
      willAutoRefresh: false,
      health: "invalid",
      refreshMetrics: {
        count: refreshCount,
        lastRefresh: lastRefreshTime ? new Date(lastRefreshTime) : null,
        attempts: refreshAttempts,
      },
    };
  }

  const exp = parseJwtExp(accessToken);
  if (!exp) {
    return {
      isValid: false,
      expiresIn: null,
      willAutoRefresh: false,
      health: "expired",
      refreshMetrics: {
        count: refreshCount,
        lastRefresh: lastRefreshTime ? new Date(lastRefreshTime) : null,
        attempts: refreshAttempts,
      },
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = exp - now;

  let health: "healthy" | "expiring_soon" | "expired" | "invalid";
  if (expiresIn <= 0) {
    health = "expired";
  } else if (expiresIn <= 300) {
    // 5 minutes
    health = "expiring_soon";
  } else {
    health = "healthy";
  }

  const willAutoRefresh = expiresIn > DEFAULT_SKEW_MS / 1000;

  return {
    isValid: true,
    expiresIn,
    willAutoRefresh,
    health,
    refreshMetrics: {
      count: refreshCount,
      lastRefresh: lastRefreshTime ? new Date(lastRefreshTime) : null,
      attempts: refreshAttempts,
    },
  };
}

/** Extract claims dari token */
export function getTokenClaims(): JwtPayload | null {
  if (!accessToken) return null;
  return parseJwt(accessToken);
}

/** Cek jika user memiliki role tertentu */
export function hasRole(role: string): boolean {
  const claims = getTokenClaims();
  return claims?.role === role;
}

/** Cek jika user memiliki salah satu dari roles yang diberikan */
export function hasAnyRole(roles: string[]): boolean {
  const claims = getTokenClaims();
  return roles.some((role) => claims?.role === role);
}

/** Dapatkan metrics refresh */
export function getRefreshMetrics() {
  return {
    refreshCount,
    lastRefreshTime: lastRefreshTime ? new Date(lastRefreshTime) : null,
    refreshAttempts,
    queueSize: refreshQueue ? 1 : 0,
    isRefreshing,
    health: getTokenHealth(),
  };
}

// ==================== DEBUG UTILITIES ====================

/** Reset state untuk testing */
export function _resetForTesting(): void {
  cleanup();
  refreshAttempts = 0;
  refreshCount = 0;
  lastRefreshTime = null;
}

/** Debug function untuk melihat internal state */
export function _debugState() {
  return {
    accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
    tokenListeners: tokenListeners.size,
    eventListeners: Array.from(eventListeners.entries()).map(
      ([event, listeners]) => ({
        event,
        count: listeners.size,
      })
    ),
    refreshMetrics: getRefreshMetrics(),
    broadcastChannel: bc ? "active" : "inactive",
    healthCheck: healthCheckInterval ? "active" : "inactive",
  };
}
