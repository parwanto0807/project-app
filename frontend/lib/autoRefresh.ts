// frontend/lib/autoRefresh.ts
// Util untuk menyimpan accessToken di memori, refresh proaktif, dan sinkron antar tab.

type TokenListener = (token: string | null) => void;

let accessToken: string | null = null;
let refreshTimer: number | undefined;
const listeners = new Set<TokenListener>();
let bc: BroadcastChannel | null = null;
let isRefreshing = false;

// Hanya persist di production untuk keamanan
const PERSIST_TO_LOCALSTORAGE = 
  typeof window !== "undefined" && 
  !window.location.hostname.includes("localhost") &&
  !window.location.hostname.includes("127.0.0.1");
const LS_KEY = "access_token";

function startBroadcast() {
  if (typeof window === "undefined") return;
  
  if (!bc) {
    try {
      // Test BroadcastChannel support
      if (typeof BroadcastChannel === "undefined") {
        setupStorageFallback();
        return;
      }
      
      bc = new BroadcastChannel("auth");
      bc.onmessage = (e) => {
        if (e?.data?.type === "token") {
          // Prevent infinite loop - hanya proses jika token berbeda
          if (e.data.token !== accessToken) {
            setAccessToken(e.data.token, {
              broadcast: false,
              schedule: true,
              persist: PERSIST_TO_LOCALSTORAGE,
            });
          }
        }
      };
      
    } catch (error) {
      console.warn("BroadcastChannel failed, using storage fallback:", error);
      setupStorageFallback();
    }
  }
}

function setupStorageFallback() {
  if (typeof window === "undefined") return;
  
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === LS_KEY && e.newValue !== e.oldValue) {
      setAccessToken(e.newValue, { 
        broadcast: false, 
        schedule: true, 
        persist: false // Already in storage
      });
    }
  };
  
  window.addEventListener("storage", handleStorageEvent);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function onTokenChange(fn: TokenListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(token: string | null) {
  // Use Array.from to avoid issues if listeners change during iteration
  const listenersArray = Array.from(listeners);
  for (const fn of listenersArray) {
    try {
      fn(token);
    } catch (error) {
      console.error("Error in token listener:", error);
    }
  }
}

export function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
  }
}

function parseJwtExp(token: string): number | null {
  try {
    // Validasi format token lebih ketat
    if (!token || typeof token !== "string" || token.split(".").length !== 3) {
      return null;
    }

    const [, payloadB64] = token.split(".");
    // Handle base64 URL encoding
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    
    const json = JSON.parse(atob(padded));

    // Validasi exp exists dan merupakan masa depan
    if (typeof json.exp !== "number") return null;
    
    const now = Math.floor(Date.now() / 1000);
    if (json.exp <= now) {
      console.warn("Token already expired");
      return null;
    }

    return json.exp;
  } catch (error) {
    console.warn("Failed to parse JWT exp:", error);
    return null;
  }
}

/** Akan dipasang dari http.ts untuk mengeksekusi refresh */
let refreshExecutor: (() => Promise<string | null>) | null = null;
export function setRefreshExecutor(fn: () => Promise<string | null>) {
  refreshExecutor = fn;
}

/** Jadwalkan refresh ~45 detik sebelum expired */
export function scheduleProactiveRefresh(token: string, skewMs = 45_000) {
  if (typeof window === "undefined") return;
  clearRefreshTimer();

  const expSec = parseJwtExp(token);
  if (!expSec) {
    console.warn("Cannot schedule refresh: invalid token expiration");
    return;
  }

  const expMs = expSec * 1000;
  const now = Date.now();
  const delay = Math.max(expMs - now - skewMs, 0);

  // Jika token sudah expired atau hampir expired
  if (delay === 0 || expMs <= now) {
    console.warn("Token expired or about to expire, refreshing immediately");
    if (refreshExecutor) {
      refreshExecutor().catch(error => {
        console.error("Immediate refresh failed:", error);
      });
    }
    return;
  }

  console.log(`Scheduling token refresh in ${Math.round(delay / 1000)} seconds`);
  
  refreshTimer = window.setTimeout(async () => {
    if (!refreshExecutor) {
      console.warn("No refresh executor available");
      return;
    }

    try {
      const newToken = await refreshExecutor();
      if (!newToken) {
        console.warn("Token refresh failed - no new token received");
        // refresh gagal → biarkan flow 401 di interceptor yang handle
        return;
      }
      // token baru akan di-set oleh http.ts lewat setAccessToken
    } catch (error) {
      console.error("Token refresh error:", error);
    }
  }, delay);
}

/** Set token ke memori (+ broadcast, + schedule, + optional persist) */
export function setAccessToken(
  token: string | null,
  opts: { broadcast?: boolean; schedule?: boolean; persist?: boolean } = { 
    broadcast: true, schedule: true, persist: PERSIST_TO_LOCALSTORAGE 
  }
) {
  // Prevent race conditions
  if (isRefreshing) {
    console.warn("Token update in progress, skipping concurrent update");
    return;
  }

  isRefreshing = true;

  try {
    // Validasi token sebelum disimpan
    if (token) {
      const isValid = parseJwtExp(token) !== null;
      if (!isValid) {
        console.warn("Invalid JWT token, treating as logout");
        token = null;
      }
    }

    const oldToken = accessToken;
    accessToken = token;

    // Only persist if token actually changed
    if (opts.persist && token !== oldToken) {
      try {
        if (token) {
          localStorage.setItem(LS_KEY, token);
        } else {
          localStorage.removeItem(LS_KEY);
        }
      } catch (error) {
        console.warn("Failed to persist token to localStorage:", error);
      }
    }

    if (opts.broadcast !== false && token !== oldToken) {
      startBroadcast();
      try {
        bc?.postMessage({ type: "token", token: accessToken });
      } catch (error) {
        console.warn("Failed to broadcast token:", error);
      }
    }

    if (opts.schedule !== false && token) {
      scheduleProactiveRefresh(token);
    } else if (!token) {
      clearRefreshTimer();
    }

    if (token !== oldToken) {
      notify(accessToken);
    }
  } finally {
    isRefreshing = false;
  }
}

/** Panggil di _app/layout mount untuk restore token dari storage */
export function initAuthFromStorage() {
  if (typeof window === "undefined") return;
  
  startBroadcast();
  
  if (!PERSIST_TO_LOCALSTORAGE) {
    // Clear any existing token from storage in development
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
    return;
  }

  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      // Validasi token yang di-restore
      const isValid = parseJwtExp(saved) !== null;
      if (isValid) {
        setAccessToken(saved, {
          broadcast: false,
          schedule: true,
          persist: true,
        });
        console.log("Token restored from storage");
      } else {
        console.warn("Removing invalid saved token");
        localStorage.removeItem(LS_KEY);
      }
    }
  } catch (error) {
    console.warn("Failed to init auth from storage:", error);
  }
}

/** Cleanup untuk mencegah memory leaks */
export function cleanup() {
  clearRefreshTimer();
  listeners.clear();
  try {
    bc?.close();
  } catch (error) {
    console.warn("Error closing BroadcastChannel:", error);
  }
  bc = null;
  refreshExecutor = null;
  accessToken = null;
  isRefreshing = false;
}

/** Force refresh token */
export async function forceRefresh(): Promise<string | null> {
  if (!refreshExecutor) {
    console.warn("No refresh executor available");
    return null;
  }

  try {
    const newToken = await refreshExecutor();
    return newToken;
  } catch (error) {
    console.error("Force refresh failed:", error);
    return null;
  }
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