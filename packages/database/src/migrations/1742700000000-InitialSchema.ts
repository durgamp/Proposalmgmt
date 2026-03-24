import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Initial schema migration — creates all tables from scratch.
 *
 * Run via:  pnpm --filter api exec typeorm migration:run -d src/config/data-source.ts
 * Revert:   pnpm --filter api exec typeorm migration:revert -d src/config/data-source.ts
 *
 * Tables (creation order respects FK dependencies):
 *   proposals → proposal_sections, cost_items, project_stages,
 *               project_activities, comments, audit_logs,
 *               exported_files, templates (standalone)
 */
export class InitialSchema1742700000000 implements MigrationInterface {
  name = 'InitialSchema1742700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── templates (no FK dependency) ────────────────────────────────────────
    await queryRunner.createTable(new Table({
      name: 'templates',
      columns: [
        { name: 'id',            type: 'varchar', length: '36',  isPrimary: true },
        { name: 'name',          type: 'varchar', length: '500', isNullable: false },
        { name: 'business_unit', type: 'varchar', length: '255', isNullable: false },
        { name: 'category',      type: 'varchar', length: '255', isNullable: false },
        { name: 'description',   type: 'text',                   isNullable: true },
        { name: 'sections_json', type: 'text',                   isNullable: true },
        { name: 'is_system',     type: 'boolean',                isNullable: false, default: false },
        { name: 'created_by',    type: 'varchar', length: '255', isNullable: true },
        { name: 'created_at',    type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at',    type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
    }), true /* ifNotExists */);

    // ── proposals ────────────────────────────────────────────────────────────
    await queryRunner.createTable(new Table({
      name: 'proposals',
      columns: [
        { name: 'id',                        type: 'varchar', length: '36',  isPrimary: true },
        { name: 'name',                      type: 'varchar', length: '500', isNullable: false },
        { name: 'client',                    type: 'varchar', length: '500', isNullable: false },
        { name: 'bd_manager',                type: 'varchar', length: '255', isNullable: false },
        { name: 'proposal_manager',          type: 'varchar', length: '255', isNullable: true },
        { name: 'proposal_code',             type: 'varchar', length: '100', isNullable: false },
        { name: 'status',                    type: 'varchar', length: '50',  isNullable: false, default: "'Draft'" },
        { name: 'method',                    type: 'varchar', length: '50',  isNullable: false },
        { name: 'business_unit',             type: 'varchar', length: '255', isNullable: true },
        { name: 'template_type',             type: 'varchar', length: '255', isNullable: true },
        { name: 'description',               type: 'text',                   isNullable: true },
        { name: 'current_stage',             type: 'integer',                isNullable: false, default: 1 },
        { name: 'completion_percentage',     type: 'integer',                isNullable: false, default: 0 },
        { name: 'sfdc_opportunity_code',     type: 'varchar', length: '255', isNullable: true },
        { name: 'pm_review_complete',        type: 'boolean',                isNullable: false, default: false },
        { name: 'management_review_complete',type: 'boolean',                isNullable: false, default: false },
        { name: 'is_amendment',              type: 'boolean',                isNullable: false, default: false },
        { name: 'parent_proposal_id',        type: 'varchar', length: '36',  isNullable: true },
        { name: 'parent_proposal_code',      type: 'varchar', length: '100', isNullable: true },
        { name: 'revision_number',           type: 'integer',                isNullable: true },
        { name: 'amendment_date',            type: 'varchar', length: '50',  isNullable: true },
        { name: 'assigned_stakeholders',     type: 'text',                   isNullable: true },
        { name: 'created_by',               type: 'varchar', length: '255', isNullable: true },
        { name: 'updated_by',               type: 'varchar', length: '255', isNullable: true },
        { name: 'created_at',               type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at',               type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
    }), true);

    await queryRunner.createIndex('proposals', new TableIndex({
      name: 'IDX_proposals_proposal_code',
      columnNames: ['proposal_code'],
      isUnique: true,
    }));
    await queryRunner.createIndex('proposals', new TableIndex({
      name: 'IDX_proposals_status',
      columnNames: ['status'],
    }));
    await queryRunner.createIndex('proposals', new TableIndex({
      name: 'IDX_proposals_current_stage',
      columnNames: ['current_stage'],
    }));
    await queryRunner.createIndex('proposals', new TableIndex({
      name: 'IDX_proposals_created_at',
      columnNames: ['created_at'],
    }));

    // ── proposal_sections ────────────────────────────────────────────────────
    await queryRunner.createTable(new Table({
      name: 'proposal_sections',
      columns: [
        { name: 'id',           type: 'varchar', length: '36',  isPrimary: true },
        { name: 'proposal_id',  type: 'varchar', length: '36',  isNullable: false },
        { name: 'section_key',  type: 'varchar', length: '100', isNullable: false },
        { name: 'title',        type: 'varchar', length: '500', isNullable: false },
        { name: 'contentJson',  type: 'text',                   isNullable: true },
        { name: 'is_complete',  type: 'boolean',                isNullable: false, default: false },
        { name: 'is_locked',    type: 'boolean',                isNullable: false, default: false },
        { name: 'completed_by', type: 'varchar', length: '255', isNullable: true },
        { name: 'completed_at', type: 'varchar', length: '50',  isNullable: true },
        { name: 'locked_by',    type: 'varchar', length: '255', isNullable: true },
        { name: 'sort_order',   type: 'integer',                isNullable: false, default: 0 },
        { name: 'created_by',   type: 'varchar', length: '255', isNullable: true },
        { name: 'updated_by',   type: 'varchar', length: '255', isNullable: true },
        { name: 'created_at',   type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at',   type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
      foreignKeys: [{
        columnNames: ['proposal_id'],
        referencedTableName: 'proposals',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }],
    }), true);

    await queryRunner.createIndex('proposal_sections', new TableIndex({
      name: 'IDX_proposal_sections_proposal_section',
      columnNames: ['proposal_id', 'section_key'],
      isUnique: true,
    }));

    // ── cost_items ───────────────────────────────────────────────────────────
    await queryRunner.createTable(new Table({
      name: 'cost_items',
      columns: [
        { name: 'id',               type: 'varchar', length: '36',  isPrimary: true },
        { name: 'proposal_id',      type: 'varchar', length: '36',  isNullable: false },
        { name: 'category',         type: 'varchar', length: '50',  isNullable: false },
        { name: 'description',      type: 'varchar', length: '500', isNullable: false },
        { name: 'quantity',         type: 'float',                  isNullable: false, default: 1 },
        { name: 'service_rate',     type: 'float',                  isNullable: false, default: 0 },
        { name: 'material_rate',    type: 'float',                  isNullable: false, default: 0 },
        { name: 'outsourcing_rate', type: 'float',                  isNullable: false, default: 0 },
        { name: 'total_cost',       type: 'float',                  isNullable: false, default: 0 },
        { name: 'stage',            type: 'varchar', length: '255', isNullable: true },
        { name: 'is_binding',       type: 'boolean',                isNullable: false, default: true },
        { name: 'is_fixed_rate',    type: 'boolean',                isNullable: false, default: false },
        { name: 'sort_order',       type: 'integer',                isNullable: false, default: 0 },
        { name: 'created_by',       type: 'varchar', length: '255', isNullable: true },
        { name: 'updated_by',       type: 'varchar', length: '255', isNullable: true },
        { name: 'created_at',       type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at',       type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
      foreignKeys: [{
        columnNames: ['proposal_id'],
        referencedTableName: 'proposals',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }],
    }), true);

    await queryRunner.createIndex('cost_items', new TableIndex({
      name: 'IDX_cost_items_proposal_id',
      columnNames: ['proposal_id'],
    }));

    // ── project_stages ───────────────────────────────────────────────────────
    await queryRunner.createTable(new Table({
      name: 'project_stages',
      columns: [
        { name: 'id',            type: 'varchar', length: '36',  isPrimary: true },
        { name: 'proposal_id',   type: 'varchar', length: '36',  isNullable: false },
        { name: 'name',          type: 'varchar', length: '255', isNullable: false },
        { name: 'start_date',    type: 'varchar', length: '50',  isNullable: true },
        { name: 'end_date',      type: 'varchar', length: '50',  isNullable: true },
        { name: 'duration_days', type: 'integer',                isNullable: false, default: 0 },
        { name: 'sort_order',    type: 'integer',                isNullable: false, default: 0 },
        { name: 'created_by',    type: 'varchar', length: '255', isNullable: true },
        { name: 'updated_by',    type: 'varchar', length: '255', isNullable: true },
        { name: 'created_at',    type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at',    type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
      foreignKeys: [{
        columnNames: ['proposal_id'],
        referencedTableName: 'proposals',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }],
    }), true);

    await queryRunner.createIndex('project_stages', new TableIndex({
      name: 'IDX_project_stages_proposal_id',
      columnNames: ['proposal_id'],
    }));

    // ── project_activities ───────────────────────────────────────────────────
    await queryRunner.createTable(new Table({
      name: 'project_activities',
      columns: [
        { name: 'id',               type: 'varchar', length: '36',  isPrimary: true },
        { name: 'proposal_id',      type: 'varchar', length: '36',  isNullable: false },
        { name: 'stage_id',         type: 'varchar', length: '36',  isNullable: true },
        { name: 'name',             type: 'varchar', length: '500', isNullable: false },
        { name: 'start_date',       type: 'varchar', length: '50',  isNullable: true },
        { name: 'end_date',         type: 'varchar', length: '50',  isNullable: true },
        { name: 'duration_days',    type: 'integer',                isNullable: false, default: 0 },
        { name: 'progress',         type: 'integer',                isNullable: false, default: 0 },
        { name: 'assignee',         type: 'varchar', length: '255', isNullable: true },
        { name: 'phase',            type: 'varchar', length: '255', isNullable: true },
        { name: 'color',            type: 'varchar', length: '100', isNullable: false, default: "'bg-blue-500'" },
        { name: 'sort_order',       type: 'integer',                isNullable: false, default: 0 },
        { name: 'dependencies_json',type: 'text',                   isNullable: true },
        { name: 'created_by',       type: 'varchar', length: '255', isNullable: true },
        { name: 'updated_by',       type: 'varchar', length: '255', isNullable: true },
        { name: 'created_at',       type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at',       type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
      foreignKeys: [
        {
          columnNames: ['proposal_id'],
          referencedTableName: 'proposals',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        },
        {
          columnNames: ['stage_id'],
          referencedTableName: 'project_stages',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        },
      ],
    }), true);

    await queryRunner.createIndex('project_activities', new TableIndex({
      name: 'IDX_project_activities_proposal_id',
      columnNames: ['proposal_id'],
    }));
    await queryRunner.createIndex('project_activities', new TableIndex({
      name: 'IDX_project_activities_stage_id',
      columnNames: ['stage_id'],
    }));

    // ── comments ─────────────────────────────────────────────────────────────
    await queryRunner.createTable(new Table({
      name: 'comments',
      columns: [
        { name: 'id',          type: 'varchar', length: '36',  isPrimary: true },
        { name: 'proposal_id', type: 'varchar', length: '36',  isNullable: false },
        { name: 'section_key', type: 'varchar', length: '100', isNullable: true },
        { name: 'user_name',   type: 'varchar', length: '255', isNullable: false },
        { name: 'user_email',  type: 'varchar', length: '255', isNullable: false },
        { name: 'user_role',   type: 'varchar', length: '100', isNullable: false },
        { name: 'content',     type: 'text',                   isNullable: false },
        { name: 'created_at',  type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at',  type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
      foreignKeys: [{
        columnNames: ['proposal_id'],
        referencedTableName: 'proposals',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }],
    }), true);

    await queryRunner.createIndex('comments', new TableIndex({
      name: 'IDX_comments_proposal_id',
      columnNames: ['proposal_id'],
    }));
    await queryRunner.createIndex('comments', new TableIndex({
      name: 'IDX_comments_section_key',
      columnNames: ['section_key'],
    }));

    // ── audit_logs (GxP-immutable — no updated_at) ───────────────────────────
    await queryRunner.createTable(new Table({
      name: 'audit_logs',
      columns: [
        { name: 'id',           type: 'varchar', length: '36',  isPrimary: true },
        { name: 'proposal_id',  type: 'varchar', length: '36',  isNullable: true },
        { name: 'user_email',   type: 'varchar', length: '255', isNullable: false },
        { name: 'user_name',    type: 'varchar', length: '255', isNullable: false },
        { name: 'action',       type: 'varchar', length: '100', isNullable: false },
        { name: 'details',      type: 'text',                   isNullable: false },
        { name: 'changes_json', type: 'text',                   isNullable: true },
        { name: 'snapshot_json',type: 'text',                   isNullable: true },
        { name: 'timestamp',    type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
      foreignKeys: [{
        columnNames: ['proposal_id'],
        referencedTableName: 'proposals',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }],
    }), true);

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_proposal_id',
      columnNames: ['proposal_id'],
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_user_email',
      columnNames: ['user_email'],
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_action',
      columnNames: ['action'],
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'IDX_audit_logs_timestamp',
      columnNames: ['timestamp'],
    }));

    // ── exported_files ───────────────────────────────────────────────────────
    await queryRunner.createTable(new Table({
      name: 'exported_files',
      columns: [
        { name: 'id',          type: 'varchar', length: '36',  isPrimary: true },
        { name: 'proposal_id', type: 'varchar', length: '36',  isNullable: false },
        { name: 'filename',    type: 'varchar', length: '500', isNullable: false },
        { name: 'format',      type: 'varchar', length: '10',  isNullable: false },
        { name: 'file_url',    type: 'text',                   isNullable: true },
        { name: 'file_size',   type: 'varchar', length: '50',  isNullable: true },
        { name: 'exported_by', type: 'varchar', length: '255', isNullable: false },
        { name: 'exported_at', type: 'datetime',               isNullable: false, default: 'CURRENT_TIMESTAMP' },
      ],
      foreignKeys: [{
        columnNames: ['proposal_id'],
        referencedTableName: 'proposals',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }],
    }), true);

    await queryRunner.createIndex('exported_files', new TableIndex({
      name: 'IDX_exported_files_proposal_id',
      columnNames: ['proposal_id'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order
    await queryRunner.dropTable('exported_files',      true);
    await queryRunner.dropTable('audit_logs',          true);
    await queryRunner.dropTable('comments',            true);
    await queryRunner.dropTable('project_activities',  true);
    await queryRunner.dropTable('project_stages',      true);
    await queryRunner.dropTable('cost_items',          true);
    await queryRunner.dropTable('proposal_sections',   true);
    await queryRunner.dropTable('proposals',           true);
    await queryRunner.dropTable('templates',           true);
  }
}
