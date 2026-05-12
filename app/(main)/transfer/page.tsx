import Link from 'next/link';
import { readJson } from '@/lib/data/db';
import { TransferLocation } from '@/lib/types';
import { Plus, ArrowLeftRight, ArrowRight, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TransferListPage() {
  const transfers = (await readJson<TransferLocation>('transfers.json'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 rounded-xl p-2.5">
            <ArrowLeftRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Transfer Location</h1>
            <p className="text-slate-500 text-sm">โอนย้ายสินค้าระหว่าง Bin Location</p>
          </div>
        </div>
        <Link href="/transfer/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition shadow-sm">
          <Plus className="w-4 h-4" /> สร้าง Transfer
        </Link>
      </div>

      {/* Table */}
      {transfers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-16">
          <ArrowLeftRight className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">ยังไม่มีรายการโอนย้าย</p>
          <p className="text-slate-400 text-sm mt-1">กด &quot;สร้าง Transfer&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">เลขที่เอกสาร</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">วันที่</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">รายการ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">หมายเหตุ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ผู้สร้าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono text-indigo-700 font-semibold text-sm">{t.docNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.docDate}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {t.lines.map(l => (
                          <div key={l.lineNum} className="flex items-center gap-2 text-xs text-slate-600">
                            <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="font-mono text-blue-700">{l.itemCode}</span>
                            <span className="text-slate-400">Batch:{l.batchNumber}</span>
                            <span className="font-mono text-slate-500">{l.fromWarehouseCode}/{l.fromBinCode}</span>
                            <ArrowRight className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                            <span className="font-mono text-indigo-700 font-medium">{l.toWarehouseCode}/{l.toBinCode}</span>
                            <span className="text-slate-500">{l.qty} {l.unit}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{t.remark || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{t.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
