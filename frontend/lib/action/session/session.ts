import { api } from "@/lib/http";
import { ActiveSessionsResponse } from "@/types/session";

// lib/action/session.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ✅ Get all sessions (admin)
export async function getAllSessions() {
  const res = await fetch(`${API_BASE_URL}/sessions`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch sessions");
  }

  const data = await res.json(); // ✅ data = array

  // console.log("getAllSessions response:", data);

  return data; // ✅ langsung return array
}

// ✅ Get session by userId
export async function getSessionsByUser(userId: string) {
  const res = await fetch(`${API_BASE_URL}/sessions/user/${userId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user sessions");
  }

  return res.json();
}

// ✅ Revoke session (logout dari device tertentu)
export async function revokeSession(sessionId: string) {
  const res = await fetch(`${API_BASE_URL}/sessions/revoke/${sessionId}`, {
    method: "PATCH",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to revoke session");
  }

  return res.json();
}

// ==================== ACTIONS ====================

/**
 * Mengambil semua sesi aktif untuk Admin Monitoring.
 * Endpoint: GET /api/session/all-active (Sesuaikan dengan prefix route backend Anda)
 * * @param page - Halaman saat ini (default: 1)
 * @param limit - Jumlah item per halaman (default: 20)
 */
export const getAllActiveSessions = async (
  page: number = 1,
  limit: number = 20
): Promise<ActiveSessionsResponse> => {
  try {
    // ⚠️ PERHATIKAN URL:
    // Asumsi route backend di-mount di '/api/session' atau '/api/admin/session'
    // Sesuaikan path '/api/session/all-active' di bawah ini dengan route backend Anda.
    const response = await api.get<ActiveSessionsResponse>(
      "/session/all-active",
      {
        params: {
          page,
          limit,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ [ACTION] Failed to fetch all active sessions:", error);
    throw error; // Lempar error agar bisa ditangkap oleh UI (Toast/Error State)
  }
};
