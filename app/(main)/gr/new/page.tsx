'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ItemSearch from '@/components/forms/ItemSearch';

interface WH { code: string; name: string; }
interface Bin { id: string; binCode: string; }
interface Line { lineNum: number; itemCode: string; itemName: string; qty: number; unit: string; batchNumber: string; expiryDate: string; manufacturingDate: string; warehouseCode: string; binCode: string; reason: string; }

export default function NewGRPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ docDate: today, postingDate: today, type: 'general', remark: '' });
  const [lines, setLines] = useState<Line[]>([]);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [bins, setBins] = useState<Record<string, Bin[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetch('/api/warehouses').then(r => r.json()).then(setWarehouses); }, []);

  async function loadBins(wh: string) {
    if (bins[wh]) return;
    const data = await fetch(`/api/warehouses?warehouse=${wh}`).then(r => r.json());
    setBins(prev => ({ ...prev, [wh]: data }));
  }

  function addLine() {
    setLines(prev => [...prev, { lineNum: prev.length + 1, itemCode: '', itemName: '', qty: 0, unit: 'EA', batchNumber: '', expiryDate: '', manufacturingDate: '', warehouseCode: warehouses[0]?.code || 'WH1', binCode: '', reason: '' }]);
  }

  function updateLine(idx: number, field: string, val: string | number) {
    setLines(prev => { const u = [...prev]; u[idx] = { ...u[idx], [field]: val }; return u; });
    if (field === 'warehouseCode') loadBins(val as string);
  }

  function setLineItem(idx: number, item: { code: string; name: string; unit: string }) {
    setLines(prev => { const u = [...prev]; u[idx] = { ...u[idx], itemCode: item.code, itemName: item.name, unit: item.unit }; return u; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lines.length) { setError('กรุณาเพิ่มรายการสินค้า'); return; }
    if (lines.some(l => !l.itemCode)) { setError('กรุณาเลือกสินค้าให้ครบทุกรายการ'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/gr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, lines }) });
    if (res.ok) { const doc = await res.json(); router.push(`/gr/${doc.id}`); }
    else { const d = await res.json(); setError(d.error || 'เกิดข้อผิดพลาด'); }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/gr" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-slate-800">สร้าง Goods Receipt ใหม่</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-700 mb-4">ข้อมูลเอกสาร</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">ประเภท</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="general">รับสินค้าทั่วไป</option>
                <option value="return">รับสินค้าคืน</option>
                <option value="adjustment">ปรับปรุงสต็อก</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">วันที่เอกสาร <span className="text-red-500">*</span></label>
              <input type="date" value={form.docDate} onChange={e => setForm({...form, docDate: e.target.value})} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">วันที่ Posting</label>
              <input type="date" value={form.postingDate} onChange={e => setForm({...form, postingDate: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">หมายเหตุ</label>
              <input value={form.remark} onChange={e => setForm({...form, remark: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="หมายเหตุ" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">รายการสินค้า</h2>
            <button type="button" onClick={addLine} className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition"><Plus className="w-4 h-4" /> เพิ่มรายการ</button>
          </div>
          {lines.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">คลิก &quot;เพิ่มรายการ&quot; เพื่อเพิ่มสินค้า</div>
          ) : (
            <div className="space-y-3">
              {lines.map((l, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-end gap-3 mb-3">
                    <span className="text-xs font-bold text-slate-400 pb-2">#{l.lineNum}</span>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 mb-1">สินค้า <span className="text-red-500">*</span></label>
                      <ItemSearch value={{ code: l.itemCode, name: l.itemName, unit: l.unit }} onChange={item => setLineItem(idx, item)} />
                    </div>
                    <button type="button" onClick={() => setLines(p => p.filter((_,i)=>i!==idx).map((x,i)=>({...x,lineNum:i+1})))} className="text-red-400 hover:text-red-600 pb-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">จำนวน <span className="text-red-500">*</span></label>
                      <input type="number" min="0" value={l.qty} onChange={e => updateLine(idx,'qty',+e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-semibold" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">หน่วย</label>
                      <input value={l.unit} onChange={e => updateLine(idx,'unit',e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Batch No. <span className="text-red-500">*</span></label>
                      <input value={l.batchNumber} onChange={e => updateLine(idx,'batchNumber',e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono" placeholder="Batch No." />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Exp. Date</label>
                      <input type="date" value={l.expiryDate} onChange={e => updateLine(idx,'expiryDate',e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">คลังสินค้า</label>
                      <select value={l.warehouseCode} onChange={e => updateLine(idx,'warehouseCode',e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        {warehouses.map(w => <option key={w.code} value={w.code}>{w.code} - {w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Bin Location</label>
                      <select value={l.binCode} onChange={e => updateLine(idx,'binCode',e.target.value)} onFocus={() => loadBins(l.warehouseCode)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        <option value="">-- เลือก Bin --</option>
                        {(bins[l.warehouseCode]||[]).map(b => <option key={b.id} value={b.binCode}>{b.binCode}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">เหตุผล/หมายเหตุ</label>
                      <input value={l.reason} onChange={e => updateLine(idx,'reason',e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" placeholder="หมายเหตุ" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg border border-red-200">{error}</p>}
        <div className="flex justify-end gap-3">
          <Link href="/gr" className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm transition">ยกเลิก</Link>
          <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition disabled:opacity-60">
            <Save className="w-4 h-4" /> {loading ? 'กำลังบันทึก...' : 'บันทึก GR'}
          </button>
        </div>
      </form>
    </div>
  );
}
