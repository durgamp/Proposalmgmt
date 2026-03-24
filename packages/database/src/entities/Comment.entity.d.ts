import { ProposalEntity } from './Proposal.entity';
export declare class CommentEntity {
    id: string;
    proposalId: string;
    sectionKey?: string;
    userName: string;
    userEmail: string;
    userRole: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    proposal: ProposalEntity;
}
//# sourceMappingURL=Comment.entity.d.ts.map