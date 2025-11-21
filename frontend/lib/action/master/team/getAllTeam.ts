'use server';

export async function getAllTeam(page = 1, limit = 10, search = '') {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add search parameter if provided
    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/getAllTeam?${params.toString()}`, {
      method: 'GET',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      // Jangan cache di server
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const responseData = await res.json();
    
    return { 
      success: true,  
      data: responseData.data,
      pagination: responseData.pagination
    };

  } catch (error) {
    console.error('Error fetching teams:', error);
    return { 
      success: false, 
      error: 'Gagal mengambil data team',
      data: [],
      pagination: null
    };
  }
}