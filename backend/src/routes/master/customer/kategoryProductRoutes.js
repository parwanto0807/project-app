import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../../controllers/master/product/kategoryProductController.js';

const router = express.Router();

router.get('/getAllCategories', getAllCategories);
router.get('/getCategoryById/:id', getCategoryById);
router.post('/createCategory', createCategory);
router.put('/updateCategory/:id', updateCategory);
router.delete('/deleteCategory/:id', deleteCategory);

export default router;
