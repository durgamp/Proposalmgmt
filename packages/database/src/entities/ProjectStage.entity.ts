import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { ProposalEntity } from './Proposal.entity';
import { ProjectActivityEntity } from './ProjectActivity.entity';

@Entity('project_stages')
@Index(['proposalId'])
export class ProjectStageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id', type: 'varchar', length: 36 })
  proposalId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'start_date', type: 'varchar', length: 50, nullable: true })
  startDate?: string;

  @Column({ name: 'end_date', type: 'varchar', length: 50, nullable: true })
  endDate?: string;

  @Column({ name: 'duration_days', type: 'integer', default: 0 })
  durationDays!: number;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => ProposalEntity, (p) => p.projectStages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposal_id' })
  proposal!: ProposalEntity;

  @OneToMany(() => ProjectActivityEntity, (a) => a.stage)
  activities!: ProjectActivityEntity[];
}
