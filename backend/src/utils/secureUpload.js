import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Upload gambar yang aman:
 *  - batasi ukuran file (default 5 MB)
 *  - hanya izinkan MIME gambar (jpg/jpeg/png/webp)
 *  - ekstensi file ditentukan dari MIME (bukan nama asli user)
 *  - folder tujuan dibuat otomatis
 */
const IMAGE_MIME_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const IMAGE_MIMES = Object.keys(IMAGE_MIME_EXT);

export function imageFileFilter(_req, file, cb) {
  if (!IMAGE_MIME_EXT[file.mimetype]) {
    return cb(new Error("INVALID_FILE_TYPE"));
  }
  cb(null, true);
}

export function createImageUpload(subdir = "images", maxSizeMB = 5, maxFiles = 2) {
  const destination = path.join(process.cwd(), "public", subdir.replace(/^\/+/, ""));
  fs.mkdirSync(destination, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => {
      const ext = IMAGE_MIME_EXT[file.mimetype] || ".jpg";
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024, files: maxFiles },
    fileFilter: imageFileFilter,
  });
}

/**
 * Upload dokumen (PO, lampiran, dsb) ke memory — filter tipe & ukuran.
 */
const DOC_MIME_EXT = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export const DOC_MIMES = Object.keys(DOC_MIME_EXT);

export function docFileFilter(_req, file, cb) {
  if (!DOC_MIME_EXT[file.mimetype]) {
    return cb(new Error("INVALID_FILE_TYPE"));
  }
  cb(null, true);
}

export function createDocumentUpload(maxSizeMB = 10, maxFiles = 3) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMB * 1024 * 1024, files: maxFiles },
    fileFilter: docFileFilter,
  });
}
