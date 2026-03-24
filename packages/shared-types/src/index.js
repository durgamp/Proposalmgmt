"use strict";
// ============================================================
// BioPropose Shared Type Definitions
// GxP-aligned: all entities include audit fields
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.AuditAction = exports.ExportFormat = exports.CostCategory = exports.SectionKey = exports.ProposalMethod = exports.ProposalStage = exports.ProposalStatus = void 0;
// ---- Enums ----
var ProposalStatus;
(function (ProposalStatus) {
    ProposalStatus["DRAFT"] = "Draft";
    ProposalStatus["REVIEW"] = "Review";
    ProposalStatus["APPROVED"] = "Approved";
    ProposalStatus["SENT"] = "Sent";
    ProposalStatus["CLOSED"] = "Closed";
})(ProposalStatus || (exports.ProposalStatus = ProposalStatus = {}));
var ProposalStage;
(function (ProposalStage) {
    ProposalStage[ProposalStage["DRAFT_CREATION"] = 1] = "DRAFT_CREATION";
    ProposalStage[ProposalStage["TECHNICAL_REVIEW"] = 2] = "TECHNICAL_REVIEW";
    ProposalStage[ProposalStage["PM_REVIEW"] = 3] = "PM_REVIEW";
    ProposalStage[ProposalStage["MANAGEMENT_REVIEW"] = 4] = "MANAGEMENT_REVIEW";
    ProposalStage[ProposalStage["CLIENT_SUBMISSION"] = 5] = "CLIENT_SUBMISSION";
})(ProposalStage || (exports.ProposalStage = ProposalStage = {}));
var ProposalMethod;
(function (ProposalMethod) {
    ProposalMethod["TEMPLATE"] = "template";
    ProposalMethod["CLONE"] = "clone";
    ProposalMethod["SCRATCH"] = "scratch";
    ProposalMethod["AMENDMENT"] = "amendment";
})(ProposalMethod || (exports.ProposalMethod = ProposalMethod = {}));
var SectionKey;
(function (SectionKey) {
    SectionKey["CEO_LETTER"] = "ceo-letter";
    SectionKey["EXECUTIVE_SUMMARY"] = "executive-summary";
    SectionKey["SCOPE_OF_WORK"] = "scope-of-work";
    SectionKey["PROJECT_DETAILS"] = "project-details";
    SectionKey["TERMS_CONDITIONS"] = "terms-conditions";
    SectionKey["AMENDMENT_DETAILS"] = "amendment-details";
})(SectionKey || (exports.SectionKey = SectionKey = {}));
var CostCategory;
(function (CostCategory) {
    CostCategory["SERVICE"] = "Service";
    CostCategory["MATERIAL"] = "Material";
    CostCategory["OUTSOURCING"] = "Outsourcing";
})(CostCategory || (exports.CostCategory = CostCategory = {}));
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["PDF"] = "pdf";
    ExportFormat["WORD"] = "word";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATED"] = "created";
    AuditAction["UPDATED"] = "updated";
    AuditAction["STAGE_ADVANCED"] = "stage_advanced";
    AuditAction["SECTION_COMPLETED"] = "section_completed";
    AuditAction["SECTION_LOCKED"] = "section_locked";
    AuditAction["SECTION_UNLOCKED"] = "section_unlocked";
    AuditAction["COMMENTED"] = "commented";
    AuditAction["COMMENT_UPDATED"] = "comment_updated";
    AuditAction["COMMENT_DELETED"] = "comment_deleted";
    AuditAction["EXPORTED"] = "exported";
    AuditAction["DELETED"] = "deleted";
    AuditAction["AMENDED"] = "amended";
    AuditAction["REOPENED"] = "reopened";
    AuditAction["CLONED"] = "cloned";
    AuditAction["REVISED"] = "revised";
    AuditAction["PM_REVIEW_COMPLETE"] = "pm_review_complete";
    AuditAction["MANAGEMENT_REVIEW_COMPLETE"] = "management_review_complete";
    AuditAction["COST_UPDATED"] = "cost_updated";
    AuditAction["TIMELINE_UPDATED"] = "timeline_updated";
    AuditAction["AI_DRAFT_GENERATED"] = "ai_draft_generated";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var UserRole;
(function (UserRole) {
    UserRole["PROPOSAL_MANAGER"] = "proposal-manager";
    UserRole["QA_QC"] = "qa-qc";
    UserRole["MANUFACTURING"] = "manufacturing";
    UserRole["REGULATORY"] = "regulatory";
    UserRole["BD"] = "bd";
    UserRole["MANAGEMENT"] = "management";
    UserRole["STAKEHOLDER"] = "stakeholder";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=index.js.map