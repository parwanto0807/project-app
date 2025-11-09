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
type AuthEvent = "tokenChanged" | "refreshSuccess" | "refreshFailed" | "logout";
type AuthEventListener = (data: unknown) => void;

// State management
let accessToken: string | null = null;
let refreshTimer: number | undefined;
let refreshQueue: Promise<string | null> | null = null;
let refreshAttempts = 0;

// Listeners
const tokenListeners = new Set<TokenListener>();
const eventListeners = new Map<AuthEvent, Set<AuthEventListener>>();

// Communication
let bc: BroadcastChannel | null = null;
let isRefreshing = false;

// Configuration
const IS_CLIENT = typeof window !== "undefined";
const PERSIST_TO_LOCALSTORAGE =
  IS_CLIENT &&
  !window.location.hostname.includes("localhost") &&
  !window.location.hostname.includes("127.0.0.1");
const LS_KEY = "access_token";

// Constants
const MAX_REFRESH_ATTEMPTS = 3;
const BASE_DELAY = 1000; // 1 second
const DEFAULT_SKEW_MS = 45_000; // 45 seconds
const MAX_DELAY = 24 * 60 * 60 * 1000; // 24 hours

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

function emitAuthEvent(event: AuthEvent, data?: unknown): void {
  eventListeners.get(event)?.forEach((listener) => {
    try {
      listener(data);
    } catch (error) {
      console.error(`Error in auth event listener for ${event}:`, error);
    }
  });
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
  return payload.exp > now ? payload.exp : null;
}

/** Manual token validation dengan detailed error */
export function validateToken(token: string): {
  isValid: boolean;
  error?: string;
  expiresAt?: Date;
} {
  const payload = parseJwt(token);
  if (!payload) {
    return { isValid: false, error: "Invalid JWT format" };
  }

  if (typeof payload.exp !== "number") {
    return { isValid: false, error: "Missing expiration claim" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return {
      isValid: false,
      error: "Token expired",
      expiresAt: new Date(payload.exp * 1000),
    };
  }

  return {
    isValid: true,
    expiresAt: new Date(payload.exp * 1000),
  };
}

// ==================== BROADCAST & STORAGE ====================

function startBroadcast() {
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
            setAccessToken(e.data.token, {
              broadcast: false,
              schedule: true,
              persist: PERSIST_TO_LOCALSTORAGE,
            });
          }
        }
      };
    } catch {
      setupStorageFallback();
    }
  }
}

function setupStorageFallback() {
  if (!IS_CLIENT) return;

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === LS_KEY && e.newValue !== e.oldValue) {
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

export function setRefreshExecutor(fn: () => Promise<string | null>) {
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
    return null;
  }

  try {
    const newToken = await refreshExecutor();
    refreshAttempts = 0; // Reset on success
    emitAuthEvent("refreshSuccess", { newToken: !!newToken });
    return newToken;
  } catch (error) {
    refreshAttempts++;

    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      emitAuthEvent("refreshFailed", { error, attempts: refreshAttempts });
      setAccessToken(null, {
        broadcast: true,
        schedule: false,
        persist: true,
      });
      return null;
    }

    const delay = BASE_DELAY * Math.pow(2, refreshAttempts - 1);

    await new Promise((resolve) => setTimeout(resolve, delay));
    return executeRefreshWithBackoff();
  }
}

export async function refreshToken(): Promise<string | null> {
  if (refreshQueue) {
    return refreshQueue;
  }

  refreshQueue = executeRefreshWithBackoff();

  try {
    const result = await refreshQueue;
    return result;
  } finally {
    refreshQueue = null;
  }
}

// ==================== SCHEDULING ====================

export function clearRefreshTimer() {
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
    return;
  }

  const expMs = expSec * 1000;
  const now = Date.now();
  const delay = Math.max(expMs - now - skewMs, 0);

  // Safety check: jika delay terlalu panjang, batasi
  const safeDelay = Math.min(delay, MAX_DELAY);

  if (safeDelay === 0 || expMs <= now) {
    // Immediate refresh needed
    refreshToken().catch((error) => {
      console.error("Immediate refresh failed:", error);
    });
    return;
  }

  refreshTimer = window.setTimeout(async () => {
    try {
      await refreshToken();
    } catch (error) {
      console.error("Scheduled refresh failed:", error);
    }
  }, safeDelay);
}

// ==================== CORE TOKEN MANAGEMENT ====================

export function getAccessToken(): string | null {
  return accessToken;
}

export function onTokenChange(fn: TokenListener) {
  tokenListeners.add(fn);
  return () => tokenListeners.delete(fn);
}

function notify(token: string | null) {
  const listenersArray = Array.from(tokenListeners);
  for (const fn of listenersArray) {
    try {
      fn(token);
    } catch (error) {
      console.error("Error in token listener:", error);
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
  if (isRefreshing) {
    return;
  }

  isRefreshing = true;

  try {
    // Validasi token sebelum disimpan
    if (token) {
      const validation = validateToken(token);
      if (!validation.isValid) {
        token = null;
      }
    }

    const oldToken = accessToken;
    accessToken = token;

    // Only persist if token actually changed
    if (opts.persist && token !== oldToken && IS_CLIENT) {
      try {
        if (token) {
          localStorage.setItem(LS_KEY, token);
        } else {
          localStorage.removeItem(LS_KEY);
        }
      } catch {
        // Silent catch
      }
    }

    if (opts.broadcast !== false && token !== oldToken) {
      startBroadcast();
      try {
        bc?.postMessage({ type: "token", token: accessToken });
      } catch {
        // Silent catch
      }
    }

    if (opts.schedule !== false && token) {
      scheduleProactiveRefresh(token);
    } else if (!token) {
      clearRefreshTimer();
    }

    if (token !== oldToken) {
      notify(accessToken);
      emitAuthEvent("tokenChanged", {
        oldToken: !!oldToken,
        newToken: !!token,
        hadToken: !!oldToken,
        hasToken: !!token,
      });

      if (!token && oldToken) {
        emitAuthEvent("logout");
      }
    }
  } catch (error) {
    console.error("Error in setAccessToken:", error);
  } finally {
    isRefreshing = false;
  }
}

// ==================== INITIALIZATION & CLEANUP ====================

/** Panggil di _app/layout mount untuk restore token dari storage */
export function initAuthFromStorage(): void {
  if (!IS_CLIENT) return;

  startBroadcast();

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
      const validation = validateToken(saved);
      if (validation.isValid) {
        setAccessToken(saved, {
          broadcast: false,
          schedule: true,
          persist: true,
        });
      } else {
        localStorage.removeItem(LS_KEY);
      }
    }
  } catch {
    // Silent catch
  }
}

/** Cleanup untuk mencegah memory leaks */
export function cleanup(): void {
  clearRefreshTimer();
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
}

// ==================== UTILITY FUNCTIONS ====================

/** Force refresh token */
export async function forceRefresh(): Promise<string | null> {
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
} {
  if (!accessToken) {
    return {
      isValid: false,
      expiresIn: null,
      willAutoRefresh: false,
      health: "invalid",
    };
  }

  const exp = parseJwtExp(accessToken);
  if (!exp) {
    return {
      isValid: false,
      expiresIn: null,
      willAutoRefresh: false,
      health: "expired",
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

// ==================== DEBUG UTILITIES ====================

/** Reset state untuk testing */
export function _resetForTesting(): void {
  cleanup();
  refreshAttempts = 0;
}
