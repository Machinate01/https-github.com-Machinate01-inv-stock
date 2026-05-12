import { NextRequest, NextResponse } from 'next/server';
import { readJson } from '@/lib/data/db';
import { PutawayTask } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  let docs = await readJson<PutawayTask>('putaway.json');
  if (status) docs = docs.filter(d => d.status === status);
  return NextResponse.json(docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
