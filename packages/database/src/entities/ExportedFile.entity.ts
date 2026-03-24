import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { ProposalEntity } from './Proposal.entity';

@Entity('exported_files')
@Index(['proposalId'])
export class ExportedFileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id', type: 'varchar', length: 36 })
  proposalId!: string;

  @Column({ type: 'varchar', length: 500 })
  filename!: string;

  @Column({ type: 'varchar', length: 10 })
  format!: string; // pdf | word

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl?: string;

  @Column({ name: 'file_size', type: 'varchar', length: 50, nullable: true })
  fileSize?: string;

  @Column({ name: 'exported_by', type: 'varchar', length: 255 })
  exportedBy!: string;

  @CreateDateColumn({ name: 'exported_at' })
  exportedAt!: Date;

  @ManyToOne(() => ProposalEntity, (p) => p.exportedFiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposal_id' })
  proposal!: ProposalEntity;
}
