
import { BAPData, BAPPhoto } from "./bapPdfPreview";
import { getImageUrl } from "@/lib/getImageUrl";

/**
 * Mengkonversi gambar WebP (atau URL lainnya) menjadi JPEG Data URL
 * @param url URL gambar sumber
 * @returns Promise yang resolve ke data URL JPEG
 */
export const convertImageToJpg = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Penting untuk gambar dari domain lain/CORS

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Gagal membuat canvas 2D Context"));
                    return;
                }

                // Gambar background putih (opsional, untuk transparan)
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Convert to JPEG Data URL
                const dataUrl = canvas.toDataURL("image/jpeg", 0.85); // Quality 0.85
                resolve(dataUrl);
            } catch (err) {
                console.error("Error converting image in canvas:", err);
                // Jika error saat convert, return original URL (fallback)
                // Tapi untuk react-pdf kemungkinan besar akan tetap gagal jika WebP
                resolve(url);
            }
        };

        img.onerror = (err) => {
            console.error("Gagal memuat gambar untuk konversi:", url, err);
            // Default fallback image jika gagal load
            resolve("/placeholder.jpg");
        };

        img.src = url;
    });
};

/**
 * Memproses semua foto dalam BAPData untuk dikonversi ke format yang didukung PDF (JPEG)
 * @param bap Data BAP original
 * @returns Promise berisi BAPData baru dengan URL foto yang sudah dikonversi
 */
export const processBapImagesForPdf = async (bap: BAPData): Promise<BAPData> => {
    if (!bap.photos || bap.photos.length === 0) {
        return bap;
    }

    // Deep copy BAP object to avoid mutating state directly
    const newBap = JSON.parse(JSON.stringify(bap)) as BAPData;

    // Pastikan newBap.photos ada (karena JSON.parse mungkin mengubah undefined/null)
    if (!newBap.photos) return newBap;

    // Proses konversi semua foto secara parallel
    const conversionPromises = newBap.photos.map(async (photo: BAPPhoto) => {
        let originalUrl = getImageUrl(photo.photoUrl);

        // Jika mode development dan URL mengarah ke VPS, gunakan proxy lokal untuk bypass CORS
        if (process.env.NODE_ENV !== "production" && originalUrl.includes("api.rylif-app.com/images")) {
            // Ubah https://api.rylif-app.com/images/... menjadi /api-proxy/images/...
            originalUrl = originalUrl.replace("https://api.rylif-app.com/images", "/api-proxy/images");
            console.log("Using proxy URL:", originalUrl);
        }
        // Cek ekstensi file, jika .webp atau tidak diketahui, lakukan konversi
        // Sebenarnya aman untuk convert semua agar konsisten, tapi kita bisa filter

        // Convert!
        try {
            const convertedUrl = await convertImageToJpg(originalUrl);
            return {
                ...photo,
                photoUrl: convertedUrl
            };
        } catch (error) {
            console.error(`Gagal convert foto ${photo.id}:`, error);
            return photo; // Kembalikan apa adanya jika error fatal
        }
    });

    const newPhotos = await Promise.all(conversionPromises);
    newBap.photos = newPhotos;

    return newBap;
};
