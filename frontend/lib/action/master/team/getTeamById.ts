'use server';

export async function getTeamById(id: string) {
  if (!id) {
    return { success: false, error: 'ID team diperlukan' };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/getTeamById/${id}`, {
      method: 'GET',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { success: false, error: 'Team tidak ditemukan' };
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return { success: true,  data };

  } catch (error) {
    console.error('Error fetching team by ID:', error);
    return { success: false, error: 'Gagal mengambil data team' };
  }
}