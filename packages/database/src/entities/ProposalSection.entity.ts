import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { ProposalEntity } from './Proposal.entity';

@Entity('proposal_sections')
@Index(['proposalId', 'sectionKey'], { unique: true })
export class ProposalSectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id', type: 'varchar', length: 36 })
  proposalId!: string;

  @Column({ name: 'section_key', type: 'varchar', length: 100 })
  sectionKey!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  // Content stored as JSON string for cross-DB compatibility
  @Column({ type: 'text', nullable: true })
  contentJson!: string;

  get content(): object {
    try { return JSON.parse(this.contentJson); } catch { return {}; }
  }
  set content(val: object) {
    this.contentJson = JSON.stringify(val);
  }

  @Column({ name: 'is_complete', type: 'boolean', default: false })
  isComplete!: boolean;

  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked!: boolean;

  @Column({ name: 'completed_by', type: 'varchar', length: 255, nullable: true })
  completedBy?: string;

  @Column({ name: 'completed_at', type: 'varchar', length: 50, nullable: true })
  completedAt?: string;

  @Column({ name: 'locked_by', type: 'varchar', length: 255, nullable: true })
  lockedBy?: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  // GxP audit fields
  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => ProposalEntity, (p) => p.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposal_id' })
  proposal!: ProposalEntity;

  toJSON() {
    return {
      id: this.id,
      proposalId: this.proposalId,
      sectionKey: this.sectionKey,
      title: this.title,
      content: this.content,
      isComplete: this.isComplete,
      isLocked: this.isLocked,
      completedBy: this.completedBy,
      completedAt: this.completedAt,
      lockedBy: this.lockedBy,
      sortOrder: this.sortOrder,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
