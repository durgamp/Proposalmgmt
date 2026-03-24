import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ProposalEntity } from './entities/Proposal.entity';
import { ProposalSectionEntity } from './entities/ProposalSection.entity';
import { CostItemEntity } from './entities/CostItem.entity';
import { ProjectStageEntity } from './entities/ProjectStage.entity';
import { ProjectActivityEntity } from './entities/ProjectActivity.entity';
import { CommentEntity } from './entities/Comment.entity';
import { AuditLogEntity } from './entities/AuditLog.entity';
import { TemplateEntity } from './entities/Template.entity';
import { ExportedFileEntity } from './entities/ExportedFile.entity';
declare const entities: (typeof ProposalSectionEntity | typeof ProposalEntity | typeof CostItemEntity | typeof ProjectActivityEntity | typeof ProjectStageEntity | typeof CommentEntity | typeof AuditLogEntity | typeof ExportedFileEntity | typeof TemplateEntity)[];
export declare const AppDataSource: DataSource;
export declare function initializeDatabase(): Promise<DataSource>;
export { entities };
//# sourceMappingURL=data-source.d.ts.map