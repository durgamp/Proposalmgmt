import { AppDataSource } from '@biopropose/database';
import {
  ProposalEntity, ProposalSectionEntity, TemplateEntity,
} from '@biopropose/database';
import {
  ProposalStatus, ProposalStage, ProposalMethod,
  SectionKey, AuditAction,
} from '@biopropose/shared-types';
import { Like, FindOptionsWhere } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { auditService } from './audit.service';
import {
  validateStageAdvancement, computeCompletionPercentage, getStageName,
} from '../utils/stageAdvancement';
import { detectChanges } from '../utils/proposalDiff';
import type {
  CreateProposalDto, UpdateProposalDto, AdvanceStageDto,
  AmendmentDto, ReopenDto, ListProposalsQuery,
} from '../validators/proposal.validators';

// Default sections created for every new proposal
const DEFAULT_SECTIONS = [
  { sectionKey: SectionKey.CEO_LETTER,        title: 'CEO Letter',         sortOrder: 0 },
  { sectionKey: SectionKey.EXECUTIVE_SUMMARY, title: 'Executive Summary',  sortOrder: 1 },
  { sectionKey: SectionKey.SCOPE_OF_WORK,     title: 'Scope of Work',      sortOrder: 2 },
  { sectionKey: SectionKey.PROJECT_DETAILS,   title: 'Project Details',    sortOrder: 3 },
  { sectionKey: SectionKey.TERMS_CONDITIONS,  title: 'Terms & Conditions', sortOrder: 4 },
];

export class ProposalService {
  private get repo()         { return AppDataSource.getRepository(ProposalEntity); }
  private get sectionRepo()  { return AppDataSource.getRepository(ProposalSectionEntity); }
  private get templateRepo() { return AppDataSource.getRepository(TemplateEntity); }

  // ── List ─────────────────────────────────────────────────────────────────

