import { ProposalEntity } from './Proposal.entity';
import { ProjectActivityEntity } from './ProjectActivity.entity';
export declare class ProjectStageEntity {
    id: string;
    proposalId: string;
    name: string;
    startDate?: string;
    endDate?: string;
    durationDays: number;
    sortOrder: number;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    proposal: ProposalEntity;
    activities: ProjectActivityEntity[];
}
//# sourceMappingURL=ProjectStage.entity.d.ts.map