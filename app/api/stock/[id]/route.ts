import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson, findById } from '@/lib/data/db';
import { StockEntry, BatchTransaction } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/utils/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = findById<StockEntry>('stock.json', id);
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role === 'readonly')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const stock = readJson<StockEntry>('stock.json');
  const idx = stock.findIndex(s => s.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const entry = stock[idx];
  const now = new Date().toISOString();

  // Assign bin location
  if (body.action === 'assign_bin') {
    const { binCode, warehouseCode } = body;

    // Check if target bin+warehouse already has this batch → merge
    const targetIdx = stock.findIndex(s =>
      s.id !== id &&
      s.itemCode === entry.itemCode &&
      s.batchNumber === entry.batchNumber &&
      s.warehouseCode === (warehouseCode || entry.warehouseCode) &&
      s.binCode === binCode
    );

    if (targetIdx >= 0) {
      // Merge into existing entry
      stock[targetIdx].quantity += entry.quantity;
      stock[targetIdx].updatedAt = now;
      stock.splice(idx, 1); // remove old entry
    } else {
      // Update in place
      stock[idx] = { ...entry, binCode, warehouseCode: warehouseCode || entry.warehouseCode, updatedAt: now };
    }

    writeJson('stock.json', stock);

    // Record batch transaction
    const txns = readJson<BatchTransaction>('batch_transactions.json');
    const prevTxns = txns.filter(t => t.itemCode === entry.itemCode && t.batchNumber === entry.batchNumber);
    const lastBalance = prevTxns.length > 0 ? prevTxns[prevTxns.length - 1].balanceQty : entry.quantity;
    txns.push({
      id: uuidv4(),
      transactionType: 'PUTAWAY',
      docNumber: `LOC-${now.slice(0, 10)}`,
      docDate: now.slice(0, 10),
      itemCode: entry.itemCode,
      itemName: entry.itemName,
      batchNumber: entry.batchNumber,
      expiryDate: '',
      warehouseCode: warehouseCode || entry.warehouseCode,
      binCode,
      qtyIn: 0,
      qtyOut: 0,
      balanceQty: lastBalance,
      createdBy: session.username,
      createdAt: now,
      remark: `กำหนด Location → ${binCode}`,
    });
    writeJson('batch_transactions.json', txns);

    return NextResponse.json(targetIdx >= 0 ? stock[targetIdx] : stock[idx]);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
