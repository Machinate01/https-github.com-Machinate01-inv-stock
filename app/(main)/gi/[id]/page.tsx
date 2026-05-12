import { findById } from '@/lib/data/db';
import { GoodsIssue } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GIActions from './GIActions';

const statusLabel: Record<string, { label: string; color: string }> = {
  draft:        { label: 'Draft',     color: 'bg-slate-100 text-slate-600' },
  pick_pending: { label: 'รอ Pick',  color: 'bg-yellow-100 text-yellow-700' },
  picked:       { label: 'หยิบแล้ว', color: 'bg-blue-100 text-blue-700' },
  confirmed:    { label: 'Confirmed', color: 'bg-purple-100 text-purple-700' },
  completed:    { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' },
};

export default async function GIDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = findById<GoodsIssue>('gi.json', id);
  if (!doc) notFound();
  const st = statusLabel[doc.status];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/gi" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">{doc.docNumber}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
          </div>
          <p className="text-slate-500 text-sm">ประเภท: {doc.type} · วันที่: {doc.docDate} · {doc.requestedBy && `ผู้ขอเบิก: ${doc.requestedBy}`}</p>
        </div>
        <GIActions doc={doc} />
      </div>
      {doc.pickListId && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <p className="text-blue-700 text-sm">มี Pick List สำหรับเอกสารนี้</p>
          <Link href={`/pick-list`} className="text-blue-600 hover:underline text-sm">ไปที่ Pick List →</Link>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">รายการสินค้า ({doc.lines.length} รายการ)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs">
              <th className="px-4 py-3 text-center">#</th>
              <th className="px-4 py-3 text-left">Item Code</th>
              <th className="px-4 py-3 text-left">ชื่อสินค้า</th>
              <th className="px-4 py-3 text-center">จำนวน</th>
              <th className="px-4 py-3 text-center">หน่วย</th>
              <th className="px-4 py-3 text-left">Batch No.</th>
              <th className="px-4 py-3 text-left">คลัง</th>
              <th className="px-4 py-3 text-left">Bin</th>
              <th className="px-4 py-3 text-left">เหตุผล</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {doc.lines.map(l => (
                <tr key={l.lineNum} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-400">{l.lineNum}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{l.itemCode}</td>
                  <td className="px-4 py-3 text-slate-600">{l.itemName}</td>
                  <td className="px-4 py-3 text-center font-semibold text-orange-700">{l.qty}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{l.unit}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{l.batchNumber}</td>
                  <td className="px-4 py-3 text-slate-500">{l.warehouseCode}</td>
                  <td className="px-4 py-3 text-slate-500">{l.binCode}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{l.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
