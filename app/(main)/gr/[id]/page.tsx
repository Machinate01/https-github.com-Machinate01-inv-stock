'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

interface GRLine {
  lineNum: number; itemCode: string; itemName: string; qty: number; unit: string;
  batchNumber: string; expiryDate: string; manufacturingDate: string;
  warehouseCode: string; binCode: string; reason: string;
}
interface GR {
  id: string; docNumber: string; type: string; docDate: string; postingDate: string;
  remark: string; status: string; lines: GRLine[];
  createdBy: string; createdAt: string; confirmedBy?: string; confirmedAt?: string;
}

const statusLabel: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-600' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700' },
};

const typeLabel: Record<string, string> = {
  general:    'รับสินค้าทั่วไป',
  return:     'รับสินค้าคืน',
  adjustment: 'ปรับปรุงสต็อก',
};

export default function GRDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<GR | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/gr/${id}`)
      .then(r => r.json())
      .then(data => { setDoc(data); setLoading(false); });
  }, [id]);

  async function handleConfirm() {
    if (!confirm('ยืนยันการรับสินค้า? Stock จะถูกอัปเดตทันที')) return;
    setConfirming(true); setError('');
    const res = await fetch(`/api/gr/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDoc(updated);
    } else {
      const d = await res.json();
      setError(d.error || 'เกิดข้อผิดพลาด');
    }
    setConfirming(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> กำลังโหลด...
    </div>
  );
  if (!doc) return <div className="text-center py-20 text-slate-400">ไม่พบเอกสาร</div>;

  const st = statusLabel[doc.status] || { label: doc.status, color: 'bg-slate-100 text-slate-600' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/gr" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">{doc.docNumber}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
          </div>
          <p className="text-slate-500 text-sm">{typeLabel[doc.type] || doc.type} · วันที่: {doc.docDate}</p>
        </div>

        {/* Confirm Button — only when draft */}
        {doc.status === 'draft' && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition disabled:opacity-60"
          >
            {confirming
              ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังยืนยัน...</>
              : <><CheckCircle className="w-4 h-4" /> ยืนยันรับสินค้า</>
            }
          </button>
        )}
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg border border-red-200 mb-4">{error}</p>}

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-slate-400 mb-1">วันที่เอกสาร</p>
          <p className="font-medium text-slate-700">{doc.docDate}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-slate-400 mb-1">วันที่ Posting</p>
          <p className="font-medium text-slate-700">{doc.postingDate || '-'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-slate-400 mb-1">สร้างโดย</p>
          <p className="font-medium text-slate-700">{doc.createdBy}</p>
        </div>
        {doc.remark && (
          <div className="col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs text-slate-400 mb-1">หมายเหตุ</p>
            <p className="text-slate-700">{doc.remark}</p>
          </div>
        )}
        {doc.confirmedBy && (
          <div className="col-span-3 bg-green-50 rounded-xl border border-green-200 p-4">
            <p className="text-xs text-green-600 mb-1">ยืนยันโดย</p>
            <p className="font-medium text-green-800">{doc.confirmedBy} · {new Date(doc.confirmedAt!).toLocaleString('th-TH')}</p>
          </div>
        )}
      </div>

      {/* Lines table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">รายการสินค้า</h2>
          <span className="text-xs text-slate-400">{doc.lines.length} รายการ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="px-4 py-3 text-center w-10">#</th>
                <th className="px-4 py-3 text-left">Item Code</th>
                <th className="px-4 py-3 text-left">ชื่อสินค้า</th>
                <th className="px-4 py-3 text-center">จำนวน</th>
                <th className="px-4 py-3 text-center">หน่วย</th>
                <th className="px-4 py-3 text-left">Batch No.</th>
                <th className="px-4 py-3 text-left">Exp. Date</th>
                <th className="px-4 py-3 text-left">คลัง</th>
                <th className="px-4 py-3 text-left">Bin</th>
                <th className="px-4 py-3 text-left">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {doc.lines.map(l => (
                <tr key={l.lineNum} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-center text-slate-400">{l.lineNum}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-700">{l.itemCode}</td>
                  <td className="px-4 py-3 text-slate-700">{l.itemName}</td>
                  <td className="px-4 py-3 text-center font-semibold text-green-700">{l.qty}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{l.unit}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{l.batchNumber || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{l.expiryDate || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{l.warehouseCode}</td>
                  <td className="px-4 py-3 text-slate-500">{l.binCode || '-'}</td>
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
