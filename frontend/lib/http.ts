// /lib/http.ts
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type RawAxiosRequestHeaders,
  AxiosHeaders,
} from "axios";

// Import dari autoRefresh.ts - gunakan sebagai single source of truth
import {
  getAccessToken,
  setAccessToken,
  clearRefreshTimer,
  setRefreshExecutor,
  forceRefresh,
  isTokenValid,
  cleanup,
} from "./autoRefresh";

// ====== SINGLE FLIGHT REFRESH STATE ======
let refreshInFlight: Promise<string> | null = null;

// ====== AXIOS INSTANCES ======
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 30000, // ✅ Added timeout
});

const raw: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 30000, // ✅ Added timeout
});

const REFRESH_PATH = "/api/auth/refresh";

// ====== SETUP REFRESH EXECUTOR UNTUK AUTOREFRESH ======
setRefreshExecutor(async (): Promise<string | null> => {
  console.log("🔄 Refresh executor called from autoRefresh system");

  try {
    const response = await raw.post(REFRESH_PATH);

    if (response.data?.accessToken) {
      const newToken = response.data.accessToken;
      console.log("✅ Refresh executor successful");
      return newToken;
    }

    // ✅ Better error handling for different response formats
    console.error("❌ Invalid refresh response format:", response.data);
    throw new Error("Invalid refresh response format");
  } catch (error) {
    console.error("❌ Refresh executor failed:", error);

    // ✅ Clear tokens on critical auth errors
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("🔒 Auth error during refresh, clearing tokens");
        clearTokensOnLogout();
      }
    }

    return null;
  }
});

