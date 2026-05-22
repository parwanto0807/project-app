import express from 'express';
import { cdataGet, cdataPost, getRequest, deviceCmd } from '../../controllers/iclock/iclockController.js';

const router = express.Router();

// Mesin ZKTeco (ADMS) biasanya mengirimkan payload dalam format text/plain
// Jadi kita gunakan middleware bodyParser.text() khusus untuk router ini
router.use(express.text({ type: '*/*' })); // Parse semua body sebagai text untuk router ini

// Route standar Push Protocol ADMS ZKTeco/Solution
router.get('/cdata', cdataGet);
router.post('/cdata', cdataPost);
router.get('/getrequest', getRequest);
router.post('/devicecmd', deviceCmd);

export default router;
