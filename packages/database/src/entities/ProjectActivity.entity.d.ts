import { ProposalEntity } from './Proposal.entity';
import { ProjectStageEntity } from './ProjectStage.entity';
export declare class ProjectActivityEntity {
    id: string;
    proposalId: string;
    stageId?: string;
    name: string;
    startDate?: string;
    endDate?: string;
    durationDays: number;
    progress: number;
    assignee?: string;
    phase?: string;
    color: string;
    sortOrder: number;
    dependenciesJson: string;
    get dependencies(): string[];
    set dependencies(val: string[]);
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    proposal: ProposalEntity;
    stage?: ProjectStageEntity;
}
//# sourceMappingURL=ProjectActivity.entity.d.ts.map