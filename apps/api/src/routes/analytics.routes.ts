import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/kpis', analyticsController.getKpis);
router.get('/stage-distribution', analyticsController.getStageDistribution);
router.get('/template-distribution', analyticsController.getTemplateDistribution);
router.get('/monthly-trends', analyticsController.getMonthlyTrends);
router.get('/cost-summary', analyticsController.getCostSummary);
router.get('/recent-activity', analyticsController.getRecentActivity);

export default router;
