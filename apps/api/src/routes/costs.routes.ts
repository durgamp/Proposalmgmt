import { Router } from 'express';
import { validate } from '../middleware/validate';
import { bulkSaveCostsSchema, bulkSaveStagesSchema } from '../validators/cost.validators';
import { costController } from '../controllers/cost.controller';

const router = Router({ mergeParams: true });

// Cost items
router.get('/', costController.getCosts);
router.post('/', validate({ body: bulkSaveCostsSchema }), costController.saveCosts);
router.get('/summary', costController.getSummary);

// Timeline (stages + activities)
router.get('/timeline', costController.getTimeline);
router.post('/timeline', validate({ body: bulkSaveStagesSchema }), costController.saveTimeline);

export default router;
