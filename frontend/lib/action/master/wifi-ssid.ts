"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchWifiSsids(activeOnly = false) {
  try {
    const res = await fetch(`${API_URL}/api/master/wifi-ssid?activeOnly=${activeOnly}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Note: We might need to handle session/token here depending on how frontend is set up
      // In this app, it seems credentials: "include" is used for session cookies
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[fetchWifiSsids]", error);
    return { success: false, error: error.message };
  }
}

export async function createWifiSsid(data: any) {
  try {
    const res = await fetch(`${API_URL}/api/master/wifi-ssid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Gagal create: ${res.status}`);
    }

    const result = await res.json();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[createWifiSsid]", error);
    return { success: false, error: error.message };
  }
}

export async function updateWifiSsid(id: string, data: any) {
  try {
    const res = await fetch(`${API_URL}/api/master/wifi-ssid/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Gagal update: ${res.status}`);
    }

    const result = await res.json();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[updateWifiSsid]", error);
    return { success: false, error: error.message };
  }
}

export async function deleteWifiSsid(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/master/wifi-ssid/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) throw new Error(`Gagal delete: ${res.status}`);

    const result = await res.json();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[deleteWifiSsid]", error);
    return { success: false, error: error.message };
  }
}
