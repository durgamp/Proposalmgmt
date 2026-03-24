import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, Index, CreateDateColumn,
} from 'typeorm';
import { ProposalEntity } from './Proposal.entity';

// GxP-compliant: immutable audit log
// No UpdateDateColumn — records are never modified after creation
@Entity('audit_logs')
@Index(['proposalId'])
@Index(['userEmail'])
@Index(['action'])
@Index(['timestamp'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id', type: 'varchar', length: 36, nullable: true })
  proposalId?: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255 })
  userEmail!: string;

  @Column({ name: 'user_name', type: 'varchar', length: 255 })
  userName!: string;

  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'text' })
  details!: string;

  // Changes diff stored as JSON string
  @Column({ name: 'changes_json', type: 'text', nullable: true })
  changesJson?: string;

  get changes(): object | undefined {
    if (!this.changesJson) return undefined;
    try { return JSON.parse(this.changesJson); } catch { return undefined; }
  }
  set changes(val: object | undefined) {
    this.changesJson = val ? JSON.stringify(val) : undefined;
  }

  // Full snapshot stored as JSON string
  @Column({ name: 'snapshot_json', type: 'text', nullable: true })
  snapshotJson?: string;

  get snapshot(): object | undefined {
    if (!this.snapshotJson) return undefined;
    try { return JSON.parse(this.snapshotJson); } catch { return undefined; }
  }
  set snapshot(val: object | undefined) {
    this.snapshotJson = val ? JSON.stringify(val) : undefined;
  }

  // Immutable timestamp — GxP requirement
  @CreateDateColumn({ name: 'timestamp' })
  timestamp!: Date;

  @ManyToOne(() => ProposalEntity, (p) => p.auditLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proposal_id' })
  proposal?: ProposalEntity;
}
