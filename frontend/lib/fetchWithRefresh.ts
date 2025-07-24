export async function fetchWithRefresh(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status !== 401) {
    return res;
  }

  try {
    // Coba refresh token
    const refreshRes = await fetch("/auth/refresh-token?redirect=manual");

    if (refreshRes.ok) {
      // Jika berhasil refresh, ulang request awal
      return await fetch(input, init);
    } else {
      // Refresh gagal (token invalid/expired), redirect logout
      console.warn("🔁 Refresh token gagal, logout...");
      window.location.href = "/auth/login";
      return new Response(null, { status: 401 });
    }
  } catch (err) {
    console.error("❌ Gagal melakukan refresh token:", err);
    window.location.href = "/auth/login";
    return new Response(null, { status: 401 });
  }
}
