// utils/makeImageSrc.ts
export const makeImageSrc = (val?: string | null): string => {
  if (!val) return "";
  if (val.startsWith("http")) return val; // full URL
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  return `${base}${val}`;
};

export const makeImageSrcEmployee = (val?: string | null): string => {
  if (!val) return "";
  if (val.startsWith("http")) return val;
  return `http://localhost:5000/images/employee/${val}`;
};

export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Gagal convert gambar:", error);
    return ""; // Return string kosong atau placeholder jika gagal
  }
};
