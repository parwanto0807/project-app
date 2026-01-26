import express from 'express';
import { assetMaintenanceController } from '../../controllers/asset/assetMaintenanceController.js';

const router = express.Router();

router.get('/asset/:assetId', assetMaintenanceController.getByAssetId);
router.post('/', assetMaintenanceController.create);
router.put('/:id', assetMaintenanceController.update);
router.delete('/:id', assetMaintenanceController.delete);

export default router;
