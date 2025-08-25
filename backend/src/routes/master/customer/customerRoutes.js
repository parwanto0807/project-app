// routes/customerRoutes.js
import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerCount
} from '../../../controllers/master/customer/customerController.js';
import { authorizeAdmin, authorizeSuperAdmin } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/getAllCustomers', getAllCustomers);
router.get('/getCustomerCount', getCustomerCount);
router.get('/getCustomerById/:id', getCustomerById);
router.post('/createCustomer', createCustomer, authorizeAdmin, authorizeSuperAdmin);
router.put('/updateCustomer/:id', updateCustomer, authorizeAdmin, authorizeSuperAdmin);
router.delete('/deleteCustomer/:id', deleteCustomer, authorizeAdmin, authorizeSuperAdmin);

export default router;
