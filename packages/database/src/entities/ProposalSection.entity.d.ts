import { ProposalEntity } from './Proposal.entity';
export declare class ProposalSectionEntity {
    id: string;
    proposalId: string;
    sectionKey: string;
    title: string;
    contentJson: string;
    get content(): object;
    set content(val: object);
    isComplete: boolean;
    isLocked: boolean;
    completedBy?: string;
    completedAt?: string;
    lockedBy?: string;
    sortOrder: number;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    proposal: ProposalEntity;
}
//# sourceMappingURL=ProposalSection.entity.d.ts.map