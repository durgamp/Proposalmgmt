import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('[Migrate] Connected to database');

    const ran = await AppDataSource.runMigrations({ transaction: 'each' });
    if (ran.length === 0) {
      console.log('[Migrate] No pending migrations — schema is up to date');
    } else {
      console.log(`[Migrate] Applied ${ran.length} migration(s):`);
      ran.forEach((m) => console.log(`  ✓ ${m.name}`));
    }

    await AppDataSource.destroy();
    console.log('[Migrate] Done');
    process.exit(0);
  } catch (err) {
    console.error('[Migrate] Failed:', err);
    process.exit(1);
  }
}

runMigrations();
