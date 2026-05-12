import { NextRequest, NextResponse } from 'next/server';
import { readJson } from '@/lib/data/db';
import { StockEntry } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const warehouse = searchParams.get('warehouse');
  const itemCode = searchParams.get('itemCode');

  let stock = (await readJson<StockEntry>('stock.json')).filter(s => s.quantity > 0);

  if (warehouse) stock = stock.filter(s => s.warehouseCode === warehouse);
  if (itemCode) stock = stock.filter(s => s.itemCode === itemCode);

  return NextResponse.json(stock);
}
