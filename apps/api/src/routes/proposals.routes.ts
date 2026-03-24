import { Router } from 'express';
import { validate } from '../middleware/validate';
import {
  createProposalSchema,
  updateProposalSchema,
  advanceStageSchema,
  softDeleteSchema,
  amendmentSchema,
  reopenSchema,
  listProposalsQuerySchema,
} from '../validators/proposal.validators';
import { proposalController } from '../controllers/proposal.controller';

const router = Router();

router.get('/', validate({ query: listProposalsQuerySchema }), proposalController.list);
router.post('/', validate({ body: createProposalSchema }), proposalController.create);
router.get('/:id', proposalController.getById);
router.put('/:id', validate({ body: updateProposalSchema }), proposalController.update);
router.delete('/:id', validate({ body: softDeleteSchema }), proposalController.softDelete);
router.post('/:id/advance-stage', validate({ body: advanceStageSchema }), proposalController.advanceStage);
router.post('/:id/amendment', validate({ body: amendmentSchema }), proposalController.createAmendment);
router.post('/:id/reopen', validate({ body: reopenSchema }), proposalController.reopen);

export default router;
