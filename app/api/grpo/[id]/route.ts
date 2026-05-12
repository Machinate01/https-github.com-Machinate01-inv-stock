import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson, findById } from '@/lib/data/db';
import { GRPO, PutawayTask, PutawayLine, BatchTransaction, StockEntry } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/utils/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = findById<GRPO>('grpo.json', id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role === 'readonly')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const docs = readJson<GRPO>('grpo.json');
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const doc = docs[idx];

  // Confirm GRPO → create Putaway Task
  if (body.action === 'confirm' && doc.status === 'draft') {
    docs[idx] = {
      ...doc,
      status: 'putaway_pending',
      confirmedBy: session.username,
      confirmedAt: new Date().toISOString(),
    };

    // Create putaway task
    const putawayLines: PutawayLine[] = doc.lines.map((line, i) => ({
      lineNum: i + 1,
      itemCode: line.itemCode,
      itemName: line.itemName,
      batchNumber: line.batchNumber,
      qty: line.receivedQty,
      unit: line.unit,
      suggestedBin: line.binCode,
      actualBin: line.binCode || '',
      warehouseCode: line.warehouseCode,
      status: 'pending',
    }));

    const putaways = readJson<PutawayTask>('putaway.json');
    const putawayTask: PutawayTask = {
      id: uuidv4(),
      docNumber: `PUT-${doc.docNumber}`,
      sourceType: 'GRPO',
      sourceDocNumber: doc.docNumber,
      docDate: new Date().toISOString().split('T')[0],
      lines: putawayLines,
      status: 'pending',
      createdBy: session.username,
      createdAt: new Date().toISOString(),
    };
    putaways.push(putawayTask);
    writeJson('putaway.json', putaways);
    writeJson('grpo.json', docs);
    return NextResponse.json(docs[idx]);
  }

  // Complete putaway → update stock & batch transactions
  if (body.action === 'complete_putaway' && doc.status === 'putaway_pending') {
    docs[idx] = { ...doc, status: 'completed' };

    const now = new Date().toISOString();
    const txns = readJson<BatchTransaction>('batch_transactions.json');
    const stock = readJson<StockEntry>('stock.json');

    doc.lines.forEach(line => {
      // Batch transaction
      const existing = txns.filter(t => t.batchNumber === line.batchNumber && t.itemCode === line.itemCode);
      const lastBalance = existing.length > 0 ? existing[existing.length - 1].balanceQty : 0;
      txns.push({
        id: uuidv4(),
        transactionType: 'GRPO',
        docNumber: doc.docNumber,
        docDate: doc.docDate,
        itemCode: line.itemCode,
        itemName: line.itemName,
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate,
        warehouseCode: line.warehouseCode,
        binCode: line.binCode || '',
        qtyIn: line.receivedQty,
        qtyOut: 0,
        balanceQty: lastBalance + line.receivedQty,
        createdBy: session.username,
        createdAt: now,
        remark: `GRPO: ${doc.poNumber}`,
      });

      // Stock
      const sIdx = stock.findIndex(s => s.batchNumber === line.batchNumber && s.warehouseCode === line.warehouseCode && s.binCode === (line.binCode || ''));
      if (sIdx >= 0) {
        stock[sIdx].quantity += line.receivedQty;
        stock[sIdx].updatedAt = now;
      } else {
        stock.push({
          id: uuidv4(),
          itemCode: line.itemCode,
          itemName: line.itemName,
          batchNumber: line.batchNumber,
          warehouseCode: line.warehouseCode,
          binCode: line.binCode || '',
          quantity: line.receivedQty,
          unit: line.unit,
          updatedAt: now,
        });
      }
    });

    writeJson('batch_transactions.json', txns);
    writeJson('stock.json', stock);
    writeJson('grpo.json', docs);
    return NextResponse.json(docs[idx]);
  }

  // General update
  docs[idx] = { ...doc, ...body };
  writeJson('grpo.json', docs);
  return NextResponse.json(docs[idx]);
}
