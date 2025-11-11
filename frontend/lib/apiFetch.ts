// lib/apiFetch.ts
import { getAccessToken, refreshToken } from "./autoRefresh";
// ⬆ gunakan getAccessToken & refreshAccessToken yang sudah kamu pakai di use-current-user

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken(); // ambil token sekarang

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
    const newToken = await refreshToken();
    if (!newToken) throw new Error("Unauthorized");

    // ulang request pakai token baru
    return apiFetch(url, options);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }

  return res.json();
}
