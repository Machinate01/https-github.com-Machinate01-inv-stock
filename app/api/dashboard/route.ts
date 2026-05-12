import { NextResponse } from 'next/server';
import { readJson } from '@/lib/data/db';
import { GRPO, GoodsReceipt, GoodsIssue, PutawayTask, PickList, BatchTransaction, Batch } from '@/lib/types';

export async function GET() {
  const grpos = await readJson<GRPO>('grpo.json');
  const grs = await readJson<GoodsReceipt>('gr.json');
  const gis = await readJson<GoodsIssue>('gi.json');
  const putaways = await readJson<PutawayTask>('putaway.json');
  const picklists = await readJson<PickList>('picklist.json');
  const txns = await readJson<BatchTransaction>('batch_transactions.json');

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
