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
exports.CommentEntity = void 0;
const typeorm_1 = require("typeorm");
const Proposal_entity_1 = require("./Proposal.entity");
let CommentEntity = class CommentEntity {
    id;
    proposalId;
    sectionKey;
    userName;
    userEmail;
    userRole;
    content;
    createdAt;
    updatedAt;
    proposal;
};
exports.CommentEntity = CommentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CommentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proposal_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], CommentEntity.prototype, "proposalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'section_key', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], CommentEntity.prototype, "sectionKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CommentEntity.prototype, "userName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_email', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CommentEntity.prototype, "userEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_role', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], CommentEntity.prototype, "userRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CommentEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CommentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CommentEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Proposal_entity_1.ProposalEntity, (p) => p.comments, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'proposal_id' }),
    __metadata("design:type", Proposal_entity_1.ProposalEntity)
], CommentEntity.prototype, "proposal", void 0);
exports.CommentEntity = CommentEntity = __decorate([
    (0, typeorm_1.Entity)('comments'),
    (0, typeorm_1.Index)(['proposalId']),
    (0, typeorm_1.Index)(['sectionKey'])
], CommentEntity);
//# sourceMappingURL=Comment.entity.js.map