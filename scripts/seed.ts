import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateAllBins } from '../lib/data/seed-bins';

const DATA_DIR = path.join(process.cwd(), 'data');

function writeFile(name: string, data: unknown) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ ${name} seeded`);
}

async function seed() {
  // Users
  const users = [
    { id: uuidv4(), username: 'admin', password: await bcrypt.hash('admin1234', 10), name: 'Administrator', role: 'admin', warehouseAccess: [], active: true, createdAt: new Date().toISOString() },
    { id: uuidv4(), username: 'manager', password: await bcrypt.hash('manager1234', 10), name: 'Warehouse Manager', role: 'manager', warehouseAccess: [], active: true, createdAt: new Date().toISOString() },
    { id: uuidv4(), username: 'staff1', password: await bcrypt.hash('staff1234', 10), name: 'Staff WH1', role: 'staff', warehouseAccess: ['WH1','WH1-1'], active: true, createdAt: new Date().toISOString() },
    { id: uuidv4(), username: 'staff2', password: await bcrypt.hash('staff1234', 10), name: 'Staff WH2', role: 'staff', warehouseAccess: ['WH2','WH2-1'], active: true, createdAt: new Date().toISOString() },
    { id: uuidv4(), username: 'readonly', password: await bcrypt.hash('readonly1234', 10), name: 'Read Only User', role: 'readonly', warehouseAccess: [], active: true, createdAt: new Date().toISOString() },
  ];
  writeFile('users.json', users);

  // Bins
  const bins = generateAllBins();
  writeFile('bins.json', bins);
  console.log(`  → Total bins generated: ${bins.length}`);

  // Empty collections
  writeFile('items.json', []);
  writeFile('batches.json', []);
  writeFile('stock.json', []);
  writeFile('grpo.json', []);
  writeFile('gr.json', []);
  writeFile('gi.json', []);
  writeFile('putaway.json', []);
  writeFile('picklist.json', []);
  writeFile('batch_transactions.json', []);
  writeFile('counters.json', {});

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nDefault credentials:');
  console.log('  admin    / admin1234');
  console.log('  manager  / manager1234');
  console.log('  staff1   / staff1234');
  console.log('  staff2   / staff1234');
  console.log('  readonly / readonly1234');
}

seed().catch(console.error);
