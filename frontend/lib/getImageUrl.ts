// lib/getImageUrl.ts
export const getImageUrl = (url: string): string => {
  // Jika sudah URL lengkap, kembalikan langsung
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Pastikan url dimulai dengan `/images/` (sesuai struktur Anda)
  if (url.startsWith("/images/")) {
    if (process.env.NODE_ENV === "development") {
      return `http://localhost:5000${url}`;
    } else {
      // Ganti dengan domain backend production Anda
      return `https://api.rylif-app.com${url}`;
      // atau jika pakai domain utama: `https://solusiit.net${url}`
    }
  }

  // Fallback: kembalikan apa adanya (misal: URL eksternal)
  return url;
};

export const getImageUrlTransaction = (url: string): string => {
  if (
    process.env.NODE_ENV === "development" &&
    url.startsWith("/transaction/")
  ) {
    return `http://localhost${url}`;
  }
  return url;
};

// lib/getImageUrl.ts
// lib/getImageUrl.ts
export const getImageUrlBap = (imagePath: string): string => {
    if (!imagePath) return "/placeholder.jpg";
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    
    // Jika sudah full URL, return langsung
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // Jika path sudah lengkap (dimulai dengan /images/)
    if (imagePath.startsWith('/images/')) {
        return `${API_URL}${imagePath}`;
    }
    
    // Jika path dimulai dengan / tapi bukan /images/
    if (imagePath.startsWith('/')) {
        return `${API_URL}/images${imagePath}`;
    }
    
    // Untuk filename saja (kasus error) - tambahkan path lengkap
    return `${API_URL}/images/spk/${imagePath}`;
};