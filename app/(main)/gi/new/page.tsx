'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

interface WH { code: string; name: string; }
interface StockEntry { id: string; itemCode: string; itemName: string; batchNumber: string; warehouseCode: string; binCode: string; quantity: number; unit: string; }
interface Line {
  lineNum: number; itemCode: string; itemName: string;
  qty: number; unit: string; batchNumber: string;
  warehouseCode: string; binCode: string; reason: string; availableQty: number;
}

export default function NewGIPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ docDate: today, postingDate: today, type: 'normal', requestedBy: '', remark: '' });
  const [lines, setLines] = useState<Line[]>([]);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, StockEntry[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetch('/api/warehouses').then(r => r.json()).then(setWarehouses); }, []);

  async function loadStock(wh: string) {
    if (stockMap[wh]) return;
    const data: StockEntry[] = await fetch(`/api/stock?warehouse=${wh}`).then(r => r.json());
    setStockMap(prev => ({ ...prev, [wh]: data }));
  }

  function addLine() {
    const wh = warehouses[0]?.code || 'WH1';
    setLines(prev => [...prev, {
      lineNum: prev.length + 1, itemCode: '', itemName: '', qty: 1, unit: 'EA',
      batchNumber: '', warehouseCode: wh, binCode: '', reason: '', availableQty: 0,
    }]);
    loadStock(wh);
  }

  function changeWarehouse(idx: number, wh: string) {
    setLines(prev => {
      const u = [...prev];
      u[idx] = { ...u[idx], warehouseCode: wh, itemCode: '', itemName: '', batchNumber: '', binCode: '', qty: 1, availableQty: 0 };
      return u;
    });
    loadStock(wh);
  }

  function changeItem(idx: number, itemCode: string) {
    const wh = lines[idx].warehouseCode;
    const first = (stockMap[wh] || []).find(s => s.itemCode === itemCode);
    setLines(prev => {
      const u = [...prev];
      u[idx] = { ...u[idx], itemCode, itemName: first?.itemName || '', unit: first?.unit || 'EA', batchNumber: '', binCode: '', qty: 1, availableQty: 0 };
      return u;
    });
  }

  function changeBatch(idx: number, batchNumber: string) {
    const { warehouseCode, itemCode } = lines[idx];
    // find all bin entries for this item+batch
    const entries = (stockMap[warehouseCode] || []).filter(s => s.itemCode === itemCode && s.batchNumber === batchNumber);
    // if only one bin, auto-select it
    const autoBin = entries.length === 1 ? entries[0] : null;
    setLines(prev => {
      const u = [...prev];
      u[idx] = {
        ...u[idx],
        batchNumber,
        binCode: autoBin?.binCode || '',
        availableQty: autoBin?.quantity || 0,
        qty: Math.min(u[idx].qty, autoBin?.quantity || u[idx].qty),
      };
      return u;
    });
  }

  function changeBin(idx: number, binCode: string) {
    const { warehouseCode, itemCode, batchNumber } = lines[idx];
    const entry = (stockMap[warehouseCode] || []).find(s => s.itemCode === itemCode && s.batchNumber === batchNumber && s.binCode === binCode);
    setLines(prev => {
      const u = [...prev];
      u[idx] = {
        ...u[idx],
        binCode,
        availableQty: entry?.quantity || 0,
        qty: Math.min(u[idx].qty, entry?.quantity || u[idx].qty),
      };
      return u;
    });
  }

  function updateLine(idx: number, field: string, val: string | number) {
    setLines(prev => { const u = [...prev]; u[idx] = { ...u[idx], [field]: val }; return u; });
  }

  // Unique items in stock for a warehouse
  function getStockItems(wh: string) {
    const seen = new Set<string>();
    return (stockMap[wh] || []).filter(s => { if (seen.has(s.itemCode)) return false; seen.add(s.itemCode); return true; });
  }

  // Unique batches for item+warehouse (sum qty across bins)
  function getItemBatches(wh: string, itemCode: string) {
    const entries = (stockMap[wh] || []).filter(s => s.itemCode === itemCode);
    const batchMap = new Map<string, number>();
    entries.forEach(s => batchMap.set(s.batchNumber, (batchMap.get(s.batchNumber) || 0) + s.quantity));
    return Array.from(batchMap.entries()).map(([batch, qty]) => ({ batchNumber: batch, totalQty: qty }));
  }

  // Bins that have stock for item+batch+warehouse
  function getBatchBins(wh: string, itemCode: string, batchNumber: string) {
    return (stockMap[wh] || []).filter(s => s.itemCode === itemCode && s.batchNumber === batchNumber && s.binCode);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lines.length) { setError('กรุณาเพิ่มรายการสินค้า'); return; }
    if (lines.some(l => !l.itemCode)) { setError('กรุณาเลือกสินค้าให้ครบทุกรายการ'); return; }
    if (lines.some(l => !l.batchNumber)) { setError('กรุณาเลือก Lot/Batch ให้ครบทุกรายการ'); return; }
    if (lines.some(l => l.qty <= 0)) { setError('จำนวนต้องมากกว่า 0'); return; }
    if (lines.some(l => l.qty > l.availableQty)) { setError('จำนวนที่เบิกเกินกว่า stock ที่มี'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/gi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, lines }) });
    if (res.ok) { const d = await res.json(); router.push(`/gi/${d.gi.id}`); }
    else { const d = await res.json(); setError(d.error || 'เกิดข้อผิดพลาด'); }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/gi" className="text-slate-500 hover:text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-slate-800">สร้าง Goods Issue ใหม่</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-700 mb-4">ข้อมูลเอกสาร</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">ประเภท</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})
              } className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="normal">เบิกปกติ</option>
                <option value="sample">สินค้าตัวอย่าง</option>
                <option value="destroy">ทำลาย</option>
                <option value="transfer">โอนย้าย</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">วันที่เอกสาร <span className="text-red-500">*</span></label>
              <input type="date" value={form.docDate} onChange={e => setForm({...form, docDate: e.target.value})} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">วันที่ Posting</label>
              <input type="date" value={form.postingDate} onChange={e => setForm({...form, postingDate: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">ผู้ขอเบิก</label>
              <input value={form.requestedBy} onChange={e => setForm({...form, requestedBy: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="ชื่อผู้ขอเบิก" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-600 mb-1">หมายเหตุ</label>
              <input value={form.remark} onChange={e => setForm({...form, remark: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="หมายเหตุ" />
            </div>
          </div>
        </div>

        {/* Lines */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">รายการสินค้าที่ต้องการเบิก</h2>
            <button type="button" onClick={addLine}
              className="bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition">
              <Plus className="w-4 h-4" /> เพิ่มรายการ
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              คลิก &quot;เพิ่มรายการ&quot; เพื่อเลือกสินค้าจาก Stock
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((l, idx) => {
                const stockItems = getStockItems(l.warehouseCode);
                const batches = getItemBatches(l.warehouseCode, l.itemCode);
                const batchBins = getBatchBins(l.warehouseCode, l.itemCode, l.batchNumber);
                const overStock = l.availableQty > 0 && l.qty > l.availableQty;

                return (
                  <div key={idx} className={`border rounded-xl p-4 ${overStock ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                    {/* Row 1: warehouse + item + batch */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-xs font-bold text-slate-400 pt-6 w-6 text-center flex-shrink-0">#{l.lineNum}</span>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        {/* Warehouse */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">คลังสินค้า</label>
                          <select value={l.warehouseCode} onChange={e => changeWarehouse(idx, e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                            {warehouses.map(w => <option key={w.code} value={w.code}>{w.code} — {w.name}</option>)}
                          </select>
                        </div>
                        {/* Item */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">สินค้า <span className="text-red-500">*</span></label>
                          <select value={l.itemCode} onChange={e => changeItem(idx, e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                            <option value="">-- เลือกสินค้า --</option>
                            {stockItems.map(s => (
                              <option key={s.itemCode} value={s.itemCode}>{s.itemCode} — {s.itemName}</option>
                            ))}
                          </select>
                          {stockItems.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">ไม่มีสินค้าใน {l.warehouseCode}</p>
                          )}
                        </div>
                        {/* Batch */}
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Lot / Batch <span className="text-red-500">*</span></label>
                          <select value={l.batchNumber} onChange={e => changeBatch(idx, e.target.value)}
                            disabled={!l.itemCode}
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-slate-100 disabled:text-slate-400">
                            <option value="">-- เลือก Lot --</option>
                            {batches.map(b => (
                              <option key={b.batchNumber} value={b.batchNumber}>
                                {b.batchNumber}  (รวม {b.totalQty} {l.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button type="button" onClick={() => setLines(p => p.filter((_,i)=>i!==idx).map((x,i)=>({...x,lineNum:i+1})))}
                        className="text-red-400 hover:text-red-600 flex-shrink-0 mt-5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Row 2: bin + qty + unit + reason */}
                    <div className="ml-9 grid grid-cols-4 gap-3">
                      {/* Bin — only bins with stock for this item+batch */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Bin Location</label>
                        {batchBins.length === 0 ? (
                          <select disabled className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-100 text-slate-400">
                            <option>{l.batchNumber ? 'ไม่ระบุ Bin' : '-- เลือก Lot ก่อน --'}</option>
                          </select>
                        ) : (
                          <select value={l.binCode} onChange={e => changeBin(idx, e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                            <option value="">-- เลือก Bin --</option>
                            {batchBins.map(b => (
                              <option key={b.binCode} value={b.binCode}>
                                {b.binCode || '(ไม่ระบุ)'}  ({b.quantity} {b.unit})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Qty */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">จำนวนเบิก <span className="text-red-500">*</span></label>
                        <input type="number" min="1" max={l.availableQty || undefined} value={l.qty}
                          onChange={e => updateLine(idx, 'qty', +e.target.value)}
                          className={`w-full border rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 bg-white font-semibold ${overStock ? 'border-red-400 focus:ring-red-400 text-red-600' : 'border-slate-300 focus:ring-orange-500'}`} />
                        {l.availableQty > 0 && (
                          <p className={`text-xs mt-1 text-center ${overStock ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                            คงเหลือ: {l.availableQty} {l.unit}
                            {overStock && ' ⚠ เกิน'}
                          </p>
                        )}
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">หน่วย</label>
                        <input value={l.unit} readOnly
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-center bg-slate-100 text-slate-500" />
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">เหตุผล</label>
                        <input value={l.reason} onChange={e => updateLine(idx, 'reason', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" placeholder="เหตุผล" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg border border-red-200">{error}</p>}
        <div className="flex justify-end gap-3">
          <Link href="/gi" className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm transition">ยกเลิก</Link>
          <button type="submit" disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition disabled:opacity-60">
            <Save className="w-4 h-4" /> {loading ? 'กำลังบันทึก...' : 'บันทึก GI + สร้าง Pick List'}
          </button>
        </div>
      </form>
    </div>
  );
}
