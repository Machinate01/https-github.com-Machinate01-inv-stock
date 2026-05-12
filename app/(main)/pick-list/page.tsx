import { readJson } from '@/lib/data/db';
import { PickList } from '@/lib/types';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:     { label: 'รอหยิบ', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'กำลังหยิบ', color: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'หยิบแล้ว', color: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
};

export default async function PickListPage() {
  const docs = (await readJson<PickList>('picklist.json')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-rose-600" /> Pick List</h1>
        <p className="text-slate-500 text-sm mt-1">รายการหยิบสินค้าสำหรับ Goods Issue</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {docs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มี Pick List</p>
            <p className="text-sm mt-1">Pick List จะถูกสร้างอัตโนมัติเมื่อสร้าง GI</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs">
              <th className="px-4 py-3 text-left">เลขที่ Pick List</th>
              <th className="px-4 py-3 text-left">เลขที่ GI</th>
              <th className="px-4 py-3 text-left">วันที่</th>
              <th className="px-4 py-3 text-center">รายการ</th>
              <th className="px-4 py-3 text-center">หยิบแล้ว</th>
              <th className="px-4 py-3 text-center">สถานะ</th>
              <th className="px-4 py-3 text-left">สร้างโดย</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {docs.map(doc => {
                const st = statusLabel[doc.status];
                const pickedLines = doc.lines.filter(l => l.status === 'picked').length;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-rose-700">{doc.docNumber}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{doc.giDocNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{doc.docDate}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{doc.lines.length}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${pickedLines === doc.lines.length ? 'text-green-600' : 'text-orange-600'}`}>
                        {pickedLines}/{doc.lines.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span></td>
                    <td className="px-4 py-3 text-slate-500">{doc.createdBy}</td>
                    <td className="px-4 py-3"><Link href={`/pick-list/${doc.id}`} className="text-rose-600 hover:underline text-xs">เปิด</Link></td>
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
