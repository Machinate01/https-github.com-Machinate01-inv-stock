import { findById } from '@/lib/data/db';
import { PickList } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import PickActions from './PickActions';

export default async function PickListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await findById<PickList>('picklist.json', id);
  if (!doc) notFound();

  const pickedLines = doc.lines.filter(l => l.status === 'picked').length;
  const pct = doc.lines.length > 0 ? Math.round((pickedLines / doc.lines.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pick-list" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{doc.docNumber}</h1>
          <p className="text-slate-500 text-sm">GI: {doc.giDocNumber} · {doc.docDate}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium
          ${doc.status === 'completed' ? 'bg-green-100 text-green-700' : doc.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {doc.status === 'completed' ? 'หยิบแล้ว' : doc.status === 'in_progress' ? 'กำลังหยิบ' : 'รอหยิบ'}
        </span>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">ความคืบหน้าการหยิบสินค้า</p>
          <p className="text-sm text-slate-500">{pickedLines}/{doc.lines.length} รายการ ({pct}%)</p>
        </div>
        <div className="bg-slate-100 rounded-full h-3">
          <div className="bg-rose-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      {/* Lines */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">รายการหยิบสินค้า</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {doc.lines.map(line => (
            <div key={line.lineNum} className={`px-5 py-4 ${line.status === 'picked' ? 'bg-green-50' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  {line.status === 'picked'
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : line.status === 'partial'
                    ? <div className="w-5 h-5 border-2 border-orange-400 rounded-full flex items-center justify-center"><div className="w-2.5 h-2.5 bg-orange-400 rounded-full"></div></div>
                    : <Clock className="w-5 h-5 text-slate-300" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-700">{line.itemCode} — {line.itemName}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Batch: <span className="font-mono text-blue-600">{line.batchNumber}</span>
                        {' · '}คลัง: <span className="font-medium">{line.warehouseCode}</span>
                        {' · '}Bin: <span className="font-mono text-purple-600">{line.binCode}</span>
                      </p>
                      <p className="text-sm mt-1">
                        ต้องหยิบ: <span className="font-semibold text-slate-700">{line.requiredQty} {line.unit}</span>
                        {line.pickedQty > 0 && <span className="ml-3 text-green-700">หยิบแล้ว: <span className="font-semibold">{line.pickedQty}</span></span>}
                      </p>
                      {line.status === 'picked' && line.pickedBy && (
                        <p className="text-xs text-green-600 mt-1">หยิบโดย {line.pickedBy}</p>
                      )}
                    </div>
                    {line.status !== 'picked' && doc.status !== 'completed' && (
                      <PickActions pickListId={doc.id} lineNum={line.lineNum} requiredQty={line.requiredQty} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
