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
    return { karyawan: data || [], isLoading: false };
  } catch (error) {
    console.error("[fetchAllKaryawan]", error);
    return { karyawan: [], isLoading: false };
  }
}

export const fetchKaryawanByEmail = async (email: string) => {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/karyawan/fetchKaryawanByEmail`;

  try {
    console.log('🔍 Mengirim permintaan ke:', apiUrl, 'dengan email:', email);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      credentials: "include",
      cache: "no-store",
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      if (response.status === 404) {
        console.error(`Error: Karyawan dengan email ${email} tidak ditemukan.`);
        return null;
      }
      throw new Error(`Gagal mengambil data user. Status: ${response.status} | ${errorText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Terjadi kesalahan saat fetching data user:", error);
    return null;
  }
};

export async function fetchKaryawanById(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/karyawan/getKaryawanById/${id}`,
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

export const fetchUserByEmail = async (email: string) => {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/karyawan/fetchUserByEmail`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }), // ✅ kirim email dari form
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Error: User dengan email ${email} tidak ditemukan.`);
        return null;
      }
      throw new Error(`Gagal mengambil data user. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Terjadi kesalahan saat fetching data user:", error);
    return null;
  }
};

export interface AccountEmail {
  id: string;
  email: string;
  createdAt: string;
}

export type CheckAccountEmailResult = {
  exists: boolean;
  error?: string; // opsional, hanya untuk error server
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL; // e.g., "http://localhost:3000"

export async function checkAccountEmail(
  email: string
): Promise<CheckAccountEmailResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/karyawan/checkAccountEmail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        exists: false,
        error: errorData.error || "Gagal memeriksa email",
      };
    }

    const data = await response.json();
    return { exists: data.exists ?? false, error: undefined };
  } catch (err) {
    console.error("Gagal cek email:", err);
    return { exists: false, error: "Terjadi kesalahan jaringan" };
  }
}

// Simpan email baru
// Simpan email
export async function createAccountEmail(
  email: string
): Promise<AccountEmail | null> {
  const response = await fetch(`${BASE_URL}/api/karyawan/createAccountEmail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.data as AccountEmail; // langsung kembalikan AccountEmail
}
