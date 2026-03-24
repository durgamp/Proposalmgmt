import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { ProposalEntity } from './Proposal.entity';

@Entity('comments')
@Index(['proposalId'])
@Index(['sectionKey'])
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id', type: 'varchar', length: 36 })
  proposalId!: string;

  @Column({ name: 'section_key', type: 'varchar', length: 100, nullable: true })
  sectionKey?: string;

  @Column({ name: 'user_name', type: 'varchar', length: 255 })
  userName!: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255 })
  userEmail!: string;

  @Column({ name: 'user_role', type: 'varchar', length: 100 })
  userRole!: string;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => ProposalEntity, (p) => p.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposal_id' })
  proposal!: ProposalEntity;
}
