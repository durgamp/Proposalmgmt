import { AppDataSource } from '@biopropose/database';
import { AuditLogEntity } from '@biopropose/database';
import { AuditAction } from '@biopropose/shared-types';

export interface CreateAuditParams {
  proposalId?: string;
  userEmail: string;
  userName: string;
  action: AuditAction;
  details: string;
  changes?: object;
  snapshot?: object;
}

export class AuditService {
  private get repo() {
    return AppDataSource.getRepository(AuditLogEntity);
  }

  async log(params: CreateAuditParams): Promise<AuditLogEntity> {
    const entry = this.repo.create({
      proposalId: params.proposalId,
      userEmail: params.userEmail,
      userName: params.userName,
      action: params.action,
      details: params.details,
    });

    if (params.changes) entry.changes = params.changes;
    if (params.snapshot) entry.snapshot = params.snapshot;

    return this.repo.save(entry);
  }

  async getByProposal(
    proposalId: string,
    page = 1,
    limit = 50,
  ): Promise<{ items: AuditLogEntity[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      where: { proposalId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async getAll(
    page = 1,
    limit = 50,
  ): Promise<{ items: AuditLogEntity[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }
}

export const auditService = new AuditService();
