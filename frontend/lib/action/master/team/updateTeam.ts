'use server';

import { revalidatePath } from 'next/cache';

export async function updateTeam(id: string, formData: FormData) {
  if (!id) {
    return { success: false, error: 'ID team diperlukan' };
  }

  const namaTeam = formData.get('namaTeam') as string;

  if (!namaTeam?.trim()) {
    return { success: false, error: 'Nama team wajib diisi' };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/updateTeam/${id}`, {
      method: 'PUT',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ namaTeam: namaTeam.trim() }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Gagal memperbarui team' };
    }

    const updatedTeam = await res.json();

    // Revalidate halaman daftar team dan detail team
    revalidatePath('/admin-area/master/team');
    revalidatePath(`/admin-area/master/team/${id}`);

    return { success: true,  updatedTeam };

  } catch (error) {
    console.error('Error updating team:', error);
    return { success: false, error: 'Terjadi kesalahan saat memperbarui team' };
  }
}