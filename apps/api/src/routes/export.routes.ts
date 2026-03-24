import { Router } from 'express';
import { validate } from '../middleware/validate';
import { exportSchema } from '../validators/cost.validators';
import { exportController } from '../controllers/export.controller';

const router = Router({ mergeParams: true });

router.get('/', exportController.list);
router.post('/pdf', validate({ body: exportSchema }), exportController.pdf);
router.post('/word', validate({ body: exportSchema }), exportController.word);

export default router;
