import { getSession } from '@/lib/utils/auth';
import { readJson } from '@/lib/data/db';
import { GRPO, GoodsReceipt, GoodsIssue, PutawayTask, PickList, BatchTransaction } from '@/lib/types';
import Link from 'next/link';
import { FileInput, PackagePlus, PackageMinus, MapPin, ClipboardList, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

function StatCard({ title, value, sub, href, icon: Icon, color }: {
  title: string; value: number; sub?: string; href: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Link href={href} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 text-xs text-slate-400 group-hover:text-blue-600 transition">
        <span>ดูรายละเอียด</span><ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const grpos = await readJson<GRPO>('grpo.json');
  const grs = await readJson<GoodsReceipt>('gr.json');
  const gis = await readJson<GoodsIssue>('gi.json');
  const putaways = await readJson<PutawayTask>('putaway.json');
  const picklists = await readJson<PickList>('picklist.json');
  const txns = await readJson<BatchTransaction>('batch_transactions.json');

  const pendingGRPO = grpos.filter(d => ['draft', 'putaway_pending'].includes(d.status)).length;
  const pendingGR = grs.filter(d => ['draft', 'putaway_pending'].includes(d.status)).length;
  const pendingGI = gis.filter(d => ['draft', 'pick_pending', 'picked'].includes(d.status)).length;
  const pendingPutaway = putaways.filter(d => d.status !== 'completed').length;
  const pendingPick = picklists.filter(d => !['completed', 'cancelled'].includes(d.status)).length;
  const recentTxns = txns.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  const today = new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{today} · ยินดีต้อนรับ, {session?.name}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="รอรับสินค้า PO" value={pendingGRPO} href="/grpo" icon={FileInput} color="text-blue-600" sub="GRPO รอดำเนินการ" />
        <StatCard title="รับสินค้าทั่วไป" value={pendingGR} href="/gr" icon={PackagePlus} color="text-green-600" sub="GR รอดำเนินการ" />
        <StatCard title="เบิกสินค้า" value={pendingGI} href="/gi" icon={PackageMinus} color="text-orange-600" sub="GI รอดำเนินการ" />
        <StatCard title="รอ Putaway" value={pendingPutaway} href="/putaway" icon={MapPin} color="text-purple-600" sub="งาน Putaway ค้างอยู่" />
        <StatCard title="Pick List" value={pendingPick} href="/pick-list" icon={ClipboardList} color="text-rose-600" sub="รายการรอหยิบสินค้า" />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">การเคลื่อนไหวล่าสุด</h2>
          <Link href="/batch-report" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentTxns.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-2">📦</p>
              <p>ยังไม่มีการเคลื่อนไหว</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs">
                  <th className="px-4 py-3 text-left">ประเภท</th>
                  <th className="px-4 py-3 text-left">เลขที่เอกสาร</th>
                  <th className="px-4 py-3 text-left">รหัสสินค้า</th>
                  <th className="px-4 py-3 text-left">Batch No.</th>
                  <th className="px-4 py-3 text-left">คลัง / Bin</th>
                  <th className="px-4 py-3 text-right">รับ</th>
                  <th className="px-4 py-3 text-right">จ่าย</th>
                  <th className="px-4 py-3 text-right">คงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentTxns.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                        ${t.transactionType === 'GRPO' || t.transactionType === 'GR' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {t.transactionType === 'GRPO' || t.transactionType === 'GR' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {t.transactionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.docNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{t.itemCode}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{t.batchNumber}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{t.warehouseCode} / {t.binCode}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{t.qtyIn > 0 ? `+${t.qtyIn}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">{t.qtyOut > 0 ? `-${t.qtyOut}` : '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{t.balanceQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
