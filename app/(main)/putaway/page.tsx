import { readJson } from '@/lib/data/db';
import { PutawayTask } from '@/lib/types';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import UnlocatedStock from './UnlocatedStock';

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:     { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' },
};

export default async function PutawayPage() {
  const docs = readJson<PutawayTask>('putaway.json').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = docs.filter(d => d.status !== 'completed');
  const done = docs.filter(d => d.status === 'completed');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-6 h-6 text-purple-600" /> Putaway</h1>
        <p className="text-slate-500 text-sm mt-1">จัดวางสินค้าเข้า Bin Location</p>
      </div>

      {/* Unlocated stock section */}
      <UnlocatedStock />

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block"></span>
            รอดำเนินการ ({pending.length})
          </h2>
          <div className="grid gap-3">
            {pending.map(doc => {
              const done_lines = doc.lines.filter(l => l.status === 'completed').length;
              const total_lines = doc.lines.length;
              const pct = total_lines > 0 ? Math.round((done_lines / total_lines) * 100) : 0;
              const st = statusLabel[doc.status];
              return (
                <Link key={doc.id} href={`/putaway/${doc.id}`}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-700 font-mono">{doc.docNumber}</p>
                      <p className="text-sm text-slate-500">จาก {doc.sourceType}: <span className="font-medium text-blue-600">{doc.sourceDocNumber}</span></p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500">{done_lines}/{total_lines} รายการ ({pct}%)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{doc.docDate} · สร้างโดย {doc.createdBy}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
            เสร็จสิ้นแล้ว ({done.length})
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="px-4 py-3 text-left">เลขที่</th>
                <th className="px-4 py-3 text-left">แหล่งที่มา</th>
                <th className="px-4 py-3 text-left">วันที่</th>
                <th className="px-4 py-3 text-center">รายการ</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {done.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-purple-700">{doc.docNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.sourceType}: {doc.sourceDocNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{doc.docDate}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{doc.lines.length}</td>
                    <td className="px-4 py-3"><Link href={`/putaway/${doc.id}`} className="text-purple-600 hover:underline text-xs">เปิด</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {docs.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ไม่มีงาน Putaway</p>
          <p className="text-sm mt-1">งาน Putaway จะถูกสร้างอัตโนมัติเมื่อ Confirm GRPO หรือ GR</p>
        </div>
      )}
    </div>
  );
}
