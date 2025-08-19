// /lib/autoRefresh.ts

import { getAccessToken, initializeTokensOnLogin } from "@/lib/http";

// Asumsi Anda punya fungsi callRefresh di lib/http.ts
// Contoh implementasinya:
export async function callRefresh(): Promise<string> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await res.json();
  if (!data.accessToken) {
    throw new Error("No new access token received");
  }
  
  return data.accessToken;
}


let timer: ReturnType<typeof setTimeout> | null = null;

function parseExp(token: string): number | null {
  try {
    // atob() hanya ada di browser, pastikan kode ini hanya berjalan di client-side
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function scheduleOnce() {
  const token = getAccessToken();
  if (!token) return;

  const exp = parseExp(token);
  if (!exp) return;

  const now = Math.floor(Date.now() / 1000);
  // Refresh 45 detik sebelum token kedaluwarsa, atau minimal 1 detik dari sekarang
  const delayMs = Math.max((exp - now - 60) * 1000, 1000); 

  if (timer) clearTimeout(timer);

  console.log(`Silent refresh scheduled in ${Math.round(delayMs / 1000)} seconds.`);

  timer = setTimeout(async () => {
    try {
      console.log("Attempting silent refresh...");
      const newToken = await callRefresh();      // panggil /api/auth/refresh
      initializeTokensOnLogin(newToken);         // simpan ke memory & cookie
      console.log("Silent refresh successful.");
    } catch (error) {
      console.error("Silent refresh failed:", error);
      // Biarkan 401 jadi fallback (mis. arahkan ke login di tempat lain)
      // Hentikan timer jika refresh gagal total
      stopSilentRefresh();
    } finally {
      // Jadwalkan lagi untuk token baru jika berhasil, atau berhenti jika gagal
      if (getAccessToken()) {
        scheduleOnce();
      }
    }
  }, delayMs);
}

export function startSilentRefresh() {
  // Pastikan hanya berjalan di browser
  if (typeof window !== "undefined") {
    scheduleOnce();
  }
}

export function stopSilentRefresh() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    console.log("Silent refresh stopped.");
  }
}
