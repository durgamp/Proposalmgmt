"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.entities = exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
const Proposal_entity_1 = require("./entities/Proposal.entity");
const ProposalSection_entity_1 = require("./entities/ProposalSection.entity");
const CostItem_entity_1 = require("./entities/CostItem.entity");
const ProjectStage_entity_1 = require("./entities/ProjectStage.entity");
const ProjectActivity_entity_1 = require("./entities/ProjectActivity.entity");
const Comment_entity_1 = require("./entities/Comment.entity");
const AuditLog_entity_1 = require("./entities/AuditLog.entity");
const Template_entity_1 = require("./entities/Template.entity");
const ExportedFile_entity_1 = require("./entities/ExportedFile.entity");
dotenv.config();
const entities = [
    Proposal_entity_1.ProposalEntity,
    ProposalSection_entity_1.ProposalSectionEntity,
    CostItem_entity_1.CostItemEntity,
    ProjectStage_entity_1.ProjectStageEntity,
    ProjectActivity_entity_1.ProjectActivityEntity,
    Comment_entity_1.CommentEntity,
    AuditLog_entity_1.AuditLogEntity,
    Template_entity_1.TemplateEntity,
    ExportedFile_entity_1.ExportedFileEntity,
];
exports.entities = entities;
// Shared pool config for networked databases (tuned for ~1000 concurrent users)
const POOL_CONFIG = {
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
};
function buildDataSourceOptions() {
    const dbType = (process.env.DB_TYPE || 'sqlite');
    const isProduction = process.env.NODE_ENV === 'production';
    if (dbType === 'sqlite') {
        return {
            type: 'better-sqlite3',
            database: process.env.SQLITE_DB_PATH || './biopropose.sqlite',
            entities,
            migrations: ['src/migrations/*.ts'],
            synchronize: !isProduction,
            logging: !isProduction,
        };
    }
    if (dbType === 'mysql') {
        return {
            type: 'mysql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            username: process.env.DB_USER || 'biopropose',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'biopropose',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
            entities,
            migrations: ['src/migrations/*.ts'],
            synchronize: false,
            logging: !isProduction,
            extra: {
                connectionLimit: POOL_CONFIG.max,
                waitForConnections: true,
                queueLimit: 0,
                connectTimeout: POOL_CONFIG.acquire,
                idleTimeout: POOL_CONFIG.idle,
            },
        };
    }
    if (dbType === 'postgres') {
        return {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'biopropose',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            entities,
            migrations: ['src/migrations/*.ts'],
            synchronize: false,
            logging: !isProduction,
            extra: { max: POOL_CONFIG.max, min: POOL_CONFIG.min },
        };
    }
    if (dbType === 'mssql') {
        return {
            type: 'mssql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '1433'),
            username: process.env.DB_USER || 'sa',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'biopropose',
            options: {
                encrypt: process.env.DB_SSL === 'true',
                trustServerCertificate: process.env.DB_SSL !== 'true',
            },
            entities,
            migrations: ['src/migrations/*.ts'],
            synchronize: false,
            logging: !isProduction,
            pool: { max: POOL_CONFIG.max, min: POOL_CONFIG.min },
        };
    }
    throw new Error(`Unsupported DB_TYPE: ${dbType}. Use sqlite, postgres, mysql, or mssql.`);
}
exports.AppDataSource = new typeorm_1.DataSource(buildDataSourceOptions());
async function initializeDatabase() {
    if (!exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.initialize();
        console.log(`[Database] Connected — type: ${process.env.DB_TYPE || 'sqlite'}`);
    }
    return exports.AppDataSource;
}
//# sourceMappingURL=data-source.js.map