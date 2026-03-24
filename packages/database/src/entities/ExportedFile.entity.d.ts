import { ProposalEntity } from './Proposal.entity';
export declare class ExportedFileEntity {
    id: string;
    proposalId: string;
    filename: string;
    format: string;
    fileUrl?: string;
    fileSize?: string;
    exportedBy: string;
    exportedAt: Date;
    proposal: ProposalEntity;
}
//# sourceMappingURL=ExportedFile.entity.d.ts.map