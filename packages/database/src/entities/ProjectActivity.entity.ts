import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { ProposalEntity } from './Proposal.entity';
import { ProjectStageEntity } from './ProjectStage.entity';

@Entity('project_activities')
@Index(['proposalId'])
@Index(['stageId'])
export class ProjectActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id', type: 'varchar', length: 36 })
  proposalId!: string;

  @Column({ name: 'stage_id', type: 'varchar', length: 36, nullable: true })
  stageId?: string;

  @Column({ type: 'varchar', length: 500 })
  name!: string;

  @Column({ name: 'start_date', type: 'varchar', length: 50, nullable: true })
  startDate?: string;

  @Column({ name: 'end_date', type: 'varchar', length: 50, nullable: true })
  endDate?: string;

  @Column({ name: 'duration_days', type: 'integer', default: 0 })
  durationDays!: number;

  @Column({ type: 'integer', default: 0 })
  progress!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignee?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phase?: string;

  @Column({ type: 'varchar', length: 100, default: 'bg-blue-500' })
  color!: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  // Dependencies stored as JSON string
  @Column({ name: 'dependencies_json', type: 'text', nullable: true })
  dependenciesJson!: string;

  get dependencies(): string[] {
    try { return JSON.parse(this.dependenciesJson); } catch { return []; }
  }
  set dependencies(val: string[]) {
    this.dependenciesJson = JSON.stringify(val);
  }

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => ProposalEntity, (p) => p.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposal_id' })
  proposal!: ProposalEntity;

  @ManyToOne(() => ProjectStageEntity, (s) => s.activities, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stage_id' })
  stage?: ProjectStageEntity;
}
