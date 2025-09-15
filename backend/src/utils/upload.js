// /backend/utils/upload.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './public/images/spk';
    // Buat folder jika belum ada
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Filter hanya gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan'), false);
  }
};

// Upload single file
export const uploadSingle = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // max 5MB per file
});

// Upload multiple files
export const uploadMultiple = multer({ 
  storage, 
  fileFilter, 
  limits: { 
    fileSize: 5 * 1024 * 1024, // max 5MB per file
    files: 10 // max 10 files
  }
});

// Export default jika diperlukan
export default {
  uploadSingle,
  uploadMultiple
};