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
exports.AuditLogEntity = void 0;
const typeorm_1 = require("typeorm");
const Proposal_entity_1 = require("./Proposal.entity");
// GxP-compliant: immutable audit log
// No UpdateDateColumn — records are never modified after creation
let AuditLogEntity = class AuditLogEntity {
    id;
    proposalId;
    userEmail;
    userName;
    action;
    details;
    // Changes diff stored as JSON string
    changesJson;
    get changes() {
        if (!this.changesJson)
            return undefined;
        try {
            return JSON.parse(this.changesJson);
        }
        catch {
            return undefined;
        }
    }
    set changes(val) {
        this.changesJson = val ? JSON.stringify(val) : undefined;
    }
    // Full snapshot stored as JSON string
    snapshotJson;
    get snapshot() {
        if (!this.snapshotJson)
            return undefined;
        try {
            return JSON.parse(this.snapshotJson);
        }
        catch {
            return undefined;
        }
    }
    set snapshot(val) {
        this.snapshotJson = val ? JSON.stringify(val) : undefined;
    }
    // Immutable timestamp — GxP requirement
    timestamp;
    proposal;
};
exports.AuditLogEntity = AuditLogEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proposal_id', type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "proposalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_email', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "userEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "userName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'changes_json', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "changesJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'snapshot_json', type: 'text', nullable: true }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "snapshotJson", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'timestamp' }),
    __metadata("design:type", Date)
], AuditLogEntity.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Proposal_entity_1.ProposalEntity, (p) => p.auditLogs, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'proposal_id' }),
    __metadata("design:type", Proposal_entity_1.ProposalEntity)
], AuditLogEntity.prototype, "proposal", void 0);
exports.AuditLogEntity = AuditLogEntity = __decorate([
    (0, typeorm_1.Entity)('audit_logs'),
    (0, typeorm_1.Index)(['proposalId']),
    (0, typeorm_1.Index)(['userEmail']),
    (0, typeorm_1.Index)(['action']),
    (0, typeorm_1.Index)(['timestamp'])
], AuditLogEntity);
//# sourceMappingURL=AuditLog.entity.js.map