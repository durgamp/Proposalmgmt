import { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service';
import type { CreateCommentDto, UpdateCommentDto } from '../validators/section.validators';

export const commentController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comments = await commentService.getByProposal(req.params.proposalId, req.params.sectionKey);
      res.json(comments);
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comment = await commentService.create(req.params.proposalId, {
        ...(req.body as CreateCommentDto),
        sectionKey: req.params.sectionKey,
      });
      res.status(201).json(comment);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comment = await commentService.update(
        req.params.proposalId,
        req.params.commentId,
        req.body as UpdateCommentDto,
      );
      res.json(comment);
    } catch (err) { next(err); }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userEmail } = req.body as { userEmail: string };
      await commentService.delete(req.params.proposalId, req.params.commentId, userEmail);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
