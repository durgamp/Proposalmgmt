import { Request, Response, NextFunction } from 'express';
import { costService } from '../services/cost.service';
import type { BulkSaveCostsDto, BulkSaveStagesDto } from '../validators/cost.validators';

export const costController = {
  getCosts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await costService.getCosts(req.params.proposalId);
      res.json(items);
    } catch (err) { next(err); }
  },

  saveCosts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await costService.saveCosts(req.params.proposalId, req.body as BulkSaveCostsDto);
      res.json(items);
    } catch (err) { next(err); }
  },

  getSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await costService.getCosts(req.params.proposalId);
      const summary = costService.computeSummary(items);
      res.json(summary);
    } catch (err) { next(err); }
  },

  getTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [stages, activities] = await Promise.all([
        costService.getStages(req.params.proposalId),
        costService.getActivities(req.params.proposalId),
      ]);
      res.json({ stages, activities });
    } catch (err) { next(err); }
  },

  saveTimeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await costService.saveTimeline(req.params.proposalId, req.body as BulkSaveStagesDto);
      res.json(result);
    } catch (err) { next(err); }
  },
};
