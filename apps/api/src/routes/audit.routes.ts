import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';

const router = Router({ mergeParams: true });

router.get('/', auditController.list);

export default router;
