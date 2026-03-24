"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProposalEntity = void 0;
const typeorm_1 = require("typeorm");
const ProposalSection_entity_1 = require("./ProposalSection.entity");
const CostItem_entity_1 = require("./CostItem.entity");
const ProjectStage_entity_1 = require("./ProjectStage.entity");
const ProjectActivity_entity_1 = require("./ProjectActivity.entity");
const Comment_entity_1 = require("./Comment.entity");
const AuditLog_entity_1 = require("./AuditLog.entity");
const ExportedFile_entity_1 = require("./ExportedFile.entity");
let ProposalEntity = class ProposalEntity {
    id;
    name;
    client;
    bdManager;
    proposalManager;
    proposalCode;
    status;
    method;
    businessUnit;
    templateType;
    description;
    currentStage;
    completionPercentage;
    sfdcOpportunityCode;
    pmReviewComplete;
    managementReviewComplete;
    isAmendment;
    parentProposalId;
    parentProposalCode;
    revisionNumber;
    amendmentDate;
    // Stored as JSON string for SQLite/MSSQL compatibility
    assignedStakeholdersJson;
    get assignedStakeholders() {
        try {
            return JSON.parse(this.assignedStakeholdersJson);
        }
        catch {
            return [];
        }
    }
    set assignedStakeholders(val) {
        this.assignedStakeholdersJson = JSON.stringify(val);
    }
    // GxP audit fields
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    // Relations
    sections;
    costItems;
    projectStages;
    activities;
    comments;
    auditLogs;
    exportedFiles;
};
exports.ProposalEntity = ProposalEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProposalEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bd_manager', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "bdManager", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proposal_manager', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "proposalManager", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proposal_code', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "proposalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'Draft' }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_unit', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "businessUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'template_type', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "templateType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_stage', type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], ProposalEntity.prototype, "currentStage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completion_percentage', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ProposalEntity.prototype, "completionPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sfdc_opportunity_code', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "sfdcOpportunityCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pm_review_complete', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ProposalEntity.prototype, "pmReviewComplete", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'management_review_complete', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ProposalEntity.prototype, "managementReviewComplete", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_amendment', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ProposalEntity.prototype, "isAmendment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_proposal_id', type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "parentProposalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_proposal_code', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "parentProposalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'revision_number', type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], ProposalEntity.prototype, "revisionNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amendment_date', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "amendmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_stakeholders', type: 'text', default: '[]' }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "assignedStakeholdersJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalEntity.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProposalEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProposalEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProposalSection_entity_1.ProposalSectionEntity, (s) => s.proposal, { cascade: true }),
    __metadata("design:type", Array)
], ProposalEntity.prototype, "sections", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => CostItem_entity_1.CostItemEntity, (c) => c.proposal, { cascade: true }),
    __metadata("design:type", Array)
], ProposalEntity.prototype, "costItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProjectStage_entity_1.ProjectStageEntity, (s) => s.proposal, { cascade: true }),
    __metadata("design:type", Array)
], ProposalEntity.prototype, "projectStages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProjectActivity_entity_1.ProjectActivityEntity, (a) => a.proposal, { cascade: true }),
    __metadata("design:type", Array)
], ProposalEntity.prototype, "activities", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Comment_entity_1.CommentEntity, (c) => c.proposal, { cascade: true }),
    __metadata("design:type", Array)
], ProposalEntity.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => AuditLog_entity_1.AuditLogEntity, (a) => a.proposal),
    __metadata("design:type", Array)
], ProposalEntity.prototype, "auditLogs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ExportedFile_entity_1.ExportedFileEntity, (e) => e.proposal, { cascade: true }),
    __metadata("design:type", Array)
], ProposalEntity.prototype, "exportedFiles", void 0);
exports.ProposalEntity = ProposalEntity = __decorate([
    (0, typeorm_1.Entity)('proposals'),
    (0, typeorm_1.Index)(['proposalCode'], { unique: true }),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['currentStage']),
    (0, typeorm_1.Index)(['createdAt'])
], ProposalEntity);
//# sourceMappingURL=Proposal.entity.js.map