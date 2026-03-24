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
exports.TemplateEntity = void 0;
const typeorm_1 = require("typeorm");
let TemplateEntity = class TemplateEntity {
    id;
    name;
    businessUnit;
    category;
    description;
    // Template sections stored as JSON string
    sectionsJson;
    get sections() {
        try {
            return JSON.parse(this.sectionsJson);
        }
        catch {
            return [];
        }
    }
    set sections(val) {
        this.sectionsJson = JSON.stringify(val);
    }
    isSystem;
    createdBy;
    createdAt;
    updatedAt;
};
exports.TemplateEntity = TemplateEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TemplateEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], TemplateEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_unit', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TemplateEntity.prototype, "businessUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TemplateEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TemplateEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sections_json', type: 'text', default: '[]' }),
    __metadata("design:type", String)
], TemplateEntity.prototype, "sectionsJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_system', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TemplateEntity.prototype, "isSystem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TemplateEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TemplateEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TemplateEntity.prototype, "updatedAt", void 0);
exports.TemplateEntity = TemplateEntity = __decorate([
    (0, typeorm_1.Entity)('templates')
], TemplateEntity);
//# sourceMappingURL=Template.entity.js.map