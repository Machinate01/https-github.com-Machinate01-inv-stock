import { findById } from '@/lib/data/db';
import { PutawayTask } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import PutawayLineActions from './PutawayLineActions';

export default async function PutawayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await findById<PutawayTask>('putaway.json', id);
  if (!doc) notFound();

  const completedLines = doc.lines.filter(l => l.status === 'completed');

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/putaway" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">{doc.docNumber}</h1>
          <p className="text-slate-500 text-sm">จาก {doc.sourceType}: {doc.sourceDocNumber} · {doc.docDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium
            ${doc.status === 'completed' ? 'bg-green-100 text-green-700' : doc.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {doc.status === 'completed' ? 'เสร็จสิ้น' : doc.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">ความคืบหน้า</p>
          <p className="text-sm text-slate-500">{completedLines.length}/{doc.lines.length} รายการ</p>
        </div>
        <div className="bg-slate-100 rounded-full h-3">
          <div className="bg-purple-500 h-3 rounded-full transition-all"
            style={{ width: `${doc.lines.length > 0 ? (completedLines.length / doc.lines.length) * 100 : 0}%` }}>
          </div>
        </div>
      </div>

      {/* Lines */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">รายการจัดวาง</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {doc.lines.map(line => (
            <div key={line.lineNum} className={`px-5 py-4 ${line.status === 'completed' ? 'bg-green-50' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  {line.status === 'completed'
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <div className="w-5 h-5 border-2 border-slate-300 rounded-full"></div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-700">{line.itemCode} — {line.itemName}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Batch: <span className="font-mono text-blue-600">{line.batchNumber}</span>
                        {' · '}จำนวน: <span className="font-semibold">{line.qty} {line.unit}</span>
                        {' · '}คลัง: <span className="font-medium">{line.warehouseCode}</span>
                      </p>
                      {line.status === 'completed' && (
                        <p className="text-sm text-green-700 mt-1">
                          ✓ จัดวางที่ Bin: <span className="font-mono font-semibold">{line.actualBin}</span>
                        </p>
                      )}
                      {line.suggestedBin && line.status !== 'completed' && (
                        <p className="text-sm text-slate-400 mt-1">แนะนำ: {line.suggestedBin}</p>
                      )}
                    </div>
                    {line.status === 'pending' && doc.status !== 'completed' && (
                      <PutawayLineActions
                        putawayId={doc.id}
                        lineNum={line.lineNum}
                        warehouseCode={line.warehouseCode}
                        suggestedBin={line.suggestedBin}
                      />
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
