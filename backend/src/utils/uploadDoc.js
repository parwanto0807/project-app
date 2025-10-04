import multer from "multer";
import path from "path";
import fs from "fs";

// Fungsi untuk membuat folder jika belum ada
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Konfigurasi storage untuk quotation attachments
const quotationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "public/document/quotation";
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename =
      path.basename(file.originalname, ext) + "-" + uniqueSuffix + ext;
    cb(null, filename);
  },
});

// Filter file yang diizinkan
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Jenis file tidak diizinkan"), false);
  }
};

// Konfigurasi multer untuk quotation
export const quotationUpload = multer({
  storage: quotationStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

export default {
  quotationUpload,
};
