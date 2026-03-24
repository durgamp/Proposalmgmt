import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { ProposalEntity } from './entities/Proposal.entity';
import { ProposalSectionEntity } from './entities/ProposalSection.entity';
import { CostItemEntity } from './entities/CostItem.entity';
import { ProjectStageEntity } from './entities/ProjectStage.entity';
import { ProjectActivityEntity } from './entities/ProjectActivity.entity';
import { CommentEntity } from './entities/Comment.entity';
import { AuditLogEntity } from './entities/AuditLog.entity';
import { TemplateEntity } from './entities/Template.entity';
import { ExportedFileEntity } from './entities/ExportedFile.entity';

dotenv.config();

const entities = [
  ProposalEntity,
  ProposalSectionEntity,
  CostItemEntity,
  ProjectStageEntity,
  ProjectActivityEntity,
  CommentEntity,
  AuditLogEntity,
  TemplateEntity,
  ExportedFileEntity,
];

// Shared pool config for networked databases (tuned for ~1000 concurrent users)
const POOL_CONFIG = {
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '5'),
  acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
  idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
};

function buildDataSourceOptions(): DataSourceOptions {
  const dbType = (process.env.DB_TYPE || 'sqlite') as 'sqlite' | 'postgres' | 'mysql' | 'mssql';
  const isProduction = process.env.NODE_ENV === 'production';

  // Migration files live alongside this data-source file.
  // __dirname resolves correctly for both ts-node (src/) and compiled JS (dist/).
  const migrations = [`${__dirname}/migrations/*.{ts,js}`];

  if (dbType === 'sqlite') {
    return {
      type: 'better-sqlite3',
      database: process.env.SQLITE_DB_PATH || './biopropose.sqlite',
      entities,
      migrations,
      // synchronize is ALWAYS false — schema changes must go through migrations
      synchronize: false,
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
      migrations,
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
      migrations,
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
      migrations,
      synchronize: false,
      logging: !isProduction,
      pool: { max: POOL_CONFIG.max, min: POOL_CONFIG.min },
    };
  }

  throw new Error(`Unsupported DB_TYPE: ${dbType}. Use sqlite, postgres, mysql, or mssql.`);
}

export const AppDataSource = new DataSource(buildDataSourceOptions());

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log(`[Database] Connected — type: ${process.env.DB_TYPE || 'sqlite'}`);
  }
  return AppDataSource;
}

export { entities };
