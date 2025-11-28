// /lib/http.ts
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type RawAxiosRequestHeaders,
  AxiosHeaders,
  type AxiosResponse,
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

// ====== TYPE DEFINITIONS ======
interface ApiErrorResponse {
  message?: string;
  code?: string;
  status?: number;
  error?: string;
}

interface ApiSuccessResponse {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

interface JwtPayload {
  exp: number;
  iat?: number;
  sub?: string;
  [key: string]: unknown;
}

// Extend AxiosError dengan data yang kita expect
interface CustomAxiosError extends AxiosError {
  response?: AxiosResponse<ApiErrorResponse>;
}

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuth?: boolean;
};

// ====== SINGLE FLIGHT REFRESH STATE ======
let refreshInFlight: Promise<string> | null = null;

// ====== AXIOS INSTANCES ======
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 30000,
});

const raw: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  timeout: 30000,
});

const REFRESH_PATH = "/api/auth/refresh";

// ====== HELPER FUNCTIONS ======
function parseJwt(token: string): JwtPayload {
  try {
    const [, payload] = token.split(".");
    const decodedPayload = JSON.parse(atob(payload)) as JwtPayload;
    return decodedPayload;
  } catch {
    throw new Error("Invalid JWT token");
  }
}

function redirectToUnauthorized(
  reason:
    | "session_terminated"
    | "token_expired"
    | "device_limit" = "session_terminated"
): void {
  console.log(`🔀 Redirecting to unauthorized page: ${reason}`);

  clearTokensOnLogout();

  if (typeof window !== "undefined") {
    setTimeout(() => {
      const queryParams = new URLSearchParams({ reason });
      window.location.href = `/unauthorized?${queryParams}`;
    }, 100);
  }
}

// Type guard untuk memeriksa apakah error adalah AxiosError dengan response data
const isAxiosErrorWithResponse = (
  error: unknown
): error is CustomAxiosError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true &&
    "response" in error &&
    (error as AxiosError).response !== undefined
  );
};

// Type guard untuk memeriksa single session violation
const isSingleSessionViolation = (error: unknown): boolean => {
  if (!isAxiosErrorWithResponse(error)) return false;

  const errorMessage = error.response?.data?.message || "";
  return (
    errorMessage.includes("device") ||
    errorMessage.includes("session") ||
    errorMessage.includes("another device") ||
    errorMessage.includes("single session")
  );
};

// Safe error message extractor
const getErrorMessage = (error: unknown): string => {
  if (isAxiosErrorWithResponse(error)) {
    return error.response?.data?.message || error.message || "Unknown error";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
};

// ====== SETUP REFRESH EXECUTOR UNTUK AUTOREFRESH ======
setRefreshExecutor(async (): Promise<string | null> => {
  console.log("🔄 Refresh executor called from autoRefresh system");

  try {
    const response = await raw.post<ApiSuccessResponse>(REFRESH_PATH);

    if (response.data?.accessToken) {
      const newToken = response.data.accessToken;
      console.log("✅ Refresh executor successful");
      return newToken;
    }

    console.error("❌ Invalid refresh response format:", response.data);
    throw new Error("Invalid refresh response format");
  } catch (error: unknown) {
    console.error("❌ Refresh executor failed:", error);

    // Clear tokens on critical auth errors
    if (isAxiosErrorWithResponse(error)) {
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
  const skipAuthConfig = config as RetriableConfig;
  if (skipAuthConfig._skipAuth) {
    return config;
  }

  let token = getAccessToken();

  // Dev-mode fallback token dari cookie
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

    // Validasi token cookie
    if (cookieValue) {
      try {
        const decoded = parseJwt(cookieValue);
        if (decoded.exp * 1000 > Date.now()) {
          setAccessToken(cookieValue);
          token = cookieValue;
        }
      } catch (e) {
        console.warn("⚠️ Invalid access token from cookie.", e);
      }
    }
  }

  // Pasang token ke header
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
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
    .post<ApiSuccessResponse>(REFRESH_PATH)
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
    .catch((error: unknown) => {
      console.error("❌ Refresh request failed:", {
        status: isAxiosErrorWithResponse(error)
          ? error.response?.status
          : "unknown",
        message: getErrorMessage(error),
      });

      // Handle single session violation
      if (isSingleSessionViolation(error)) {
        console.log("🚫 Refresh failed due to single session policy");
        throw new Error("SINGLE_SESSION_VIOLATION");
      }

      // Clear tokens on auth errors
      if (isAxiosErrorWithResponse(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          clearTokensOnLogout();
        }
      }

      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

// ====== RESPONSE INTERCEPTOR ======
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosErrorWithResponse(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableConfig | undefined;

    // Skip untuk request tertentu
    if (!error.response || !originalRequest || originalRequest._skipAuth) {
      return Promise.reject(error);
    }

    const is401 = error.response.status === 401;
    const isRefreshCall = originalRequest.url?.includes(REFRESH_PATH);

    // Check for single session violation
    if (isSingleSessionViolation(error)) {
      console.log("🚫 Single session violation detected, redirecting...");
      clearTokensOnLogout();
      redirectToUnauthorized("session_terminated");
      return Promise.reject(error);
    }

    // Prevent infinite loop
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
      } catch (refreshError: unknown) {
        console.error("❌ Refresh failed, clearing tokens");

        // Check if refresh failed due to single session
        if (isSingleSessionViolation(refreshError)) {
          console.log("🚫 Refresh failed due to single session violation");
          clearTokensOnLogout();
          redirectToUnauthorized("session_terminated");
        } else {
          clearTokensOnLogout();
          console.log("🛑 Refresh failed, user should be redirected to login");
        }

        return Promise.reject(refreshError);
      }
    }

    // Jika sudah di-retry dan masih 401, reject saja
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
    const decodedPayload = parseJwt(accessToken);
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

  // Hapus semua kemungkinan token di browser
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

    // Clear any pending FCM tokens
    localStorage.removeItem("pending_fcm_token");
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

    // Additional validation - check if token is about to expire
    const currentToken = getAccessToken();
    if (currentToken) {
      const tokenExp = parseJwt(currentToken).exp;
      const now = Math.floor(Date.now() / 1000);
      const isExpiringSoon = tokenExp - now < 300; // 5 minutes

      if (isExpiringSoon) {
        console.log("🔄 Token expiring soon, proactive refresh");
        const newToken = await forceRefresh();
        return !!newToken;
      }
    }

    return true;
  } catch (error: unknown) {
    console.error("❌ ensureFreshToken failed:", error);

    // Handle single session violation
    if (
      error instanceof Error &&
      error.message === "SINGLE_SESSION_VIOLATION"
    ) {
      redirectToUnauthorized("session_terminated");
    }

    return false;
  }
}

// Utility untuk public APIs (tanpa auth)
export const publicApi: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Export raw instance for non-auth requests
export { raw };

// Health check function
export const checkAuthHealth = async (): Promise<boolean> => {
  try {
    await ensureFreshToken();
    return true;
  } catch {
    return false;
  }
};

// Export functions untuk digunakan di komponen lain
export { redirectToUnauthorized, isSingleSessionViolation, getErrorMessage };
