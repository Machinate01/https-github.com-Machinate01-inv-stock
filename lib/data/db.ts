import { createClient, Client } from '@libsql/client';

// Lazy client — created on first use (not at build time)
let _client: Client | null = null;
function getClient(): Client {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error('TURSO_DATABASE_URL is not set');
    _client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

// Initialize KV table on first use
let initialized = false;
async function ensureTable() {
  if (initialized) return;
  const client = getClient();
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
  initialized = true;
}

export async function readJson<T>(key: string): Promise<T[]> {
  await ensureTable();
  const client = getClient();
  const result = await client.execute({
    sql: 'SELECT value FROM kv WHERE key = ?',
    args: [key],
  });
  if (result.rows.length === 0) return [];
  try { return JSON.parse(result.rows[0].value as string); } catch { return []; }
}

export async function writeJson<T>(key: string, data: T[]): Promise<void> {
  await ensureTable();
  const client = getClient();
  await client.execute({
    sql: 'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)',
    args: [key, JSON.stringify(data)],
  });
}

export async function appendJson<T>(key: string, item: T): Promise<void> {
  const data = await readJson<T>(key);
  data.push(item);
  await writeJson(key, data);
}

export async function updateJson<T extends { id: string }>(
  key: string, id: string, updates: Partial<T>
): Promise<T | null> {
  const data = await readJson<T>(key);
  const idx = data.findIndex((item: T) => item.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates };
  await writeJson(key, data);
  return data[idx];
}

export async function deleteJson<T extends { id: string }>(
  key: string, id: string
): Promise<boolean> {
  const data = await readJson<T>(key);
  const filtered = data.filter((item: T) => item.id !== id);
  if (filtered.length === data.length) return false;
  await writeJson(key, filtered);
  return true;
}

export async function findById<T extends { id: string }>(
  key: string, id: string
): Promise<T | null> {
  const data = await readJson<T>(key);
  return data.find((item: T) => item.id === id) || null;
}

export async function getNextDocNumber(prefix: string): Promise<string> {
  await ensureTable();
  const client = getClient();
  const year = new Date().getFullYear();
  const counterKey = `${prefix}-${year}`;
  await client.execute({
    sql: 'INSERT INTO counters (key, value) VALUES (?, 1) ON CONFLICT(key) DO UPDATE SET value = value + 1',
    args: [counterKey],
  });
  const result = await client.execute({
    sql: 'SELECT value FROM counters WHERE key = ?',
    args: [counterKey],
  });
  const num = result.rows[0].value as number;
  return `${prefix}-${year}-${String(num).padStart(4, '0')}`;
}
