// utils/makeImageSrc.ts

// URL VPS Production Anda (Tempat file gambar fisik berada)
const VPS_ASSET_URL = "https://solusiit.id";

export const makeImageSrc = (val?: string | null): string => {
  // 1. Validasi Input
  if (!val) return "/images/placeholder.png"; // Return placeholder lokal jika null

  // 2. Jika sudah URL lengkap (http/https) atau Base64, kembalikan langsung
  if (val.startsWith("http") || val.startsWith("data:")) return val;

  // 3. Tentukan Base URL
  // Logic: Jika sedang Development, "pinjam" gambar dari VPS.
  //        Jika sedang Production, gunakan API URL sendiri.
  const isDev = process.env.NODE_ENV === "development";

  const baseUrl = isDev
    ? VPS_ASSET_URL
    : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "");

  // 4. Pastikan path diawali slash '/'
  const cleanPath = val.startsWith("/") ? val : `/${val}`;

  return `${baseUrl}${cleanPath}`;
};

export const makeImageSrcEmployee = (val?: string | null): string => {
  if (!val) return "";
  if (val.startsWith("http")) return val;

  // Kita gunakan ulang fungsi makeImageSrc agar logikanya satu pintu
  // Asumsi: Foto karyawan ada di folder /images/employee/
  return makeImageSrc(`/images/employee/${val}`);
};

export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    // Tambahkan mode 'cors' agar browser mengizinkan request ke domain lain
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Gagal convert gambar:", error);
    return "";
  }
};