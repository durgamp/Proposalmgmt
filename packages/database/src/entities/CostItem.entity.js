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
exports.CostItemEntity = void 0;
const typeorm_1 = require("typeorm");
const Proposal_entity_1 = require("./Proposal.entity");
let CostItemEntity = class CostItemEntity {
    id;
    proposalId;
    category; // Service | Material | Outsourcing
    description;
    quantity;
    serviceRate;
    materialRate;
    outsourcingRate;
    totalCost;
    stage;
    isBinding;
    isFixedRate;
    sortOrder;
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    proposal;
};
exports.CostItemEntity = CostItemEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CostItemEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proposal_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], CostItemEntity.prototype, "proposalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], CostItemEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], CostItemEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', default: 1 }),
    __metadata("design:type", Number)
], CostItemEntity.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_rate', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], CostItemEntity.prototype, "serviceRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'material_rate', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], CostItemEntity.prototype, "materialRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'outsourcing_rate', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], CostItemEntity.prototype, "outsourcingRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_cost', type: 'float', default: 0 }),
    __metadata("design:type", Number)
], CostItemEntity.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], CostItemEntity.prototype, "stage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_binding', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], CostItemEntity.prototype, "isBinding", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_fixed_rate', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], CostItemEntity.prototype, "isFixedRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], CostItemEntity.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], CostItemEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], CostItemEntity.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CostItemEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CostItemEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Proposal_entity_1.ProposalEntity, (p) => p.costItems, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'proposal_id' }),
    __metadata("design:type", Proposal_entity_1.ProposalEntity)
], CostItemEntity.prototype, "proposal", void 0);
exports.CostItemEntity = CostItemEntity = __decorate([
    (0, typeorm_1.Entity)('cost_items'),
    (0, typeorm_1.Index)(['proposalId']),
    (0, typeorm_1.Index)(['stage'])
], CostItemEntity);
//# sourceMappingURL=CostItem.entity.js.map