import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

export const analyticsController = {
  getKpis: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        year: req.query.year ? Number(req.query.year) : undefined,
        month: req.query.month ? Number(req.query.month) : undefined,
        templateType: req.query.templateType as string | undefined,
        proposalManager: req.query.proposalManager as string | undefined,
      };
      const kpis = await analyticsService.getKpis(filters);
      res.json(kpis);
    } catch (err) { next(err); }
  },

  getStageDistribution: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await analyticsService.getStageDistribution());
    } catch (err) { next(err); }
  },

  getTemplateDistribution: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await analyticsService.getTemplateDistribution());
    } catch (err) { next(err); }
  },

  getMonthlyTrends: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      res.json(await analyticsService.getMonthlyTrends(year));
    } catch (err) { next(err); }
  },

  getCostSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await analyticsService.getCostSummary());
    } catch (err) { next(err); }
  },

  getRecentActivity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      res.json(await analyticsService.getRecentActivity(limit));
    } catch (err) { next(err); }
  },
};
