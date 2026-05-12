import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson, findById } from '@/lib/data/db';
import { PutawayTask, GRPO, GoodsReceipt, StockEntry, BatchTransaction } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/utils/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await findById<PutawayTask>('putaway.json', id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role === 'readonly')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const docs = await readJson<PutawayTask>('putaway.json');
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const doc = docs[idx];

  // Confirm putaway for one line → update stock & batch_transactions
  if (body.action === 'update_line') {
    const { lineNum, actualBin, warehouseCode } = body;
    const now = new Date().toISOString();

    // Find the line being confirmed
    const line = doc.lines.find(l => l.lineNum === lineNum);
    if (!line) return NextResponse.json({ error: 'Line not found' }, { status: 404 });

    // Update stock.json — add qty to the actual bin
    const stock = await readJson<StockEntry>('stock.json');
    const sIdx = stock.findIndex(s =>
      s.itemCode === line.itemCode &&
      s.batchNumber === line.batchNumber &&
      s.warehouseCode === warehouseCode &&
      s.binCode === actualBin
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
        warehouseCode,
        binCode: actualBin,
        quantity: line.qty,
        unit: line.unit,
        updatedAt: now,
      });
    }

    // If bin changed from suggestedBin, remove qty from old bin (if any)
    if (line.suggestedBin && line.suggestedBin !== actualBin) {
      const oldIdx = stock.findIndex(s =>
        s.itemCode === line.itemCode &&
        s.batchNumber === line.batchNumber &&
        s.warehouseCode === warehouseCode &&
        s.binCode === line.suggestedBin
      );
      if (oldIdx >= 0) {
        stock[oldIdx].quantity -= line.qty;
        if (stock[oldIdx].quantity <= 0) stock.splice(oldIdx, 1);
        else stock[oldIdx].updatedAt = now;
      }
    }

    // If the item came in without a bin (binCode=''), remove that ghost entry
    const ghostIdx = stock.findIndex(s =>
      s.itemCode === line.itemCode &&
      s.batchNumber === line.batchNumber &&
      s.warehouseCode === warehouseCode &&
      s.binCode === ''
    );
    if (ghostIdx >= 0 && actualBin !== '') {
      stock[ghostIdx].quantity -= line.qty;
      if (stock[ghostIdx].quantity <= 0) stock.splice(ghostIdx, 1);
      else stock[ghostIdx].updatedAt = now;
    }

    await writeJson('stock.json', stock);

    // batch_transactions — record putaway movement
    const txns = await readJson<BatchTransaction>('batch_transactions.json');
    const prevTxns = txns.filter(t => t.itemCode === line.itemCode && t.batchNumber === line.batchNumber);
    const lastBalance = prevTxns.length > 0 ? prevTxns[prevTxns.length - 1].balanceQty : line.qty;
    txns.push({
      id: uuidv4(),
      transactionType: 'PUTAWAY',
      docNumber: doc.docNumber,
      docDate: now.split('T')[0],
      itemCode: line.itemCode,
      itemName: line.itemName,
      batchNumber: line.batchNumber,
      expiryDate: '',
      warehouseCode,
      binCode: actualBin,
      qtyIn: 0,
      qtyOut: 0,
      balanceQty: lastBalance,
      createdBy: session.username,
      createdAt: now,
      remark: `Putaway: ${doc.sourceDocNumber} → ${actualBin}`,
    });
    await writeJson('batch_transactions.json', txns);

    // Update putaway line status
    docs[idx].lines = doc.lines.map(l =>
      l.lineNum === lineNum
        ? { ...l, actualBin, warehouseCode, status: 'completed', completedAt: now }
        : l
    );
    const allDone = docs[idx].lines.every(l => l.status === 'completed');
    docs[idx].status = allDone ? 'completed' : 'in_progress';
    if (allDone) docs[idx].completedAt = now;
    await writeJson('putaway.json', docs);

    // Update source doc status when all done
    if (allDone) {
      if (doc.sourceType === 'GRPO') {
        const grpos = await readJson<GRPO>('grpo.json');
        const gi = grpos.findIndex(g => g.docNumber === doc.sourceDocNumber);
        if (gi >= 0) { grpos[gi].status = 'completed'; await writeJson('grpo.json', grpos); }
      } else {
        const grs = await readJson<GoodsReceipt>('gr.json');
        const gi = grs.findIndex(g => g.docNumber === doc.sourceDocNumber);
        if (gi >= 0) { grs[gi].status = 'completed'; await writeJson('gr.json', grs); }
      }
    }
    return NextResponse.json(docs[idx]);
  }

  // Complete all pending lines without bin → mark completed as-is
  if (body.action === 'complete_all') {
    const now = new Date().toISOString();
    docs[idx].lines = doc.lines.map(l => ({
      ...l,
      status: 'completed' as const,
      completedAt: l.completedAt || now,
    }));
    docs[idx].status = 'completed';
    docs[idx].completedAt = now;
    await writeJson('putaway.json', docs);
    return NextResponse.json(docs[idx]);
  }

  docs[idx] = { ...doc, ...body };
  await writeJson('putaway.json', docs);
  return NextResponse.json(docs[idx]);
}
