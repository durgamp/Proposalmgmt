/**
 * Migration entry point — run by the `migrate` Docker service.
 * Runs all pending TypeORM migrations then exits.
 */
import 'reflect-metadata';
import { AppDataSource } from '@biopropose/database';
import { runSeed } from '@biopropose/database/seed';

async function main() {
  console.log('[Migrate] Connecting to database...');
  await AppDataSource.initialize();
  console.log('[Migrate] Connected.');

  if (AppDataSource.options.type !== 'sqlite') {
    console.log('[Migrate] Running pending migrations...');
    const migrations = await AppDataSource.runMigrations({ transaction: 'each' });
    console.log(`[Migrate] ${migrations.length} migration(s) applied.`);
  } else {
    console.log('[Migrate] SQLite with synchronize=true — skipping explicit migrations.');
  }

  console.log('[Migrate] Seeding default templates...');
  await runSeed();

  await AppDataSource.destroy();
  console.log('[Migrate] Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Migrate] Failed:', err);
  process.exit(1);
});
