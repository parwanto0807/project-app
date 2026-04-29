"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchLocations() {
  try {
    const res = await fetch(`${API_URL}/api/master/location`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("[fetchLocations]", error);
    return { success: false, error: error.message };
  }
}

export async function createLocation(data: any) {
  try {
    const res = await fetch(`${API_URL}/api/master/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) throw new Error(`Gagal create: ${res.status}`);

    const result = await res.json();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[createLocation]", error);
    return { success: false, error: error.message };
  }
}

export async function updateLocation(id: string, data: any) {
  try {
    const res = await fetch(`${API_URL}/api/master/location/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) throw new Error(`Gagal update: ${res.status}`);

    const result = await res.json();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[updateLocation]", error);
    return { success: false, error: error.message };
  }
}

export async function deleteLocation(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/master/location/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) throw new Error(`Gagal delete: ${res.status}`);

    const result = await res.json();
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[deleteLocation]", error);
    return { success: false, error: error.message };
  }
}
