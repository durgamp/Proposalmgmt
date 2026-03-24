import { AppDataSource } from '@biopropose/database';
import { ProposalSectionEntity } from '@biopropose/database';
import { AppError } from '../middleware/errorHandler';
import { auditService } from './audit.service';
import { AuditAction } from '@biopropose/shared-types';
import { detectChanges } from '../utils/proposalDiff';
import type { UpdateSectionDto } from '../validators/section.validators';

export class SectionService {
  private get repo() { return AppDataSource.getRepository(ProposalSectionEntity); }

  async getByProposal(proposalId: string): Promise<ProposalSectionEntity[]> {
    return this.repo.find({
      where: { proposalId },
      order: { sortOrder: 'ASC' },
    });
  }

  async getOne(proposalId: string, sectionKey: string): Promise<ProposalSectionEntity> {
    const section = await this.repo.findOne({ where: { proposalId, sectionKey } });
    if (!section) throw new AppError(404, `Section '${sectionKey}' not found`, 'NOT_FOUND');
    return section;
  }

  async update(
    proposalId: string,
    sectionKey: string,
    dto: UpdateSectionDto,
  ): Promise<ProposalSectionEntity> {
    const section = await this.getOne(proposalId, sectionKey);

    if (section.isLocked && !dto.isLocked) {
      // Unlocking is allowed to pass through
    } else if (section.isLocked) {
      throw new AppError(403, 'This section is locked and cannot be edited', 'SECTION_LOCKED');
    }

    const oldData = { ...section } as Record<string, unknown>;
    let action = AuditAction.UPDATED;

    if (dto.content !== undefined) section.content = dto.content;

    if (dto.isComplete !== undefined) {
      section.isComplete = dto.isComplete;
      if (dto.isComplete) {
        section.completedBy = dto.updatedBy;
        section.completedAt = new Date().toISOString();
        action = AuditAction.SECTION_COMPLETED;
      } else {
        section.completedBy = undefined;
        section.completedAt = undefined;
      }
    }

    if (dto.isLocked !== undefined) {
      section.isLocked = dto.isLocked;
      if (dto.isLocked) {
        section.lockedBy = dto.updatedBy;
        action = AuditAction.SECTION_LOCKED;
      } else {
        section.lockedBy = undefined;
        action = AuditAction.SECTION_UNLOCKED;
      }
    }

    section.updatedBy = dto.updatedBy;
    await this.repo.save(section);

    const changes = detectChanges(oldData, section as unknown as Record<string, unknown>);
    await auditService.log({
      proposalId,
      userEmail: dto.updatedBy,
      userName: dto.updatedBy,
      action,
      details: `Section "${section.title}": ${changes.join('; ')}`,
      changes: { sectionKey, changes },
    });

    return section;
  }
}

export const sectionService = new SectionService();
