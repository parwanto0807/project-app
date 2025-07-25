import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../controllers/master/product/productController.js';
import { authorizeAdmin, authorizeSuperAdmin } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/getAllProducts', getAllProducts);
router.get('/getProductById/:id', getProductById);
router.post('/createProduct', createProduct, authorizeAdmin, authorizeSuperAdmin);
router.put('/updateProduct/:id', updateProduct, authorizeAdmin, authorizeSuperAdmin);
router.delete('/deleteProduct/:id', deleteProduct, authorizeAdmin, authorizeSuperAdmin);

export default router;
