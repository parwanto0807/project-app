// /lib/http.ts
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type RawAxiosRequestHeaders,
  AxiosHeaders,
} from "axios";

// ====== state token sederhana (in-memory + optional cookie fallback) ======
let accessToken: string | null = null;
let refreshInFlight: Promise<string> | null = null;
let refreshTimer: number | undefined;

export const setAccessToken = (t: string | null) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;

// (opsional) taruh juga di cookie non-HttpOnly untuk fallback reload dev.
// NOTE: ini tidak disarankan untuk production karena bukan HttpOnly.
export function initializeTokens(newAccessToken: string) {
  setAccessToken(newAccessToken);
  api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
  scheduleProactiveRefresh(newAccessToken);
  if (typeof window !== "undefined") {
    document.cookie = `accessToken=${newAccessToken}; Path=/; Max-Age=3600; SameSite=Lax`;
  }
}

// ====== util: proactive refresh sebelum expired ======
function parseExpMs(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}
function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
  }
}

function scheduleProactiveRefresh(token: string, skewMs = 45_000) {
  if (typeof window === "undefined") return;
  clearRefreshTimer();
  const expMs = parseExpMs(token);
  if (!expMs) return;
  const delay = Math.max(expMs - Date.now() - skewMs, 0);
  refreshTimer = window.setTimeout(() => {
    void callRefresh(); // fire & forget
  }, delay);
}

// ====== axios instances ======
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // perlu untuk refresh yang pakai cookie httpOnly
});

// instance "raw" untuk memanggil refresh agar tidak terjerat interceptor api
const raw: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const REFRESH_PATH = "/api/auth/refresh";

// ====== request interceptor: sisipkan Authorization dengan aman ======
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // fallback dari cookie kalau accessToken null (mis. setelah reload)
  if (!accessToken && typeof window !== "undefined") {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];
    if (cookieValue) initializeTokens(cookieValue);
  }

  const token = getAccessToken();
  if (token) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      (config.headers as RawAxiosRequestHeaders)["Authorization"] = `Bearer ${token}`;
    }
  }
  config.withCredentials = true;
  return config;
});

// ====== refresh single-flight ======
const callRefresh = async (): Promise<string> => {
  const res = await raw.post(REFRESH_PATH); // cookie httpOnly ikut karena withCredentials
  if (!res.data?.accessToken) throw new Error("Refresh token failed");
  return res.data.accessToken as string;
};

// ====== response interceptor: 401 -> refresh -> retry ======
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const is401 = error.response.status === 401;
    const isRefreshCall = originalRequest.url?.includes(REFRESH_PATH);

    if (is401 && !isRefreshCall && !originalRequest._retry) {
      originalRequest._retry = true;

      // single-flight: share 1 promise
      if (!refreshInFlight) {
        refreshInFlight = callRefresh().finally(() => {
          refreshInFlight = null;
        });
      }

      try {
        const newAccessToken = await refreshInFlight;
        // simpan token baru, update default header, jadwalkan proactive refresh
        initializeTokens(newAccessToken);

        // set header untuk retry request yang gagal
        if (originalRequest.headers instanceof AxiosHeaders) {
          originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        } else {
          (originalRequest.headers as RawAxiosRequestHeaders)["Authorization"] = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // refresh gagal → bersihkan & arahkan ke login
        setAccessToken(null);
        clearRefreshTimer();
        delete api.defaults.headers.common["Authorization"];
        if (typeof window !== "undefined") {
          document.cookie = "accessToken=; Path=/; Max-Age=0; SameSite=Lax";
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ====== helper untuk dipanggil saat login/logout ======
export function initializeTokensOnLogin(initialAccess: string) {
  initializeTokens(initialAccess);
}
export function clearTokensOnLogout() {
  setAccessToken(null);
  clearRefreshTimer();
  delete api.defaults.headers.common["Authorization"];
  if (typeof window !== "undefined") {
    document.cookie = "accessToken=; Path=/; Max-Age=0; SameSite=Lax";
  }
}

function willExpireSoon(token: string, skewMs = 60_000) {
  try {
    const [, p] = token.split(".");
    const { exp } = JSON.parse(atob(p));
    const expMs = (exp ?? 0) * 1000;
    return Date.now() > expMs - skewMs;
  } catch {
    return true;
  }
}

// pakai callRefresh & refreshInFlight yg sudah ada di file-mu
export async function ensureFreshToken() {
  const token = getAccessToken();
  if (!token || willExpireSoon(token)) {
    // single-flight sama seperti interceptor
    if (!refreshInFlight) {
      refreshInFlight = callRefresh().finally(() => (refreshInFlight = null));
    }
    const newTok = await refreshInFlight;
    if (newTok) initializeTokens(newTok);
  }
}