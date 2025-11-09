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
} from "./autoRefresh";

// ====== SINGLE FLIGHT REFRESH STATE ======
let refreshInFlight: Promise<string> | null = null;

// ====== AXIOS INSTANCES ======
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const raw: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const REFRESH_PATH = "/api/auth/refresh";

// ====== SETUP REFRESH EXECUTOR UNTUK AUTOREFRESH ======
setRefreshExecutor(async (): Promise<string | null> => {
  // console.log("🔄 Refresh executor called from autoRefresh system");

  try {
    const response = await raw.post(REFRESH_PATH);

    if (response.data?.success && response.data.accessToken) {
      const newToken = response.data.accessToken;
      // console.log("✅ Refresh executor successful");
      return newToken;
    }

    throw new Error("Invalid refresh response");
  } catch (error) {
    console.error("❌ Refresh executor failed:", error);
    return null;
  }
});

// ====== REQUEST INTERCEPTOR ======
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
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
        const { exp } = JSON.parse(atob(payload));
        if (exp && exp * 1000 > Date.now()) {
          setAccessToken(cookieValue);
        }
      } catch {
        // Token invalid, skip
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
    // console.log("🔄 Waiting for existing refresh request");
    return refreshInFlight;
  }

  // console.log("🔄 Starting new refresh request");
  refreshInFlight = raw
    .post(REFRESH_PATH)
    .then((response) => {
      // console.log("📨 Refresh response received:", {
      //   status: response.status,
      //   data: response.data,
      // });

      if (response.data?.success && response.data.accessToken) {
        const newToken = response.data.accessToken;

        // console.log("✅ New token received from backend");

        // Gunakan autoRefresh system untuk menyimpan token
        setAccessToken(newToken);

        // Update axios default header
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        // console.log("✅ Refresh request successful");
        return newToken;
      }

      // console.error("❌ Invalid refresh response format");
      throw new Error("Invalid refresh response");
    })
    .catch((error) => {
      console.error("❌ Refresh request failed:", error);
      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

// ====== RESPONSE INTERCEPTOR ======
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

      // Single-flight refresh
      if (!refreshInFlight) {
        refreshInFlight = callRefresh().finally(() => {
          refreshInFlight = null;
        });
      }

      try {
        const newAccessToken = await refreshInFlight;

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

        // console.log("✅ Retrying original request with new token");
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh gagal → logout
        // console.error("❌ Refresh failed, redirecting to login");

        setAccessToken(null);
        clearRefreshTimer();
        delete api.defaults.headers.common["Authorization"];

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/auth/login")
        ) {
          window.location.href = "/auth/loginAdmin";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ====== HELPER FUNCTIONS ======
export const initializeTokensOnLogin = async (accessToken: string) => {
  // Simpan token ke localStorage/sessionStorage
  localStorage.setItem("access_token", accessToken);

  // Jika ada operasi async lainnya, tunggu sampai selesai
  await new Promise((resolve) => setTimeout(resolve, 0)); // placeholder untuk operasi async nyata
};

export function clearTokensOnLogout() {
  setAccessToken(null);
  clearRefreshTimer();
  delete api.defaults.headers.common["Authorization"];

  if (typeof window !== "undefined") {
    document.cookie = "accessToken=; Path=/; Max-Age=0; SameSite=Lax";
  }
}

// Di function ensureFreshToken - PERBAIKI
export async function ensureFreshToken(): Promise<boolean> {
  try {
    const token = getAccessToken();

    // ✅ PERBAIKAN: isTokenValid() tidak butuh parameter
    if (!token || !isTokenValid()) {
      // console.log("🔄 Token invalid or missing, attempting refresh");
      const newToken = await forceRefresh();
      return !!newToken;
    }

    return true;
  } catch (error) {
    console.error("❌ ensureFreshToken failed:", error);
    return false;
  }
}

// Utility untuk public APIs (tanpa auth)
export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

publicApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  (config as RetriableConfig & { _skipAuth?: boolean })._skipAuth = true;
  return config;
});
