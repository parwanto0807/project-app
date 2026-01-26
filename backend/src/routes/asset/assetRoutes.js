import express from 'express';
import { assetController } from '../../controllers/asset/assetController.js';
import maintenanceRoutes from './assetMaintenanceRoutes.js';
import { assetCategoryController } from '../../controllers/asset/assetCategoryController.js';

const router = express.Router();

// Asset Category Routes
router.get('/categories', assetCategoryController.getAll);
router.post('/categories', assetCategoryController.create);
router.put('/categories/:id', assetCategoryController.update);
router.delete('/categories/:id', assetCategoryController.delete);

// Fixed Asset Routes
router.get('/', assetController.getAll);
router.get('/:id', assetController.getById);
router.post('/', assetController.create);
router.put('/:id', assetController.update);
router.delete('/:id', assetController.delete);

// Actions
router.post('/:id/depreciate', assetController.postDepreciation);
router.post('/:id/dispose', assetController.dispose);
router.post('/bulk', assetController.bulkCreate);

// Maintenance Sub-routes
router.use('/maintenance', maintenanceRoutes);

export default router;