// ====== REQUEST INTERCEPTOR ======
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Skip auth for certain requests
  const skipAuthConfig = config as InternalAxiosRequestConfig & {
    _skipAuth?: boolean;
  };
  if (skipAuthConfig._skipAuth) {
    return config;
  }

  // Development fallback dari cookie
  const token = getAccessToken();
  if (
    !token &&
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development"
  ) {
    const cookies = document.cookie.split("; ");
    const accessTokenCookie = cookies.find((row) =>
      row.startsWith("accessToken=")
    );
    const cookieValue = accessTokenCookie
      ? accessTokenCookie.split("=")[1]
      : null;

    if (cookieValue) {
      // Cek validitas token sebelum menyimpan
      try {
        const [, payload] = cookieValue.split(".");
        const decodedPayload = JSON.parse(atob(payload));
        const { exp } = decodedPayload;
        if (exp && exp * 1000 > Date.now()) {
          setAccessToken(cookieValue);
        } else {
          console.warn("⚠️ Token from cookie is expired");
        }
      } catch (error) {
        console.warn("⚠️ Invalid token in cookie:", error);
      }
    }
  }

  // Set authorization header
  const currentToken = getAccessToken();
  if (currentToken) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${currentToken}`);
    } else {
      (config.headers as RawAxiosRequestHeaders)[
        "Authorization"
      ] = `Bearer ${currentToken}`;
    }
  }

  config.withCredentials = true;
  return config;
});

// ====== SINGLE-FLIGHT REFRESH ======
const callRefresh = async (): Promise<string> => {
  if (refreshInFlight) {
    console.log("🔄 Waiting for existing refresh request");
    return refreshInFlight;
  }

  console.log("🔄 Starting new refresh request");
  refreshInFlight = raw
    .post(REFRESH_PATH)
    .then((response) => {
      console.log("📨 Refresh response received:", {
        status: response.status,
        hasToken: !!response.data?.accessToken,
      });

      if (response.data?.accessToken) {
        const newToken = response.data.accessToken;
        console.log("✅ New token received from backend");

        // Gunakan autoRefresh system untuk menyimpan token
        setAccessToken(newToken);

        // Update axios default header
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        raw.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        console.log("✅ Refresh request successful");
        return newToken;
      }

      console.error("❌ Invalid refresh response format");
      throw new Error("Invalid refresh response format");
    })
    .catch((error: AxiosError) => {
      console.error("❌ Refresh request failed:", {
        status: error.response?.status,
        message: error.message,
      });

      // ✅ Clear tokens on auth errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearTokensOnLogout();
      }

      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

// ====== RESPONSE INTERCEPTOR ======
type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuth?: boolean;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    // ✅ FIX: Skip untuk request tertentu
    if (!error.response || !originalRequest || originalRequest._skipAuth) {
      return Promise.reject(error);
    }

    const is401 = error.response.status === 401;
    const isRefreshCall = originalRequest.url?.includes(REFRESH_PATH);

    // ✅ FIX: Prevent infinite loop
    if (is401 && !isRefreshCall && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log("🔐 401 detected, attempting token refresh...");

      try {
        const newAccessToken = await callRefresh();

        // Update request header untuk retry
        if (originalRequest.headers instanceof AxiosHeaders) {
          originalRequest.headers.set(
            "Authorization",
            `Bearer ${newAccessToken}`
          );
        } else {
          (originalRequest.headers as RawAxiosRequestHeaders)[
            "Authorization"
          ] = `Bearer ${newAccessToken}`;
        }

        console.log("✅ Retrying original request with new token");
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Refresh failed, clearing tokens");

        // ✅ FIX: Clear tokens dan stop further attempts
        clearTokensOnLogout();

        // Jangan redirect otomatis, biarkan component handle
        console.log("🛑 Refresh failed, user should be redirected to login");

        return Promise.reject(refreshError);
      }
    }

    // ✅ FIX: Jika sudah di-retry dan masih 401, reject saja
    if (is401 && originalRequest._retry) {
      console.log("🛑 Already retried, rejecting request");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// ====== HELPER FUNCTIONS ======
export const initializeTokensOnLogin = async (
  accessToken: string
): Promise<void> => {
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  // Validate token before storing
  try {
    const [, payload] = accessToken.split(".");
    const decodedPayload = JSON.parse(atob(payload));
    const { exp } = decodedPayload;

    if (!exp || exp * 1000 <= Date.now()) {
      throw new Error("Token is expired");
    }
  } catch (error) {
    console.error("❌ Invalid token during login:", error);
    throw new Error("Invalid token");
  }

  // Simpan token menggunakan autoRefresh system
  setAccessToken(accessToken);

  // Update axios default header
  api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

  console.log("✅ Tokens initialized on login");
};

export function clearTokensOnLogout(): void {
  console.log("🧹 Clearing tokens on logout");

  // Clear in-memory token
  setAccessToken(null);

  // Stop refresh scheduler
  clearRefreshTimer();
  cleanup();

  // Remove default header
  delete api.defaults.headers.common["Authorization"];

  // ✅ Hapus semua kemungkinan token di browser
  if (typeof window !== "undefined") {
    const domain = window.location.hostname;

    const cookieOptions = `Path=/; Max-Age=0; SameSite=Lax; Secure; Domain=${domain}`;

    document.cookie = `accessToken=; ${cookieOptions}`;
    document.cookie = `refreshToken=; ${cookieOptions}`;

    // Backup deletion
    document.cookie = `accessToken=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `refreshToken=; Path=/; Max-Age=0; SameSite=Lax`;

    // Local/session storage
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");
  }
}

export async function ensureFreshToken(): Promise<boolean> {
  try {
    const token = getAccessToken();

    if (!token || !isTokenValid()) {
      console.log("🔄 Token invalid or missing, attempting refresh");
      const newToken = await forceRefresh();
      return !!newToken;
    }

    // ✅ Additional validation - check if token is about to expire
    const tokenExp = getAccessToken() ? parseJwt(getAccessToken()!).exp : 0;
    const now = Math.floor(Date.now() / 1000);
    const isExpiringSoon = tokenExp - now < 300; // 5 minutes

    if (isExpiringSoon) {
      console.log("🔄 Token expiring soon, proactive refresh");
      const newToken = await forceRefresh();
      return !!newToken;
    }

    return true;
  } catch (error) {
    console.error("❌ ensureFreshToken failed:", error);
    return false;
  }
}

// ✅ Helper function to parse JWT
function parseJwt(token: string): { exp: number } {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    throw new Error("Invalid JWT token");
  }
}

// Utility untuk public APIs (tanpa auth)
export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// ✅ Export raw instance for non-auth requests
export { raw };

// ✅ Health check function
export const checkAuthHealth = async (): Promise<boolean> => {
  try {
    await ensureFreshToken();
    return true;
  } catch {
    return false;
  }
};
