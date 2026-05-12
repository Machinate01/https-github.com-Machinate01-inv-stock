import { NextRequest, NextResponse } from 'next/server';
import { readJson } from '@/lib/data/db';
import { BatchTransaction } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batch = searchParams.get('batch')?.toLowerCase() || '';
  const item = searchParams.get('item')?.toLowerCase() || '';
  const type = searchParams.get('type') || '';
  const wh = searchParams.get('wh') || '';
  const bin = searchParams.get('bin')?.toLowerCase() || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  let txns = await readJson<BatchTransaction>('batch_transactions.json');

  if (batch) txns = txns.filter(t => t.batchNumber.toLowerCase().includes(batch));
  if (item) txns = txns.filter(t => t.itemCode.toLowerCase().includes(item) || t.itemName.toLowerCase().includes(item));
  if (type) txns = txns.filter(t => t.transactionType === type);
  if (wh) txns = txns.filter(t => t.warehouseCode === wh);
  if (bin) txns = txns.filter(t => t.binCode?.toLowerCase().includes(bin));
  if (dateFrom) txns = txns.filter(t => t.docDate >= dateFrom);
  if (dateTo) txns = txns.filter(t => t.docDate <= dateTo);

  return NextResponse.json(txns.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
