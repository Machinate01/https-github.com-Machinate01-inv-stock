import { NextRequest, NextResponse } from 'next/server';
import { readJson, appendJson } from '@/lib/data/db';
import { Item } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '@/lib/utils/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  let items = (await readJson<Item>('items.json')).filter(i => i.active);
  if (q) items = items.filter(i => i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !['admin', 'manager'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const items = await readJson<Item>('items.json');
  if (items.find(i => i.code === body.code))
    return NextResponse.json({ error: 'Item code already exists' }, { status: 400 });

  const item: Item = { id: uuidv4(), ...body, active: true, createdAt: new Date().toISOString() };
  await appendJson('items.json', item);
  return NextResponse.json(item, { status: 201 });
}
