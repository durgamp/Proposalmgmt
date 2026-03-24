import { ProposalEntity } from './Proposal.entity';
export declare class AuditLogEntity {
    id: string;
    proposalId?: string;
    userEmail: string;
    userName: string;
    action: string;
    details: string;
    changesJson?: string;
    get changes(): object | undefined;
    set changes(val: object | undefined);
    snapshotJson?: string;
    get snapshot(): object | undefined;
    set snapshot(val: object | undefined);
    timestamp: Date;
    proposal?: ProposalEntity;
}
//# sourceMappingURL=AuditLog.entity.d.ts.map