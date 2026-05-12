import { NextResponse } from 'next/server';
import { readJson } from '@/lib/data/db';
import { GRPO, GoodsReceipt, GoodsIssue, PutawayTask, PickList, BatchTransaction, Batch } from '@/lib/types';

export async function GET() {
  const grpos = readJson<GRPO>('grpo.json');
  const grs = readJson<GoodsReceipt>('gr.json');
  const gis = readJson<GoodsIssue>('gi.json');
  const putaways = readJson<PutawayTask>('putaway.json');
  const picklists = readJson<PickList>('picklist.json');
  const txns = readJson<BatchTransaction>('batch_transactions.json');

  const stats = {
    totalTransactions: txns.length,
    pendingGRPO: grpos.filter(d => ['draft', 'putaway_pending'].includes(d.status)).length,
    pendingGR: grs.filter(d => ['draft', 'putaway_pending'].includes(d.status)).length,
    pendingGI: gis.filter(d => ['draft', 'pick_pending', 'picked'].includes(d.status)).length,
    pendingPutaway: putaways.filter(d => d.status !== 'completed').length,
    pendingPickList: picklists.filter(d => d.status !== 'completed' && d.status !== 'cancelled').length,
    recentTransactions: txns.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10),
    recentGRPO: grpos.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    recentGI: gis.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  };

  return NextResponse.json(stats);
}
