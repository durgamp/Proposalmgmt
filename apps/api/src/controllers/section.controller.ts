import { Request, Response, NextFunction } from 'express';
import { sectionService } from '../services/section.service';
import type { UpdateSectionDto } from '../validators/section.validators';

export const sectionController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sections = await sectionService.getByProposal(req.params.proposalId);
      res.json(sections);
    } catch (err) { next(err); }
  },

  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const section = await sectionService.getOne(req.params.proposalId, req.params.sectionKey);
      res.json(section);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const section = await sectionService.update(
        req.params.proposalId,
        req.params.sectionKey,
        req.body as UpdateSectionDto,
      );
      res.json(section);
    } catch (err) { next(err); }
  },
};
