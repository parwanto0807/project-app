// GANTI INI dengan domain VPS tempat gambar aslinya berada
const VPS_BASE_URL = "https://api.rylif-app.com";

// Helper internal untuk menentukan Base URL
const getBaseUrl = () => {
  // JIKA DEV (Laptop): Gunakan localhost. 
  // Note: NEXT_PUBLIC_API_URL mungkin tersetting ke VPS di .env, jadi kita paksa localhost untuk dev
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:5000";
  }

  // JIKA PROD (Server): Gunakan URL sendiri (env) atau localhost server
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
};

// 1. Get Image URL General
export const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/images/placeholder.jpg"; // Default jika null

  // Jika sudah URL lengkap (http/https) atau base64, kembalikan langsung
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }

  const baseUrl = getBaseUrl().replace(/\/$/, ""); // Hapus slash di akhir jika ada
  const cleanPath = url.startsWith("/") ? url : `/${url}`;

  return `${baseUrl}${cleanPath}`;
};

// 2. Get Image URL Transaction
export const getImageUrlTransaction = (url: string): string => {
  if (!url) return "";
  // Gunakan logika helper utama agar konsisten ambil dari VPS saat dev
  return getImageUrl(url);
};

// 3. Get Image URL BAP (Khusus Logic SPK)
export const getImageUrlBap = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "/placeholder.jpg"; // Ganti dengan path placeholder valid Anda

  // Jika sudah full URL atau Base64
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  const baseUrl = getBaseUrl().replace(/\/$/, "");

  // Skenario 1: Path sudah lengkap (misal: /images/spk/foto.jpg)
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/')) {
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  }

  // Skenario 2: Hanya nama file (misal: foto.jpg), asumsikan folder SPK
  return `${baseUrl}/images/spk/${imagePath}`;
};