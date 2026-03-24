import { ProposalEntity } from './Proposal.entity';
export declare class CostItemEntity {
    id: string;
    proposalId: string;
    category: string;
    description: string;
    quantity: number;
    serviceRate: number;
    materialRate: number;
    outsourcingRate: number;
    totalCost: number;
    stage?: string;
    isBinding: boolean;
    isFixedRate: boolean;
    sortOrder: number;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    proposal: ProposalEntity;
}
//# sourceMappingURL=CostItem.entity.d.ts.map