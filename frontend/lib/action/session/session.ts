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
