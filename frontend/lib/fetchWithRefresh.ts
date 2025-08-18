// /lib/fetchWithRefresh.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL; // contoh: http://localhost:5000
const REFRESH_PATH = "/api/auth/refresh";         // <-- sesuaikan dengan mount di server

function withBase(url: string) {
  return /^https?:\/\//i.test(url) ? url : `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function fetchWithRefresh(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const originalUrl = typeof input === "string" ? input : (input as URL).toString();
  const req = new Request(withBase(originalUrl), { credentials: "include", ...init });

  const isRefreshCall = originalUrl.includes(REFRESH_PATH);
  const firstRes = await fetch(req.clone());
  if (isRefreshCall || (firstRes.status !== 401 && firstRes.status !== 403)) {
    return firstRes;
  }

  // 🔁 Coba refresh (POST)
  const refreshRes = await fetch(withBase(REFRESH_PATH), {
    method: "POST",
    credentials: "include",
    headers: { "X-Requested-With": "fetchWithRefresh" },
  });

  if (!refreshRes.ok) {
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    return firstRes;
  }

  const retryRes = await fetch(req.clone());
  if (retryRes.status === 401 || retryRes.status === 403) {
    if (typeof window !== "undefined") window.location.href = "/auth/login";
  }
  return retryRes;
}
