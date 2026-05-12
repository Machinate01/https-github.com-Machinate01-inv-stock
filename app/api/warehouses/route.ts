import { NextResponse } from 'next/server';
import { readJson } from '@/lib/data/db';
import { Warehouse, BinLocation } from '@/lib/types';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const warehouseCode = searchParams.get('warehouse');

  if (warehouseCode) {
    // Return bins for a specific warehouse
    const bins = readJson<BinLocation>('bins.json')
      .filter(b => b.warehouseCode === warehouseCode && b.active);
    return NextResponse.json(bins);
  }

  const warehouses = readJson<Warehouse>('warehouses.json').filter(w => w.active);
  return NextResponse.json(warehouses);
}
