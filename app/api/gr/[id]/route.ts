import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson, findById } from '@/lib/data/db';
import { GoodsReceipt, BatchTransaction, StockEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/utils/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await findById<GoodsReceipt>('gr.json', id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role === 'readonly')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const docs = await readJson<GoodsReceipt>('gr.json');
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const doc = docs[idx];

  // Confirm GR → update stock & batch transactions directly
  if (body.action === 'confirm' && doc.status === 'draft') {
    const now = new Date().toISOString();
    const txns = await readJson<BatchTransaction>('batch_transactions.json');
    const stock = await readJson<StockEntry>('stock.json');

    doc.lines.forEach(line => {
      // Batch transaction
      const prevTxns = txns.filter(t => t.batchNumber === line.batchNumber && t.itemCode === line.itemCode);
      const lastBalance = prevTxns.length > 0 ? prevTxns[prevTxns.length - 1].balanceQty : 0;
      txns.push({
        id: uuidv4(),
        transactionType: 'GR',
        docNumber: doc.docNumber,
        docDate: doc.docDate,
        itemCode: line.itemCode,
        itemName: line.itemName,
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate || '',
        warehouseCode: line.warehouseCode,
        binCode: line.binCode || '',
        qtyIn: line.qty,
        qtyOut: 0,
        balanceQty: lastBalance + line.qty,
        createdBy: session.username,
        createdAt: now,
        remark: `GR: ${doc.type}${doc.remark ? ' / ' + doc.remark : ''}`,
      });

      // Update stock
      const sIdx = stock.findIndex(s =>
        s.itemCode === line.itemCode &&
        s.batchNumber === line.batchNumber &&
        s.warehouseCode === line.warehouseCode &&
        s.binCode === (line.binCode || '')
      );
      if (sIdx >= 0) {
        stock[sIdx].quantity += line.qty;
        stock[sIdx].updatedAt = now;
      } else {
        stock.push({
          id: uuidv4(),
          itemCode: line.itemCode,
          itemName: line.itemName,
          batchNumber: line.batchNumber,
          warehouseCode: line.warehouseCode,
          binCode: line.binCode || '',
          quantity: line.qty,
          unit: line.unit,
          updatedAt: now,
        });
      }
    });

    docs[idx] = {
      ...doc,
      status: 'confirmed',
      confirmedBy: session.username,
      confirmedAt: now,
    };

    await writeJson('batch_transactions.json', txns);
    await writeJson('stock.json', stock);
    await writeJson('gr.json', docs);
    return NextResponse.json(docs[idx]);
  }

  // General update
  docs[idx] = { ...doc, ...body };
  await writeJson('gr.json', docs);
  return NextResponse.json(docs[idx]);
}
