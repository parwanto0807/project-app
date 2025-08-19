// /lib/http.ts
import axios from "axios";

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;

/**
 * Helper terpusat untuk menyimpan token.
 */
export function initializeTokens(newAccessToken: string) {
  setAccessToken(newAccessToken);
  if (typeof window !== "undefined") {
    document.cookie = `accessToken=${newAccessToken}; Path=/; Max-Age=120; SameSite=Lax`;
  }
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Interceptor untuk menyisipkan token
api.interceptors.request.use((config) => {
  if (!accessToken && typeof window !== "undefined") {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
    if (cookieValue) {
      setAccessToken(cookieValue);
    }
  }
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Logika Refresh Token Paling Tangguh dengan Promise Bersama ----
let refreshTokenRequest: Promise<string> | null = null;

const callRefresh = async (): Promise<string> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!response.ok) throw new Error('Refresh token failed');
    const data = await response.json();
    console.log("New access token received:", data.accessToken);
    return data.accessToken;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Jika belum ada proses refresh yang berjalan, mulai satu.
      if (!refreshTokenRequest) {
        refreshTokenRequest = callRefresh().finally(() => {
          // Reset promise setelah selesai (baik berhasil maupun gagal)
          refreshTokenRequest = null;
        });
      }

      try {
        // Tunggu proses refresh yang sedang berjalan selesai
        const newAccessToken = await refreshTokenRequest;
        
        // Simpan token baru
        initializeTokens(newAccessToken);
        
        // Perbarui header permintaan asli dan coba lagi
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Jika refresh gagal, arahkan ke login
        setAccessToken(null);
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

// Helper yang dipanggil dari halaman Login
export function initializeTokensOnLogin(initialAccess: string) {
  initializeTokens(initialAccess);
}