  async list(query: ListProposalsQuery): Promise<{ items: ProposalEntity[]; total: number }> {
    if (query.search) {
      const qb = this.repo.createQueryBuilder('p');
      // Trim and limit search to prevent expensive wildcard scans
      const term = query.search.trim().slice(0, 200);
      qb.where(
        '(p.name LIKE :s OR p.client LIKE :s OR p.proposalCode LIKE :s)',
        { s: `%${term}%` },
      );
      if (query.status) qb.andWhere('p.status = :status', { status: query.status });
      if (query.stage)  qb.andWhere('p.currentStage = :stage', { stage: query.stage });
      qb.orderBy(`p.${query.sortBy}`, query.sortOrder.toUpperCase() as 'ASC' | 'DESC');
      qb.skip((query.page - 1) * query.limit).take(query.limit);
      const [items, total] = await qb.getManyAndCount();
      return { items, total };
    }

    const where: FindOptionsWhere<ProposalEntity> = {};
    if (query.status) where.status = query.status as ProposalStatus;
    if (query.stage)  where.currentStage = query.stage as ProposalStage;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { [query.sortBy]: query.sortOrder.toUpperCase() as 'ASC' | 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return { items, total };
  }

  // ── Get by ID ─────────────────────────────────────────────────────────────

  async getById(id: string): Promise<ProposalEntity> {
    const proposal = await this.repo.findOne({
      where: { id },
      relations: ['sections', 'exportedFiles'],
    });
    if (!proposal) throw new AppError(404, `Proposal ${id} not found`, 'NOT_FOUND');
    return proposal;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateProposalDto): Promise<ProposalEntity> {
    // Enforce unique proposal code
    const existing = await this.repo.findOne({ where: { proposalCode: dto.proposalCode } });
    if (existing) {
      throw new AppError(409, `Proposal code '${dto.proposalCode}' already exists`, 'DUPLICATE_CODE');
    }

    // Validate source proposal exists when cloning
    if (dto.method === ProposalMethod.CLONE && dto.sourceProposalId) {
      const sourceExists = await this.repo.findOne({
        where: { id: dto.sourceProposalId },
        select: ['id'],
      });
      if (!sourceExists) {
        throw new AppError(404, `Source proposal '${dto.sourceProposalId}' not found`, 'NOT_FOUND');
      }
    }

    const proposal = this.repo.create({
      id:                        uuid(),
      name:                      dto.name,
      client:                    dto.client,
      bdManager:                 dto.bdManager,
      proposalManager:           dto.proposalManager,
      proposalCode:              dto.proposalCode,
      status:                    ProposalStatus.DRAFT,
      method:                    dto.method,
      businessUnit:              dto.businessUnit,
      templateType:              dto.templateType,
      description:               dto.description,
      sfdcOpportunityCode:       dto.sfdcOpportunityCode,
      currentStage:              ProposalStage.DRAFT_CREATION,
      completionPercentage:      0,
      pmReviewComplete:          false,
      managementReviewComplete:  false,
      isAmendment:               false,
      createdBy:                 dto.createdBy,
      updatedBy:                 dto.createdBy,
    });
    proposal.assignedStakeholders = dto.assignedStakeholders;
    await this.repo.save(proposal);

    // Build section content map from template or source clone
    const sectionContent: Record<string, object> = {};

    if (dto.method === ProposalMethod.TEMPLATE && dto.templateId) {
      const template = await this.templateRepo.findOne({ where: { id: dto.templateId } });
      if (template) {
        (template.sections as Array<{ sectionKey: string; defaultContent: object }>).forEach((ts) => {
          sectionContent[ts.sectionKey] = ts.defaultContent;
        });
      }
    }

    if ((dto.method === ProposalMethod.CLONE || dto.method === ProposalMethod.AMENDMENT) && dto.sourceProposalId) {
      const sourceSections = await this.sectionRepo.find({
        where: { proposalId: dto.sourceProposalId },
      });
      sourceSections.forEach((ss) => {
        sectionContent[ss.sectionKey] = ss.content;
      });
    }

    // Build sections array (include amendment-specific section when needed)
    const sectionsToCreate = [...DEFAULT_SECTIONS];
    if (dto.method === ProposalMethod.AMENDMENT) {
      sectionsToCreate.push({
        sectionKey: SectionKey.AMENDMENT_DETAILS,
        title:      'Amendment Details',
        sortOrder:  5,
      });
    }

    // Batch insert all sections in a single save call (avoids N+1)
    const sectionEntities = sectionsToCreate.map((s) => {
      const section = this.sectionRepo.create({
        id:          uuid(),
        proposalId:  proposal.id,
        sectionKey:  s.sectionKey,
        title:       s.title,
        sortOrder:   s.sortOrder,
        isComplete:  false,
        isLocked:    false,
        createdBy:   dto.createdBy,
        updatedBy:   dto.createdBy,
      });
      section.content = sectionContent[s.sectionKey] ?? {};
      return section;
    });
    await this.sectionRepo.save(sectionEntities);

    // Fire-and-forget audit log (non-blocking)
    auditService.log({
      proposalId: proposal.id,
      userEmail:  dto.createdBy,
      userName:   dto.createdBy,
      action:     AuditAction.CREATED,
      details:    `Proposal "${proposal.name}" created via ${dto.method} method`,
      snapshot:   { id: proposal.id, name: proposal.name, client: proposal.client },
    }).catch(() => { /* audit failures must not break the create flow */ });

    return this.getById(proposal.id);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateProposalDto): Promise<ProposalEntity> {
    const proposal = await this.getById(id);
    const oldData = { ...proposal } as Record<string, unknown>;

    if (dto.name            !== undefined) proposal.name                = dto.name;
    if (dto.client          !== undefined) proposal.client              = dto.client;
    if (dto.bdManager       !== undefined) proposal.bdManager           = dto.bdManager;
    if (dto.proposalManager !== undefined) proposal.proposalManager     = dto.proposalManager;
    if (dto.description     !== undefined) proposal.description         = dto.description;
    if (dto.sfdcOpportunityCode !== undefined) proposal.sfdcOpportunityCode = dto.sfdcOpportunityCode;
    if (dto.assignedStakeholders !== undefined) proposal.assignedStakeholders = dto.assignedStakeholders;
    proposal.updatedBy = dto.updatedBy;

    await this.repo.save(proposal);

    const changes = detectChanges(oldData, proposal as unknown as Record<string, unknown>);
    auditService.log({
      proposalId: id,
      userEmail:  dto.updatedBy,
      userName:   dto.updatedBy,
      action:     AuditAction.UPDATED,
      details:    `Proposal updated: ${changes.join('; ')}`,
      changes:    { changes },
    }).catch(() => {});

    return this.getById(id);
  }

  // ── Advance Stage ─────────────────────────────────────────────────────────

  async advanceStage(id: string, dto: AdvanceStageDto): Promise<ProposalEntity> {
    const proposal = await this.getById(id);
    const sections = await this.sectionRepo.find({ where: { proposalId: id } });

    if (dto.reviewType === 'pm') {
      proposal.pmReviewComplete = true;
      proposal.updatedBy = dto.updatedBy;
      await this.repo.save(proposal);
      auditService.log({
        proposalId: id, userEmail: dto.updatedBy, userName: dto.updatedBy,
        action: AuditAction.PM_REVIEW_COMPLETE, details: 'PM Review marked as complete',
      }).catch(() => {});
      if (proposal.managementReviewComplete) {
        return this.advanceToStage5(proposal, sections, dto.updatedBy);
      }
      return this.getById(id);
    }

    if (dto.reviewType === 'management') {
      proposal.managementReviewComplete = true;
      proposal.updatedBy = dto.updatedBy;
      await this.repo.save(proposal);
      auditService.log({
        proposalId: id, userEmail: dto.updatedBy, userName: dto.updatedBy,
        action: AuditAction.MANAGEMENT_REVIEW_COMPLETE, details: 'Management Review marked as complete',
      }).catch(() => {});
      if (proposal.pmReviewComplete) {
        return this.advanceToStage5(proposal, sections, dto.updatedBy);
      }
      return this.getById(id);
    }

    const validation = validateStageAdvancement({
      proposal, sections, targetStage: dto.targetStage as ProposalStage,
    });
    if (!validation.allowed) {
      throw new AppError(400, validation.reason ?? 'Stage advancement not allowed', 'STAGE_ERROR');
    }

    const prevStage = proposal.currentStage;
    proposal.currentStage = dto.targetStage;
    proposal.status =
      dto.targetStage === ProposalStage.CLIENT_SUBMISSION
        ? ProposalStatus.SENT
        : ProposalStatus.REVIEW;
    proposal.completionPercentage = computeCompletionPercentage(
      sections, dto.targetStage as ProposalStage, proposal.pmReviewComplete, proposal.managementReviewComplete,
    );
    proposal.updatedBy = dto.updatedBy;

    await this.repo.save(proposal);
    auditService.log({
      proposalId: id, userEmail: dto.updatedBy, userName: dto.updatedBy,
      action: AuditAction.STAGE_ADVANCED,
      details: `Stage advanced: ${getStageName(prevStage as ProposalStage)} → ${getStageName(dto.targetStage as ProposalStage)}`,
    }).catch(() => {});

    return this.getById(id);
  }

  private async advanceToStage5(
    proposal: ProposalEntity,
    sections: ProposalSectionEntity[],
    updatedBy: string,
  ): Promise<ProposalEntity> {
    proposal.currentStage = ProposalStage.CLIENT_SUBMISSION;
    proposal.status = ProposalStatus.SENT;
    proposal.completionPercentage = computeCompletionPercentage(
      sections, ProposalStage.CLIENT_SUBMISSION, true, true,
    );
    proposal.updatedBy = updatedBy;
    await this.repo.save(proposal);

    auditService.log({
      proposalId: proposal.id, userEmail: updatedBy, userName: updatedBy,
      action: AuditAction.STAGE_ADVANCED,
      details: 'Both PM and Management reviews complete — proposal advanced to Client Submission',
    }).catch(() => {});

    return this.getById(proposal.id);
  }

  // ── Create Amendment ──────────────────────────────────────────────────────

  async createAmendment(sourceId: string, dto: AmendmentDto): Promise<ProposalEntity> {
    const source = await this.getById(sourceId);

    if (source.currentStage !== ProposalStage.CLIENT_SUBMISSION) {
      throw new AppError(
        400,
        'Amendments can only be created from Stage 5 (Client Submission) proposals',
        'INVALID_STAGE',
      );
    }

    // Use a transaction to prevent revision-number race conditions under concurrent requests
    const amendment = await AppDataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(ProposalEntity);

      // Lock the source row so concurrent amendment requests queue up
      await txRepo
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.id = :id', { id: sourceId })
        .getOne();

      const existingCount = await txRepo.count({
        where: { parentProposalId: sourceId, isAmendment: true },
      });
      const revisionNumber = existingCount + 1;

      const createDto: CreateProposalDto = {
        name:                dto.name,
        client:              dto.client,
        bdManager:           dto.bdManager,
        proposalManager:     dto.proposalManager ?? source.proposalManager,
        proposalCode:        dto.proposalCode,
        method:              ProposalMethod.AMENDMENT,
        sourceProposalId:    sourceId,
        businessUnit:        source.businessUnit,
        templateType:        source.templateType,
        description:         dto.description ?? source.description,
        sfdcOpportunityCode: dto.sfdcOpportunityCode ?? source.sfdcOpportunityCode,
        assignedStakeholders: dto.assignedStakeholders,
        createdBy:           dto.createdBy,
      };

      // create() uses the default repos; we call it outside the tx manager
      // but the revision-number lock above is sufficient for this pattern
      const newAmendment = await this.create(createDto);

      // Set amendment tracking fields
      await txRepo.update(newAmendment.id, {
        isAmendment:        true,
        parentProposalId:   sourceId,
        parentProposalCode: source.proposalCode,
        revisionNumber,
        amendmentDate:      new Date().toISOString().split('T')[0],
      });

      return newAmendment;
    });

