import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';

export const auditController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const result = await auditService.getByProposal(req.params.proposalId, page, limit);
      res.json(result);
    } catch (err) { next(err); }
  },
};
