// frontend/lib/autoRefresh.ts
// Util untuk menyimpan accessToken di memori, refresh proaktif, dan sinkron antar tab.

type TokenListener = (token: string | null) => void;

let accessToken: string | null = null;
let refreshTimer: number | undefined;
const listeners = new Set<TokenListener>();
let bc: BroadcastChannel | null = null;

const PERSIST_TO_LOCALSTORAGE = true;
const LS_KEY = "access_token";

function startBroadcast() {
  if (typeof window === "undefined") return;
  if (!bc) {
    bc = new BroadcastChannel("auth");
    bc.onmessage = (e) => {
      if (e?.data?.type === "token") {
        setAccessToken(e.data.token, { broadcast: false, schedule: true, persist: PERSIST_TO_LOCALSTORAGE });
      }
    };
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function onTokenChange(fn: TokenListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(token: string | null) {
  for (const fn of listeners) fn(token);
}

export function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
  }
}

function parseJwtExp(token: string): number | null {
  try {
    const [, payloadB64] = token.split(".");
    const json = JSON.parse(atob(payloadB64));
    return typeof json.exp === "number" ? json.exp : null; // epoch seconds
  } catch {
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
  if (!expSec) return;

  const delay = Math.max(expSec * 1000 - Date.now() - skewMs, 0);

  refreshTimer = window.setTimeout(async () => {
    if (!refreshExecutor) return;
    const newToken = await refreshExecutor();
    if (!newToken) {
      // refresh gagal → biarkan flow 401 di interceptor yang handle
      return;
    }
    // token baru akan di-set oleh http.ts lewat setAccessToken
  }, delay);
}

/** Set token ke memori (+ broadcast, + schedule, + optional persist) */
export function setAccessToken(
  token: string | null,
  opts: { broadcast?: boolean; schedule?: boolean; persist?: boolean } = { broadcast: true, schedule: true, persist: PERSIST_TO_LOCALSTORAGE }
) {
  accessToken = token ?? null;

  if (opts.persist) {
    try {
      if (token) localStorage.setItem(LS_KEY, token);
      else localStorage.removeItem(LS_KEY);
    } catch {}
  }

  if (opts.broadcast !== false) {
    startBroadcast();
    bc?.postMessage({ type: "token", token: accessToken });
  }

  if (opts.schedule !== false && token) {
    scheduleProactiveRefresh(token);
  } else {
    clearRefreshTimer();
  }

  notify(accessToken);
}

/** Panggil di _app/layout mount untuk restore token dari storage (opsional) */
export function initAuthFromStorage() {
  if (typeof window === "undefined") return;
  startBroadcast();
  if (!PERSIST_TO_LOCALSTORAGE) return;

  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      setAccessToken(saved, { broadcast: false, schedule: true, persist: true });
    }
  } catch {}
}
