import { findById } from '@/lib/data/db';
import { GRPO } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, MapPin } from 'lucide-react';
import GRPOActions from './GRPOActions';

const statusLabel: Record<string, { label: string; color: string }> = {
  draft:           { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  confirmed:       { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  putaway_pending: { label: 'รอ Putaway', color: 'bg-yellow-100 text-yellow-700' },
  completed:       { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' },
};

export default async function GRPODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = findById<GRPO>('grpo.json', id);
  if (!doc) notFound();
  const st = statusLabel[doc.status];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/grpo" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">{doc.docNumber}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
          </div>
          <p className="text-slate-500 text-sm">PO: {doc.poNumber} · {doc.vendorName}</p>
        </div>
        <GRPOActions doc={doc} />
      </div>

      {/* Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">วันที่เอกสาร</p>
          <p className="font-medium text-slate-700">{doc.docDate}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">วันที่ Posting</p>
          <p className="font-medium text-slate-700">{doc.postingDate}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">สร้างโดย</p>
          <p className="font-medium text-slate-700">{doc.createdBy}</p>
        </div>
        {doc.remark && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 col-span-3">
            <p className="text-xs text-slate-400 mb-1">หมายเหตุ</p>
            <p className="text-slate-700">{doc.remark}</p>
          </div>
        )}
      </div>

      {/* Lines */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">รายการสินค้า ({doc.lines.length} รายการ)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="px-4 py-3 text-center">#</th>
                <th className="px-4 py-3 text-left">Item Code</th>
                <th className="px-4 py-3 text-left">ชื่อสินค้า</th>
                <th className="px-4 py-3 text-center">สั่ง</th>
                <th className="px-4 py-3 text-center">รับ</th>
                <th className="px-4 py-3 text-center">หน่วย</th>
                <th className="px-4 py-3 text-left">Batch No.</th>
                <th className="px-4 py-3 text-left">Exp. Date</th>
                <th className="px-4 py-3 text-left">คลัง</th>
                <th className="px-4 py-3 text-left">Bin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {doc.lines.map(line => (
                <tr key={line.lineNum} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-400">{line.lineNum}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{line.itemCode}</td>
                  <td className="px-4 py-3 text-slate-600">{line.itemName}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{line.orderedQty}</td>
                  <td className="px-4 py-3 text-center font-semibold text-blue-700">{line.receivedQty}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{line.unit}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{line.batchNumber}</td>
                  <td className="px-4 py-3 text-slate-500">{line.expiryDate || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{line.warehouseCode}</td>
                  <td className="px-4 py-3 text-slate-500">{line.binCode || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
