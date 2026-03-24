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
exports.ProposalSectionEntity = void 0;
const typeorm_1 = require("typeorm");
const Proposal_entity_1 = require("./Proposal.entity");
let ProposalSectionEntity = class ProposalSectionEntity {
    id;
    proposalId;
    sectionKey;
    title;
    // Content stored as JSON string for cross-DB compatibility
    contentJson;
    get content() {
        try {
            return JSON.parse(this.contentJson);
        }
        catch {
            return {};
        }
    }
    set content(val) {
        this.contentJson = JSON.stringify(val);
    }
    isComplete;
    isLocked;
    completedBy;
    completedAt;
    lockedBy;
    sortOrder;
    // GxP audit fields
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    proposal;
};
exports.ProposalSectionEntity = ProposalSectionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proposal_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "proposalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'section_key', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "sectionKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '{}' }),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "contentJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_complete', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ProposalSectionEntity.prototype, "isComplete", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_locked', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ProposalSectionEntity.prototype, "isLocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "completedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'locked_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "lockedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], ProposalSectionEntity.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], ProposalSectionEntity.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProposalSectionEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProposalSectionEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Proposal_entity_1.ProposalEntity, (p) => p.sections, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'proposal_id' }),
    __metadata("design:type", Proposal_entity_1.ProposalEntity)
], ProposalSectionEntity.prototype, "proposal", void 0);
exports.ProposalSectionEntity = ProposalSectionEntity = __decorate([
    (0, typeorm_1.Entity)('proposal_sections'),
    (0, typeorm_1.Index)(['proposalId', 'sectionKey'], { unique: true })
], ProposalSectionEntity);
//# sourceMappingURL=ProposalSection.entity.js.map