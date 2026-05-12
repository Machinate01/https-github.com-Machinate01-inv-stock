import { NextRequest, NextResponse } from 'next/server';
import { readJson, appendJson, getNextDocNumber } from '@/lib/data/db';
import { GoodsReceipt } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/utils/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  let docs = await readJson<GoodsReceipt>('gr.json');
  if (status) docs = docs.filter(d => d.status === status);
  return NextResponse.json(docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === 'readonly')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const doc: GoodsReceipt = {
    id: uuidv4(),
    docNumber: await getNextDocNumber('GR'),
    ...body,
    status: 'draft',
    createdBy: session.username,
    createdAt: new Date().toISOString(),
  };
  await appendJson('gr.json', doc);
  return NextResponse.json(doc, { status: 201 });
}
