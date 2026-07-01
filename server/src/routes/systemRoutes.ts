import { Router } from 'express';
import { getEnvironment } from '../controllers/systemController';

const router = Router();
router.get('/api/system/environment', getEnvironment);
export default router;