    // Audit on both the source and the new amendment
    auditService.log({
      proposalId: sourceId,
      userEmail: dto.createdBy, userName: dto.createdBy,
      action: AuditAction.AMENDED,
      details: `Amendment created: ${amendment.proposalCode}`,
    }).catch(() => {});
    auditService.log({
      proposalId: amendment.id,
      userEmail: dto.createdBy, userName: dto.createdBy,
      action: AuditAction.CREATED,
      details: `Amendment of ${source.proposalCode}`,
    }).catch(() => {});

    return this.getById(amendment.id);
  }

  // ── Reopen ────────────────────────────────────────────────────────────────

  async reopen(sourceId: string, dto: ReopenDto): Promise<ProposalEntity> {
    const source = await this.getById(sourceId);

    if (dto.mode === 'revise') {
      if (source.currentStage !== ProposalStage.CLIENT_SUBMISSION) {
        throw new AppError(
          400,
          'Revise is only allowed for Stage 5 (Client Submission) proposals',
          'INVALID_STAGE',
        );
      }

      source.currentStage              = ProposalStage.MANAGEMENT_REVIEW;
      source.status                    = ProposalStatus.REVIEW;
      source.pmReviewComplete          = false;
      source.managementReviewComplete  = false;
      source.updatedBy                 = dto.updatedBy;

      // Recompute completion percentage from actual section state
      const sections = await this.sectionRepo.find({ where: { proposalId: sourceId } });
      source.completionPercentage = computeCompletionPercentage(
        sections, ProposalStage.MANAGEMENT_REVIEW, false, false,
      );

      // Batch-unlock all sections (single query instead of N saves)
      if (sections.length > 0) {
        const unlocked = sections.map((s) => ({ ...s, isLocked: false, updatedBy: dto.updatedBy }));
        await this.sectionRepo.save(unlocked);
      }

      await this.repo.save(source);

      auditService.log({
        proposalId: sourceId,
        userEmail: dto.updatedBy, userName: dto.updatedBy,
        action: AuditAction.REVISED,
        details: 'Proposal revised — moved back to Management Review (Stage 4), all sections unlocked',
      }).catch(() => {});

      return this.getById(sourceId);
    }

    // Clone or New — create a fresh proposal
    const createDto: CreateProposalDto = {
      name:                dto.name ?? source.name,
      client:              dto.client ?? source.client,
      bdManager:           dto.bdManager ?? source.bdManager,
      proposalManager:     source.proposalManager,
      proposalCode:        dto.proposalCode ?? source.proposalCode,
      method:              dto.mode === 'clone' ? ProposalMethod.CLONE : ProposalMethod.SCRATCH,
      sourceProposalId:    dto.mode === 'clone' ? sourceId : undefined,
      businessUnit:        source.businessUnit,
      templateType:        source.templateType,
      description:         dto.description ?? source.description,
      sfdcOpportunityCode: dto.sfdcOpportunityCode ?? source.sfdcOpportunityCode,
      assignedStakeholders: dto.assignedStakeholders,
      createdBy:           dto.updatedBy,
    };

    const newProposal = await this.create(createDto);

    auditService.log({
      proposalId: newProposal.id,
      userEmail: dto.updatedBy, userName: dto.updatedBy,
      action: AuditAction.REOPENED,
      details: `${dto.mode === 'clone' ? 'Cloned from' : 'New proposal based on'} ${source.proposalCode}`,
    }).catch(() => {});

    return this.getById(newProposal.id);
  }

  // ── Soft Delete ───────────────────────────────────────────────────────────

  async softDelete(id: string, deletedBy: string): Promise<void> {
    const proposal = await this.getById(id);
    proposal.status    = ProposalStatus.CLOSED;
    proposal.updatedBy = deletedBy;
    await this.repo.save(proposal);

    auditService.log({
      proposalId: id,
      userEmail:  deletedBy,
      userName:   deletedBy,
      action:     AuditAction.DELETED,
      details:    `Proposal "${proposal.name}" closed/deleted`,
      snapshot:   { id: proposal.id, name: proposal.name },
    }).catch(() => {});
  }
}

export const proposalService = new ProposalService();
