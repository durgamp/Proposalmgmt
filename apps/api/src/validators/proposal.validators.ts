import { z } from 'zod';
import { ProposalMethod } from '@biopropose/shared-types';

const proposalCodeRegex = /^[A-Za-z0-9\-_]+$/;

export const createProposalSchema = z.object({
  name:                z.string().min(1, 'Name is required').max(500),
  client:              z.string().min(1, 'Client is required').max(500),
  bdManager:           z.string().min(1, 'BD Manager is required').max(255),
  proposalManager:     z.string().max(255).optional(),
  proposalCode:        z.string().min(1, 'Proposal code is required').max(100)
                         .regex(proposalCodeRegex, 'Code must be alphanumeric with hyphens/underscores'),
  method:              z.nativeEnum(ProposalMethod),
  templateId:          z.string().uuid().optional(),
  sourceProposalId:    z.string().uuid().optional(),
  businessUnit:        z.string().max(255).optional(),
  templateType:        z.string().max(255).optional(),
  description:         z.string().max(5000).optional(),
  sfdcOpportunityCode: z.string().max(255).optional(),
  assignedStakeholders: z.array(z.string().email()).default([]),
  createdBy:           z.string().email('createdBy must be a valid email'),
});

export const updateProposalSchema = z.object({
  name:                z.string().min(1).max(500).optional(),
  client:              z.string().min(1).max(500).optional(),
  bdManager:           z.string().max(255).optional(),
  proposalManager:     z.string().max(255).optional(),
  proposalCode:        z.string().max(100)
                         .regex(proposalCodeRegex, 'Code must be alphanumeric with hyphens/underscores')
                         .optional(),
  description:         z.string().max(5000).optional(),
  sfdcOpportunityCode: z.string().max(255).optional(),
  assignedStakeholders: z.array(z.string().email()).optional(),
  updatedBy:           z.string().email('updatedBy must be a valid email'),
});

export const advanceStageSchema = z.object({
  targetStage: z.number().int().min(1).max(5),
  reviewType:  z.enum(['pm', 'management']).optional(),
  updatedBy:   z.string().email('updatedBy must be a valid email'),
});

export const softDeleteSchema = z.object({
  deletedBy: z.string().email('deletedBy must be a valid email'),
});

export const amendmentSchema = z.object({
  name:                z.string().min(1, 'Name is required').max(500),
  proposalCode:        z.string().min(1, 'Proposal code is required').max(100)
                         .regex(proposalCodeRegex, 'Code must be alphanumeric with hyphens/underscores'),
  client:              z.string().min(1, 'Client is required').max(500),
  bdManager:           z.string().min(1, 'BD Manager is required').max(255),
  proposalManager:     z.string().max(255).optional(),
  description:         z.string().max(5000).optional(),
  sfdcOpportunityCode: z.string().max(255).optional(),
  assignedStakeholders: z.array(z.string().email()).default([]),
  createdBy:           z.string().email('createdBy must be a valid email'),
});

// For 'revise' mode only updatedBy is required; clone/new also need name/proposalCode/client/bdManager
export const reopenSchema = z.object({
  mode:                z.enum(['clone', 'revise', 'new']),
  name:                z.string().max(500).optional(),
  proposalCode:        z.string().max(100).optional(),
  client:              z.string().max(500).optional(),
  bdManager:           z.string().max(255).optional(),
  description:         z.string().max(5000).optional(),
  sfdcOpportunityCode: z.string().max(255).optional(),
  assignedStakeholders: z.array(z.string().email()).default([]),
  updatedBy:           z.string().email('updatedBy must be a valid email'),
}).superRefine((data, ctx) => {
  if (data.mode !== 'revise') {
    if (!data.name?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Name is required for clone/new', path: ['name'] });
    }
    if (!data.proposalCode?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Proposal code is required for clone/new', path: ['proposalCode'] });
    } else if (!proposalCodeRegex.test(data.proposalCode)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Code must be alphanumeric with hyphens/underscores', path: ['proposalCode'] });
    }
    if (!data.client?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Client is required for clone/new', path: ['client'] });
    }
    if (!data.bdManager?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'BD Manager is required for clone/new', path: ['bdManager'] });
    }
  }
});

export const listProposalsQuerySchema = z.object({
  page:      z.coerce.number().int().min(1).max(10_000).default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  search:    z.string().max(200).optional(),
  status:    z.string().optional(),
  stage:     z.coerce.number().int().min(1).max(5).optional(),
  sortBy:    z.enum(['createdAt', 'updatedAt', 'name', 'client', 'status', 'currentStage', 'proposalCode']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProposalDto  = z.infer<typeof createProposalSchema>;
export type UpdateProposalDto  = z.infer<typeof updateProposalSchema>;
export type AdvanceStageDto    = z.infer<typeof advanceStageSchema>;
export type SoftDeleteDto      = z.infer<typeof softDeleteSchema>;
export type AmendmentDto       = z.infer<typeof amendmentSchema>;
export type ReopenDto          = z.infer<typeof reopenSchema>;
export type ListProposalsQuery = z.infer<typeof listProposalsQuerySchema>;
