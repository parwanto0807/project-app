'use server';

export async function getAllTeam() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/getAllTeam`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Jangan cache di server
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return { success: true,  data };

  } catch (error) {
    console.error('Error fetching teams:', error);
    return { success: false, error: 'Gagal mengambil data team' };
  }
}