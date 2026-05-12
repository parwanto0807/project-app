import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Converts an image buffer to WebP format and saves it to the specified directory.
 * @param {Buffer} buffer - The image buffer to process.
 * @param {string} targetDir - The directory where the file should be saved.
 * @param {string} prefix - Filename prefix (e.g., 'opex').
 * @returns {Promise<string>} - The generated filename.
 */
export const convertToWebP = async (buffer, targetDir, prefix = 'img') => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${prefix}-${timestamp}-${random}.webp`;
  const filePath = path.join(targetDir, filename);

  await sharp(buffer)
    .webp({ quality: 80 }) // Adjust quality as needed
    .toFile(filePath);

  return filename;
};

/**
 * Processes an uploaded file. If it's an image, converts to WebP. 
 * If it's a PDF, saves it as is.
 * @param {Object} file - The file object from multer (memoryStorage).
 * @param {string} targetDir - The directory where the file should be saved.
 * @param {string} prefix - Filename prefix.
 * @returns {Promise<string>} - The generated filename.
 */
export const processUpload = async (file, targetDir, prefix = 'opex') => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  if (file.mimetype === 'application/pdf') {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    const filename = `${prefix}-${timestamp}-${random}${ext}`;
    const filePath = path.join(targetDir, filename);
    
    fs.writeFileSync(filePath, file.buffer);
    return filename;
  }

  // Handle images
  const filename = `${prefix}-${timestamp}-${random}.webp`;
  const filePath = path.join(targetDir, filename);

  await sharp(file.buffer)
    .webp({ quality: 80 })
    .toFile(filePath);

  return filename;
};
