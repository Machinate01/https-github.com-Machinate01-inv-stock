import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson, findById } from '@/lib/data/db';
import { GoodsIssue, BatchTransaction, StockEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/utils/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = findById<GoodsIssue>('gi.json', id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role === 'readonly')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const docs = readJson<GoodsIssue>('gi.json');
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const doc = docs[idx];

  if (body.action === 'confirm' && doc.status === 'picked') {
    docs[idx] = { ...doc, status: 'completed', confirmedBy: session.username, confirmedAt: new Date().toISOString() };

    const now = new Date().toISOString();
    const txns = readJson<BatchTransaction>('batch_transactions.json');
    const stock = readJson<StockEntry>('stock.json');

    doc.lines.forEach(line => {
      const existing = txns.filter(t => t.batchNumber === line.batchNumber && t.itemCode === line.itemCode);
      const lastBalance = existing.length > 0 ? existing[existing.length - 1].balanceQty : 0;
      txns.push({
        id: uuidv4(),
        transactionType: 'GI',
        docNumber: doc.docNumber,
        docDate: doc.docDate,
        itemCode: line.itemCode,
        itemName: line.itemName,
        batchNumber: line.batchNumber,
        warehouseCode: line.warehouseCode,
        binCode: line.binCode,
        qtyIn: 0,
        qtyOut: line.qty,
        balanceQty: lastBalance - line.qty,
        createdBy: session.username,
        createdAt: now,
        remark: line.reason,
      });

      const sIdx = stock.findIndex(s => s.batchNumber === line.batchNumber && s.warehouseCode === line.warehouseCode && s.binCode === line.binCode);
      if (sIdx >= 0) {
        stock[sIdx].quantity = Math.max(0, stock[sIdx].quantity - line.qty);
        stock[sIdx].updatedAt = now;
      }
    });

    writeJson('batch_transactions.json', txns);
    writeJson('stock.json', stock);
    writeJson('gi.json', docs);
    return NextResponse.json(docs[idx]);
  }

  docs[idx] = { ...doc, ...body };
  writeJson('gi.json', docs);
  return NextResponse.json(docs[idx]);
}
