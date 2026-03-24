import { Request, Response, NextFunction } from 'express';
import { proposalService } from '../services/proposal.service';
import { emailService } from '../services/email.service';
import { getStageName } from '../utils/stageAdvancement';
import { ProposalStage } from '@biopropose/shared-types';
import { logger } from '../config/logger';
import type {
  CreateProposalDto, UpdateProposalDto, AdvanceStageDto,
  AmendmentDto, ReopenDto, ListProposalsQuery, SoftDeleteDto,
} from '../validators/proposal.validators';

export const proposalController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await proposalService.list(req.query as unknown as ListProposalsQuery);
      // Expose total count in header for clients that prefer not to parse the body
      res.setHeader('X-Total-Count', String(result.total));
      res.json(result);
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proposal = await proposalService.getById(req.params.id);
      res.json(proposal);
    } catch (err) { next(err); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proposal = await proposalService.create(req.body as CreateProposalDto);
      res.status(201).json(proposal);
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proposal = await proposalService.update(req.params.id, req.body as UpdateProposalDto);
      res.json(proposal);
    } catch (err) { next(err); }
  },

  softDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deletedBy } = req.body as SoftDeleteDto;
      await proposalService.softDelete(req.params.id, deletedBy);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  advanceStage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = req.body as AdvanceStageDto;
      const prevProposal = await proposalService.getById(req.params.id);
      const proposal = await proposalService.advanceStage(req.params.id, dto);

      // Fire-and-forget email notification
      if (dto.targetStage && proposal.assignedStakeholders?.length) {
        emailService.notifyStageAdvanced({
          proposalName: proposal.name,
          proposalCode: proposal.proposalCode,
          fromStage:    getStageName(prevProposal.currentStage as ProposalStage),
          toStage:      getStageName(proposal.currentStage as ProposalStage),
          advancedBy:   dto.updatedBy,
          recipients:   proposal.assignedStakeholders,
        }).catch((emailErr) => {
          logger.warn({ err: emailErr }, '[Email] Stage-advance notification failed (non-fatal)');
        });
      }

      res.json(proposal);
    } catch (err) { next(err); }
  },

  createAmendment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proposal = await proposalService.createAmendment(req.params.id, req.body as AmendmentDto);
      res.status(201).json(proposal);
    } catch (err) { next(err); }
  },

  reopen: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = req.body as ReopenDto;
      const proposal = await proposalService.reopen(req.params.id, dto);
      // 'revise' modifies the existing proposal (200 OK); clone/new create a resource (201 Created)
      const status = dto.mode === 'revise' ? 200 : 201;
      res.status(status).json(proposal);
    } catch (err) { next(err); }
  },
};
