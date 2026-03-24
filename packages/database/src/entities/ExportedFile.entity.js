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
exports.ExportedFileEntity = void 0;
const typeorm_1 = require("typeorm");
const Proposal_entity_1 = require("./Proposal.entity");
let ExportedFileEntity = class ExportedFileEntity {
    id;
    proposalId;
    filename;
    format; // pdf | word
    fileUrl;
    fileSize;
    exportedBy;
    exportedAt;
    proposal;
};
exports.ExportedFileEntity = ExportedFileEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExportedFileEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proposal_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ExportedFileEntity.prototype, "proposalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], ExportedFileEntity.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], ExportedFileEntity.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_url', type: 'text', nullable: true }),
    __metadata("design:type", String)
], ExportedFileEntity.prototype, "fileUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_size', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ExportedFileEntity.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exported_by', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ExportedFileEntity.prototype, "exportedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'exported_at' }),
    __metadata("design:type", Date)
], ExportedFileEntity.prototype, "exportedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Proposal_entity_1.ProposalEntity, (p) => p.exportedFiles, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'proposal_id' }),
    __metadata("design:type", Proposal_entity_1.ProposalEntity)
], ExportedFileEntity.prototype, "proposal", void 0);
exports.ExportedFileEntity = ExportedFileEntity = __decorate([
    (0, typeorm_1.Entity)('exported_files'),
    (0, typeorm_1.Index)(['proposalId'])
], ExportedFileEntity);
//# sourceMappingURL=ExportedFile.entity.js.map