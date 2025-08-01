import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../controllers/master/product/productController.js';
import { authorizeAdmin, authorizeSuperAdmin, authorizeAdminOrSuper, authenticateToken } from '../../../middleware/authMiddleware.js';

// 1. Konfigurasi Multer untuk menyimpan image di /public/images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'public/images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = express.Router();

// 2. Serve folder images (pastikan di app utama, bukan router ini)
  // app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

router.get('/getAllProducts',authenticateToken, authorizeAdminOrSuper, getAllProducts);
router.get('/getProductById/:id', getProductById);

// 3. CREATE (POST) – upload image & authorization dulu baru createProduct
router.post(
  '/createProduct',
  authorizeSuperAdmin,
  upload.single('image'),
  createProduct
);

// 4. UPDATE (PUT) – jika ingin support update gambar, bisa pakai upload.single('image') juga
router.put(
  '/updateProduct/:id',
  authorizeAdmin,
  authorizeSuperAdmin,
  upload.single('image'),
  updateProduct
);

// 5. DELETE
router.delete(
  '/deleteProduct/:id',
  authorizeAdmin,
  authorizeSuperAdmin,
  deleteProduct
);

export default router;
