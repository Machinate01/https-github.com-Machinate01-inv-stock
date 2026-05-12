import { readJson } from '@/lib/data/db';
import { GRPO } from '@/lib/types';
import Link from 'next/link';
import { Plus, FileInput, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const statusLabel: Record<string, { label: string; color: string }> = {
  draft:           { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  confirmed:       { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  putaway_pending: { label: 'รอ Putaway', color: 'bg-yellow-100 text-yellow-700' },
  completed:       { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' },
};

export default async function GRPOListPage() {
  const docs = readJson<GRPO>('grpo.json').sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FileInput className="w-6 h-6 text-blue-600" /> Goods Receipt PO</h1>
          <p className="text-slate-500 text-sm mt-1">รับสินค้าตามใบสั่งซื้อ (GRPO)</p>
        </div>
        <Link href="/grpo/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition">
          <Plus className="w-4 h-4" /> สร้าง GRPO ใหม่
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {docs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileInput className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีเอกสาร GRPO</p>
            <Link href="/grpo/new" className="mt-3 inline-block text-blue-600 text-sm hover:underline">สร้างใหม่</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="px-4 py-3 text-left">เลขที่เอกสาร</th>
                <th className="px-4 py-3 text-left">เลขที่ PO</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">วันที่เอกสาร</th>
                <th className="px-4 py-3 text-center">รายการ</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-left">สร้างโดย</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {docs.map(doc => {
                const st = statusLabel[doc.status];
                return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{doc.docNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.poNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{doc.vendorName}</td>
                    <td className="px-4 py-3 text-slate-500">{doc.docDate}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{doc.lines.length}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{doc.createdBy}</td>
                    <td className="px-4 py-3">
                      <Link href={`/grpo/${doc.id}`} className="text-blue-600 hover:underline text-xs">เปิด</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
