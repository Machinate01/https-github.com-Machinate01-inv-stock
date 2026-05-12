import { NextRequest, NextResponse } from 'next/server';
import { readJson, appendJson, writeJson, getNextDocNumber } from '@/lib/data/db';
import { GoodsIssue, PickList, PickListLine } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/utils/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  let docs = readJson<GoodsIssue>('gi.json');
  if (status) docs = docs.filter(d => d.status === status);
  return NextResponse.json(docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'readonly')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const docNumber = getNextDocNumber('GI');
  const plNumber = getNextDocNumber('PL');

  const doc: GoodsIssue = {
    id: uuidv4(),
    docNumber,
    ...body,
    status: 'pick_pending',
    createdBy: session.username,
    createdAt: new Date().toISOString(),
  };

  // Auto-create Pick List
  const plLines: PickListLine[] = body.lines.map((line: GoodsIssue['lines'][0], i: number) => ({
    lineNum: i + 1,
    itemCode: line.itemCode,
    itemName: line.itemName,
    batchNumber: line.batchNumber,
    requiredQty: line.qty,
    pickedQty: 0,
    unit: line.unit,
    warehouseCode: line.warehouseCode,
    binCode: line.binCode,
    status: 'pending',
  }));

  const pickList: PickList = {
    id: uuidv4(),
    docNumber: plNumber,
    giDocNumber: docNumber,
    docDate: body.docDate,
    lines: plLines,
    status: 'pending',
    createdBy: session.username,
    createdAt: new Date().toISOString(),
  };

  doc.pickListId = pickList.id;
  appendJson('gi.json', doc);
  appendJson('picklist.json', pickList);
  return NextResponse.json({ gi: doc, pickList }, { status: 201 });
}
