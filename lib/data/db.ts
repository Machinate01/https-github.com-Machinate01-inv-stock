import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export function readJson<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  try { return JSON.parse(content); } catch { return []; }
}

export function writeJson<T>(filename: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function appendJson<T>(filename: string, item: T): void {
  const data = readJson<T>(filename);
  data.push(item);
  writeJson(filename, data);
}

export function updateJson<T extends { id: string }>(filename: string, id: string, updates: Partial<T>): T | null {
  const data = readJson<T>(filename);
  const idx = data.findIndex((item: T) => item.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates };
  writeJson(filename, data);
  return data[idx];
}

export function deleteJson<T extends { id: string }>(filename: string, id: string): boolean {
  const data = readJson<T>(filename);
  const filtered = data.filter((item: T) => item.id !== id);
  if (filtered.length === data.length) return false;
  writeJson(filename, filtered);
  return true;
}

export function findById<T extends { id: string }>(filename: string, id: string): T | null {
  const data = readJson<T>(filename);
  return data.find((item: T) => item.id === id) || null;
}

// Counter for document numbers
export function getNextDocNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const countersFile = path.join(DATA_DIR, 'counters.json');
  let counters: Record<string, number> = {};
  if (fs.existsSync(countersFile)) {
    try { counters = JSON.parse(fs.readFileSync(countersFile, 'utf-8')); } catch { counters = {}; }
  }
  const key = `${prefix}-${year}`;
  counters[key] = (counters[key] || 0) + 1;
  fs.writeFileSync(countersFile, JSON.stringify(counters, null, 2), 'utf-8');
  return `${prefix}-${year}-${String(counters[key]).padStart(4, '0')}`;
}
