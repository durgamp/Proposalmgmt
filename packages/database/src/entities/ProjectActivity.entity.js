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
exports.ProjectActivityEntity = void 0;
const typeorm_1 = require("typeorm");
const Proposal_entity_1 = require("./Proposal.entity");
const ProjectStage_entity_1 = require("./ProjectStage.entity");
let ProjectActivityEntity = class ProjectActivityEntity {
    id;
    proposalId;
    stageId;
    name;
    startDate;
    endDate;
    durationDays;
    progress;
    assignee;
    phase;
    color;
    sortOrder;
    // Dependencies stored as JSON string
    dependenciesJson;
    get dependencies() {
        try {
            return JSON.parse(this.dependenciesJson);
        }
        catch {
            return [];
        }
    }
    set dependencies(val) {
        this.dependenciesJson = JSON.stringify(val);
    }
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    proposal;
    stage;
};
exports.ProjectActivityEntity = ProjectActivityEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proposal_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "proposalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stage_id', type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "stageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_days', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ProjectActivityEntity.prototype, "durationDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ProjectActivityEntity.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: 'bg-blue-500' }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ProjectActivityEntity.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dependencies_json', type: 'text', default: '[]' }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "dependenciesJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProjectActivityEntity.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProjectActivityEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProjectActivityEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Proposal_entity_1.ProposalEntity, (p) => p.activities, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'proposal_id' }),
    __metadata("design:type", Proposal_entity_1.ProposalEntity)
], ProjectActivityEntity.prototype, "proposal", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ProjectStage_entity_1.ProjectStageEntity, (s) => s.activities, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'stage_id' }),
    __metadata("design:type", ProjectStage_entity_1.ProjectStageEntity)
], ProjectActivityEntity.prototype, "stage", void 0);
exports.ProjectActivityEntity = ProjectActivityEntity = __decorate([
    (0, typeorm_1.Entity)('project_activities'),
    (0, typeorm_1.Index)(['proposalId']),
    (0, typeorm_1.Index)(['stageId'])
], ProjectActivityEntity);
//# sourceMappingURL=ProjectActivity.entity.js.map