// utils/imageConverter.ts

export const convertImgUrlToPngBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Penting: Mengizinkan akses gambar beda domain (CORS)
    img.crossOrigin = "Anonymous"; 
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Gagal membuat canvas context"));
        return;
      }

      // Gambar ulang image (WebP) ke dalam Canvas
      ctx.drawImage(img, 0, 0);

      // Export paksa menjadi PNG Base64
      // PNG dipilih karena lossless dan support transparansi (aman untuk semua PDF lib)
      const dataURL = canvas.toDataURL("image/png");
      
      resolve(dataURL);
    };

    img.onerror = (error) => {
      console.error("Gagal memuat gambar untuk konversi:", url, error);
      // Return gambar placeholder transparan atau statis jika gagal
      resolve("/images/placeholder-error.png"); 
    };

    // Trigger load gambar
    img.src = url;
  });
};