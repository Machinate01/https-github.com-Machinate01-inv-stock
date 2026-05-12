/**
 * Migrate all JSON data files → Turso database
 * Run: npx tsx scripts/migrate-to-turso.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const DATA_DIR = path.join(process.cwd(), 'data');

const FILES = [
  'users.json',
  'warehouses.json',
  'bins.json',
  'items.json',
  'stock.json',
  'grpo.json',
  'gr.json',
  'gi.json',
  'putaway.json',
  'picklist.json',
  'batch_transactions.json',
  'batches.json',
  'counters.json',
];

async function migrate() {
  console.log('🚀 Starting migration to Turso...\n');

  // Create tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS kv (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '[]'
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS counters (
      key   TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    )
  `);
  console.log('✅ Tables created\n');

  // Migrate each JSON file
  for (const filename of FILES) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${filename} (not found)`);
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');

    // Special handling for counters.json (object, not array)
    if (filename === 'counters.json') {
      try {
        const counters = JSON.parse(raw) as Record<string, number>;
        for (const [key, value] of Object.entries(counters)) {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO counters (key, value) VALUES (?, ?)',
            args: [key, value],
          });
        }
        console.log(`✅ Migrated counters (${Object.keys(counters).length} entries)`);
      } catch (e) {
        console.log(`❌ Failed to migrate counters: ${e}`);
      }
      continue;
    }

    try {
      const data = JSON.parse(raw);
      const count = Array.isArray(data) ? data.length : 0;
      await client.execute({
        sql: 'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)',
        args: [filename, JSON.stringify(data)],
      });
      console.log(`✅ Migrated ${filename} (${count} records)`);
    } catch (e) {
      console.log(`❌ Failed to migrate ${filename}: ${e}`);
    }
  }

  console.log('\n🎉 Migration complete!');
  console.log('You can now deploy to Vercel.\n');
}

migrate().catch(console.error);
