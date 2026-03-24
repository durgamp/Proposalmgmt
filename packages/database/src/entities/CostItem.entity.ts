import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { ProposalEntity } from './Proposal.entity';

@Entity('cost_items')
@Index(['proposalId'])
@Index(['stage'])
export class CostItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'proposal_id', type: 'varchar', length: 36 })
  proposalId!: string;

  @Column({ type: 'varchar', length: 50 })
  category!: string; // Service | Material | Outsourcing

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column({ type: 'float', default: 1 })
  quantity!: number;

  @Column({ name: 'service_rate', type: 'float', default: 0 })
  serviceRate!: number;

  @Column({ name: 'material_rate', type: 'float', default: 0 })
  materialRate!: number;

  @Column({ name: 'outsourcing_rate', type: 'float', default: 0 })
  outsourcingRate!: number;

  @Column({ name: 'total_cost', type: 'float', default: 0 })
  totalCost!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stage?: string;

  @Column({ name: 'is_binding', type: 'boolean', default: true })
  isBinding!: boolean;

  @Column({ name: 'is_fixed_rate', type: 'boolean', default: false })
  isFixedRate!: boolean;

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

  @ManyToOne(() => ProposalEntity, (p) => p.costItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposal_id' })
  proposal!: ProposalEntity;
}
