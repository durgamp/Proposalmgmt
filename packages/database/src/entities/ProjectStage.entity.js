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
exports.ProjectStageEntity = void 0;
const typeorm_1 = require("typeorm");
const Proposal_entity_1 = require("./Proposal.entity");
const ProjectActivity_entity_1 = require("./ProjectActivity.entity");
let ProjectStageEntity = class ProjectStageEntity {
    id;
    proposalId;
    name;
    startDate;
    endDate;
    durationDays;
    sortOrder;
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    proposal;
    activities;
};
exports.ProjectStageEntity = ProjectStageEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProjectStageEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proposal_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ProjectStageEntity.prototype, "proposalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ProjectStageEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ProjectStageEntity.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ProjectStageEntity.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_days', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ProjectStageEntity.prototype, "durationDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ProjectStageEntity.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProjectStageEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProjectStageEntity.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProjectStageEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProjectStageEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Proposal_entity_1.ProposalEntity, (p) => p.projectStages, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'proposal_id' }),
    __metadata("design:type", Proposal_entity_1.ProposalEntity)
], ProjectStageEntity.prototype, "proposal", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProjectActivity_entity_1.ProjectActivityEntity, (a) => a.stage),
    __metadata("design:type", Array)
], ProjectStageEntity.prototype, "activities", void 0);
exports.ProjectStageEntity = ProjectStageEntity = __decorate([
    (0, typeorm_1.Entity)('project_stages'),
    (0, typeorm_1.Index)(['proposalId'])
], ProjectStageEntity);
//# sourceMappingURL=ProjectStage.entity.js.map