import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson, findById } from '@/lib/data/db';
import { PickList, GoodsIssue } from '@/lib/types';
import { getSession } from '@/lib/utils/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = findById<PickList>('picklist.json', id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role === 'readonly')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const docs = readJson<PickList>('picklist.json');
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const doc = docs[idx];

  if (body.action === 'pick_line') {
    const { lineNum, pickedQty } = body;
    const now = new Date().toISOString();
    docs[idx].lines = doc.lines.map(l => {
      if (l.lineNum !== lineNum) return l;
      const newPicked = Math.min(pickedQty, l.requiredQty);
      return { ...l, pickedQty: newPicked, status: newPicked >= l.requiredQty ? 'picked' as const : 'partial' as const, pickedAt: now, pickedBy: session.username };
    });
    const allPicked = docs[idx].lines.every(l => l.status === 'picked');
    docs[idx].status = allPicked ? 'completed' : 'in_progress';
    if (allPicked) docs[idx].completedAt = now;
    writeJson('picklist.json', docs);

    // Update GI status
    if (allPicked) {
      const gis = readJson<GoodsIssue>('gi.json');
      const giIdx = gis.findIndex(g => g.pickListId === id);
      if (giIdx >= 0) { gis[giIdx].status = 'picked'; writeJson('gi.json', gis); }
    }
    return NextResponse.json(docs[idx]);
  }

  docs[idx] = { ...doc, ...body };
  writeJson('picklist.json', docs);
  return NextResponse.json(docs[idx]);
}
