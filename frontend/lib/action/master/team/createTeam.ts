"use server";

import { revalidatePath } from "next/cache";

interface TeamState {
  success: boolean;
  error: string | null;
  newTeam?: {
    id: string;
    namaTeam: string;
  };
}

export async function createTeam(
  prevState: TeamState,
  formData: FormData
): Promise<TeamState> {
  const namaTeam = formData.get("namaTeam") as string;
  const deskripsi = formData.get("deskripsi") as string;
  const karyawanIds = formData.getAll("karyawanIds") as string[];

  if (!namaTeam?.trim()) {
    return { success: false, error: "Nama team wajib diisi" };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/team/createTeam`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          namaTeam: namaTeam.trim(),
          deskripsi: deskripsi?.trim() || "",
          karyawanIds: karyawanIds,
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP error! status: ${res.status}`,
      };
    }

    const newTeam = await res.json();
    revalidatePath("/admin-area/master/team");

    return {
      success: true,
      newTeam,
      error: null,
    };
  } catch (error: unknown) {
    // ✅ Ganti 'any' → 'unknown'
    console.error("Error creating team:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tidak terduga saat membuat team",
    };
  }
}
