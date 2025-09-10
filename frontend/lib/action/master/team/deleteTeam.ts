'use server';

import { revalidatePath } from 'next/cache';

export async function deleteTeam(id: string) {
  if (!id) {
    return { success: false, error: 'ID team diperlukan' };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/deleteTeam/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Gagal menghapus team' };
    }

    // Revalidate halaman daftar team
    revalidatePath('/admin-area/master/team');

    return { success: true, message: 'Team berhasil dihapus' };

  } catch (error) {
    console.error('Error deleting team:', error);
    return { success: false, error: 'Terjadi kesalahan saat menghapus team' };
  }
}