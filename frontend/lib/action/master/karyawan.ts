"use server";

export async function fetchAllKaryawan() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/karyawan/getAllKaryawan`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);

    const data = await res.json();
    console.log("Data Karyawan", data);

    return { karyawan: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllKaryawan]", error);
    return { karyawan: [], isLoading: false };
  }
}

export async function fetchKaryawanById(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/karyawan/getKaryawanById/${id}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);

    const data = await res.json();
    return { karyawan: data || null, isLoading: false };
  } catch (error) {
    console.error("[fetchKaryawanById]", error);
    return { karyawan: null, isLoading: false };
  }
}

export async function fetchAllGaji() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/gaji/getAllGaji`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);

    const data = await res.json();
    return { gaji: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllGaji]", error);
    return { gaji: [], isLoading: false };
  }
}

export async function fetchGajiById(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/gaji/getGajiById/${id}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);

    const data = await res.json();
    return { gaji: data || null, isLoading: false };
  } catch (error) {
    console.error("[fetchGajiById]", error);
    return { gaji: null, isLoading: false };
  }
}

export async function fetchAllTeam() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/team/getAllTeam`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);

    const data = await res.json();
    return { team: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllTeam]", error);
    return { team: [], isLoading: false };
  }
}

export async function fetchTeamById(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/master/team/getTeamById/${id}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);

    const data = await res.json();
    return { team: data || null, isLoading: false };
  } catch (error) {
    console.error("[fetchTeamById]", error);
    return { team: null, isLoading: false };
  }
}
