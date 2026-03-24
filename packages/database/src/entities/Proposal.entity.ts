import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { ProposalSectionEntity } from './ProposalSection.entity';
import { CostItemEntity } from './CostItem.entity';
import { ProjectStageEntity } from './ProjectStage.entity';
import { ProjectActivityEntity } from './ProjectActivity.entity';
import { CommentEntity } from './Comment.entity';
import { AuditLogEntity } from './AuditLog.entity';
import { ExportedFileEntity } from './ExportedFile.entity';

@Entity('proposals')
@Index(['proposalCode'], { unique: true })
@Index(['status'])
@Index(['currentStage'])
@Index(['createdAt'])
export class ProposalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  name!: string;

  @Column({ type: 'varchar', length: 500 })
  client!: string;

  @Column({ name: 'bd_manager', type: 'varchar', length: 255 })
  bdManager!: string;

  @Column({ name: 'proposal_manager', type: 'varchar', length: 255, nullable: true })
  proposalManager?: string;

  @Column({ name: 'proposal_code', type: 'varchar', length: 100 })
  proposalCode!: string;

  @Column({ type: 'varchar', length: 50, default: 'Draft' })
  status!: string;

  @Column({ type: 'varchar', length: 50 })
  method!: string;

  @Column({ name: 'business_unit', type: 'varchar', length: 255, nullable: true })
  businessUnit?: string;

  @Column({ name: 'template_type', type: 'varchar', length: 255, nullable: true })
  templateType?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'current_stage', type: 'integer', default: 1 })
  currentStage!: number;

  @Column({ name: 'completion_percentage', type: 'integer', default: 0 })
  completionPercentage!: number;

  @Column({ name: 'sfdc_opportunity_code', type: 'varchar', length: 255, nullable: true })
  sfdcOpportunityCode?: string;

  @Column({ name: 'pm_review_complete', type: 'boolean', default: false })
  pmReviewComplete!: boolean;

  @Column({ name: 'management_review_complete', type: 'boolean', default: false })
  managementReviewComplete!: boolean;

  @Column({ name: 'is_amendment', type: 'boolean', default: false })
  isAmendment!: boolean;

  @Column({ name: 'parent_proposal_id', type: 'varchar', length: 36, nullable: true })
  parentProposalId?: string;

  @Column({ name: 'parent_proposal_code', type: 'varchar', length: 100, nullable: true })
  parentProposalCode?: string;

  @Column({ name: 'revision_number', type: 'integer', nullable: true })
  revisionNumber?: number;

  @Column({ name: 'amendment_date', type: 'varchar', length: 50, nullable: true })
  amendmentDate?: string;

  // Stored as JSON string for SQLite/MSSQL compatibility
  @Column({ name: 'assigned_stakeholders', type: 'text', nullable: true })
  assignedStakeholdersJson!: string;

  get assignedStakeholders(): string[] {
    try { return JSON.parse(this.assignedStakeholdersJson); } catch { return []; }
  }
  set assignedStakeholders(val: string[]) {
    this.assignedStakeholdersJson = JSON.stringify(val);
  }

  // GxP audit fields
  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => ProposalSectionEntity, (s) => s.proposal, { cascade: true })
  sections!: ProposalSectionEntity[];

  @OneToMany(() => CostItemEntity, (c) => c.proposal, { cascade: true })
  costItems!: CostItemEntity[];

  @OneToMany(() => ProjectStageEntity, (s) => s.proposal, { cascade: true })
  projectStages!: ProjectStageEntity[];

  @OneToMany(() => ProjectActivityEntity, (a) => a.proposal, { cascade: true })
  activities!: ProjectActivityEntity[];

  @OneToMany(() => CommentEntity, (c) => c.proposal, { cascade: true })
  comments!: CommentEntity[];

  @OneToMany(() => AuditLogEntity, (a) => a.proposal)
  auditLogs!: AuditLogEntity[];

  @OneToMany(() => ExportedFileEntity, (e) => e.proposal, { cascade: true })
  exportedFiles!: ExportedFileEntity[];

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      client: this.client,
      bdManager: this.bdManager,
      proposalManager: this.proposalManager,
      proposalCode: this.proposalCode,
      status: this.status,
      method: this.method,
      businessUnit: this.businessUnit,
      templateType: this.templateType,
      description: this.description,
      currentStage: this.currentStage,
      completionPercentage: this.completionPercentage,
      sfdcOpportunityCode: this.sfdcOpportunityCode,
      pmReviewComplete: this.pmReviewComplete,
      managementReviewComplete: this.managementReviewComplete,
      isAmendment: this.isAmendment,
      parentProposalId: this.parentProposalId,
      parentProposalCode: this.parentProposalCode,
      revisionNumber: this.revisionNumber,
      amendmentDate: this.amendmentDate,
      assignedStakeholders: this.assignedStakeholders, // calls getter → parsed array
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
