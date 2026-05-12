import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson, findById } from '@/lib/data/db';
import { PutawayTask } from '@/lib/types';
import { getSession } from '@/lib/utils/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  let docs = readJson<PutawayTask>('putaway.json');
  if (status) docs = docs.filter(d => d.status === status);
  return NextResponse.json(docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
