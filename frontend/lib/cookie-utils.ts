// lib/cookie-utils.ts
import { cookies } from "next/headers";

export async function getCookieHeader(): Promise<string> {
  try {
    const store = await cookies();
    const allCookies = store.getAll();

    // 🔍 DEBUG: Log semua cookies yang tersedia
    (() => {})("🍪 [COOKIE DEBUG] All cookies:", allCookies);

    // Cari accessToken secara spesifik
    const accessToken = store.get("accessToken");
    (() => {})(
      "🍪 [COOKIE DEBUG] Access token found:",
      accessToken ? "YES" : "NO"
    );

    if (!accessToken) {
      console.warn("🍪 [COOKIE DEBUG] Access token tidak ditemukan!");
      (() => {})(
        "🍪 [COOKIE DEBUG] Available cookie names:",
        allCookies.map((c) => c.name)
      );
      return "";
    }

    const cookieHeader = allCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    (() => {})("🍪 [COOKIE DEBUG] Final cookie header:", cookieHeader);

    return cookieHeader;
  } catch (error) {
    console.error("🍪 [COOKIE DEBUG] Error:", error);
    return "";
  }
}

// ✅ Versi yang lebih spesifik untuk auth
export async function getAuthCookieHeader(): Promise<string> {
  try {
    const store = await cookies();
    const accessToken = store.get("accessToken");
    
    if (!accessToken) {
      return "";
    }

    return `accessToken=${accessToken.value}`;
  } catch (error) {
    console.error("🔑 Error getting auth cookie:", error);
    return "";
  }
}

// ✅ Versi untuk Authorization Header (Recommended)
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const store = await cookies();
    const accessToken = store.get("accessTokenReadable"); // atau accessToken
    
    if (!accessToken) {
      return { "Content-Type": "application/json" };
    }

    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken.value}`
    };
  } catch (error) {
    console.error("🔑 Error getting auth headers:", error);
    return { "Content-Type": "application/json" };
  }
}