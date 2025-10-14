// utils/fileUtils.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Untuk mendapatkan __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deleteFinanceFile = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const filename = fileUrl.split('/').pop();
    const filePath = path.join(process.cwd(), 'public', 'images', 'finance', filename);
    
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`✅ File berhasil dihapus: ${filePath}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`⚠️ File tidak ditemukan: ${filePath}`);
    } else {
      console.error('❌ Error menghapus file:', error);
    }
    return false;
  }
};

export default deleteFinanceFile;