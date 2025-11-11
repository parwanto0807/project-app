// lib/apiFetch.ts
import {
  getAccessToken,
  IS_CLIENT,
  LS_KEY,
  PERSIST_TO_LOCALSTORAGE,
  refreshToken,
  setAccessToken,
  validateToken,
} from "./autoRefresh";
// ⬆ gunakan getAccessToken & refreshAccessToken yang sudah kamu pakai di use-current-user

export async function apiFetch(url: string, options: RequestInit = {}) {
  let token = getAccessToken();

  // ✅ Jika tidak ada token tapi ada di localStorage, coba restore
  if (!token && PERSIST_TO_LOCALSTORAGE && IS_CLIENT) {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const validation = validateToken(saved);
        if (validation.isValid) {
          console.log("🔄 Restoring token for API request");
          setAccessToken(saved, {
            broadcast: false,
            schedule: true,
            persist: true,
          });
          token = saved;
        }
      }
    } catch (error) {
      console.error("❌ Error restoring token for API request:", error);
    }
  }

  // --- eksekusi request pertama ---
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  // ✅ jika token expired → 401
  if (res.status === 401) {
    console.log("🔄 Token expired, attempting refresh...");
    const newToken = await refreshToken();

    if (!newToken) {
      // Clear semua state jika refresh gagal
      setAccessToken(null, { broadcast: true, schedule: false, persist: true });
      throw new Error("Unauthorized");
    }

    // ulang request pakai token baru
    return apiFetch(url, options);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }

  return res.json();
}
