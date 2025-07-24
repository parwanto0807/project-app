import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../controllers/master/product/productController.js';
import { authorizeAdmin } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/getAllProducts', getAllProducts);
router.get('/getProductById/:id', getProductById);
router.post('/createProduct', createProduct, authorizeAdmin);
router.put('/updateProduct/:id', updateProduct, authorizeAdmin);
router.delete('/deleteProduct/:id', deleteProduct, authorizeAdmin);

export default router;
