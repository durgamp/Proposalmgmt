import { AppDataSource } from '@biopropose/database';
import { ProposalEntity, CostItemEntity, AuditLogEntity } from '@biopropose/database';
import { ProposalStatus } from '@biopropose/shared-types';

interface KpiSummary {
  totalProposals: number;
  draftCount: number;
  reviewCount: number;
  sentCount: number;
  closedCount: number;
  avgCompletionPercentage: number;
}

interface StageDistribution {
  stage: string;
  stageNumber: number;
  count: number;
}

interface TemplateDistribution {
  templateType: string;
  count: number;
}

interface MonthlyTrend {
  month: string; // e.g., "2025-01"
  created: number;
  sent: number;
}

interface CostSummary {
  totalBudget: number;
  avgProposalValue: number;
  byCategory: { category: string; total: number }[];
}

interface ActivityFeed {
  id: string;
  proposalId: string;
  proposalCode: string;
  action: string;
  userEmail: string;
  details: string;
  createdAt: Date;
}

const DB_TYPE = (process.env.DB_TYPE ?? 'sqlite') as string;

/** Returns a SQL year-extract expression compatible with the configured DB. */
function yearExpr(col: string): string {
  if (DB_TYPE === 'mysql' || DB_TYPE === 'postgres') return `YEAR(${col})`;
  if (DB_TYPE === 'mssql') return `YEAR(${col})`;
  return `STRFTIME('%Y', ${col})`; // sqlite / better-sqlite3
}

/** Returns a SQL month-extract expression compatible with the configured DB. */
function monthExpr(col: string): string {
  if (DB_TYPE === 'mysql' || DB_TYPE === 'postgres') return `MONTH(${col})`;
  if (DB_TYPE === 'mssql') return `MONTH(${col})`;
  return `CAST(STRFTIME('%m', ${col}) AS INTEGER)`; // sqlite
}

export class AnalyticsService {
  private get proposalRepo() { return AppDataSource.getRepository(ProposalEntity); }
  private get costRepo() { return AppDataSource.getRepository(CostItemEntity); }
  private get auditRepo() { return AppDataSource.getRepository(AuditLogEntity); }

  async getKpis(filters?: { year?: number; month?: number; templateType?: string; proposalManager?: string }): Promise<KpiSummary> {
    const qb = this.proposalRepo.createQueryBuilder('p');

    if (filters?.year) {
      qb.andWhere(`${yearExpr('p.created_at')} = :year`, { year: filters.year });
    }
    if (filters?.month) {
      qb.andWhere(`${monthExpr('p.created_at')} = :month`, { month: filters.month });
    }
    if (filters?.templateType) {
      qb.andWhere('p.templateType = :templateType', { templateType: filters.templateType });
    }
    if (filters?.proposalManager) {
      qb.andWhere('p.proposalManager = :pm', { pm: filters.proposalManager });
    }

    const proposals = await qb.getMany();

    const total = proposals.length;
    const draftCount = proposals.filter((p) => p.status === ProposalStatus.DRAFT).length;
    const reviewCount = proposals.filter((p) => p.status === ProposalStatus.REVIEW).length;
    const sentCount = proposals.filter((p) => p.status === ProposalStatus.SENT).length;
    const closedCount = proposals.filter((p) => p.status === ProposalStatus.CLOSED).length;
    const avgCompletion = total > 0
      ? Math.round(proposals.reduce((sum, p) => sum + (p.completionPercentage ?? 0), 0) / total)
      : 0;

    return { totalProposals: total, draftCount, reviewCount, sentCount, closedCount, avgCompletionPercentage: avgCompletion };
  }

  async getStageDistribution(): Promise<StageDistribution[]> {
    const stageLabels: Record<number, string> = {
      1: 'Draft Creation',
      2: 'Technical Review',
      3: 'PM Review',
      4: 'Management Review',
      5: 'Client Submission',
    };

    const proposals = await this.proposalRepo.find({ select: ['currentStage'] });
    const countByStage: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const p of proposals) {
      const s = Number(p.currentStage);
      if (countByStage[s] !== undefined) countByStage[s]++;
    }

    return Object.entries(countByStage).map(([stage, count]) => ({
      stage: stageLabels[Number(stage)],
      stageNumber: Number(stage),
      count,
    }));
  }

  async getTemplateDistribution(): Promise<TemplateDistribution[]> {
    const result = await this.proposalRepo
      .createQueryBuilder('p')
      .select('p.templateType', 'templateType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.templateType')
      .getRawMany<{ templateType: string; count: string }>();

    return result.map((r) => ({
      templateType: r.templateType ?? 'General',
      count: Number(r.count),
    }));
  }

  async getMonthlyTrends(year?: number): Promise<MonthlyTrend[]> {
    const targetYear = year ?? new Date().getFullYear();

    const proposals = await this.proposalRepo
      .createQueryBuilder('p')
      .where(`${yearExpr('p.created_at')} = :year`, { year: targetYear })
      .select(['p.createdAt', 'p.status'])
      .getMany();

    const months: Record<string, { created: number; sent: number }> = {};
    for (let m = 1; m <= 12; m++) {
      months[String(m).padStart(2, '0')] = { created: 0, sent: 0 };
    }

    for (const p of proposals) {
      const month = new Date(p.createdAt).toISOString().slice(5, 7);
      if (months[month]) {
        months[month].created++;
        if (p.status === ProposalStatus.SENT) months[month].sent++;
      }
    }

    return Object.entries(months).map(([month, data]) => ({
      month: `${targetYear}-${month}`,
      created: data.created,
      sent: data.sent,
    }));
  }

  async getCostSummary(): Promise<CostSummary> {
    const items = await this.costRepo.find();
    const totalBudget = items.reduce((s, i) => s + i.totalCost, 0);
    const uniqueProposals = new Set(items.map((i) => i.proposalId)).size;
    const avgProposalValue = uniqueProposals > 0 ? totalBudget / uniqueProposals : 0;

    const categoryMap: Record<string, number> = {};
    for (const item of items) {
      categoryMap[item.category] = (categoryMap[item.category] ?? 0) + item.totalCost;
    }

    return {
      totalBudget,
      avgProposalValue: Math.round(avgProposalValue),
      byCategory: Object.entries(categoryMap).map(([category, total]) => ({ category, total })),
    };
  }

  async getRecentActivity(limit = 20): Promise<ActivityFeed[]> {
    // Use getMany() so TypeORM handles column mapping automatically.
    // Then join proposal codes in a second query (avoids raw-select aliasing issues).
    const logs = await this.auditRepo.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });

    if (logs.length === 0) return [];

    // Collect unique proposal IDs and fetch their codes
    const proposalIds = [...new Set(logs.map((l) => l.proposalId).filter(Boolean))] as string[];
    const proposals = proposalIds.length > 0
      ? await this.proposalRepo.findByIds(proposalIds)
      : [];
    const codeMap = new Map(proposals.map((p) => [p.id, p.proposalCode]));

    return logs.map((l) => ({
      id: l.id,
      proposalId: l.proposalId ?? '',
      proposalCode: codeMap.get(l.proposalId ?? '') ?? 'N/A',
      action: l.action,
      userEmail: l.userEmail,
      details: l.details ?? '',
      createdAt: l.timestamp,
    }));
  }
}

export const analyticsService = new AnalyticsService();
