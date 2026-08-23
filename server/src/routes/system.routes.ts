import { Router } from 'express';
import { SystemController } from '../controllers/system.controller.js';

const router = Router();

router.get('/status', SystemController.getStatus);

export default router;
