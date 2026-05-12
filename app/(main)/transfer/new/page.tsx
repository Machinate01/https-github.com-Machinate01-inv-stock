'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, Trash2, Save, Search, ArrowLeftRight } from 'lucide-react';

interface StockEntry { id: string; itemCode: string; itemName: string; batchNumber: string; warehouseCode: string; binCode: string; quantity: number; unit: string; }
interface Bin { id: string; binCode: string; }
interface WH { code: string; name: string; }

interface TransferLine {
  key: number;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  unit: string;
  fromWarehouseCode: string;
  fromBinCode: string;
  qty: number;
  maxQty: number;
  toWarehouseCode: string;
  toBinCode: string;
}

// Searchable bin input component
function BinSearch({ value, onChange, bins, placeholder }: {
  value: string; onChange: (v: string) => void; bins: Bin[]; placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setQuery(value), 0); return () => clearTimeout(t); }, [value]);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = query
    ? bins.filter(b => b.binCode.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : bins.slice(0, 10);
  const isNew = query.trim() && !bins.some(b => b.binCode === query.trim());

  function pick(code: string) { setQuery(code); onChange(code); setShow(false); }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 bg-white">
        <Search className="w-3.5 h-3.5 text-slate-400 ml-2 flex-shrink-0" />
        <input type="text" value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          placeholder={placeholder || 'พิมพ์หรือเลือก Bin...'}
          className="px-2 py-2 text-sm w-36 focus:outline-none" />
        {isNew && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 mr-1 rounded font-medium">ใหม่</span>}
      </div>
      {show && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-52 max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">
              {query ? `ไม่พบ "${query}" — จะใช้เป็น Bin ใหม่` : 'ไม่มี Bin'}
            </div>
          ) : (
            <>
              {filtered.map(b => (
                <button key={b.id} type="button" onMouseDown={() => pick(b.binCode)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 font-mono border-b border-slate-50 last:border-0">
                  {b.binCode}
                </button>
              ))}
              {query && !bins.some(b => b.binCode === query) && (
                <button type="button" onMouseDown={() => pick(query)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 text-amber-700 font-medium border-t border-slate-100">
                  + ใช้ &quot;{query}&quot; (ใหม่)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewTransferPage() {
  const router = useRouter();
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [remark, setRemark] = useState('');
  const [lines, setLines] = useState<TransferLine[]>([]);
  const [counter, setCounter] = useState(0);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, StockEntry[]>>({});
  const [destBins, setDestBins] = useState<Record<number, Bin[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/warehouses').then(r => r.json()).then(setWarehouses);
  }, []);

  async function getStockForWH(wh: string) {
    if (stockMap[wh]) return stockMap[wh];
    const data: StockEntry[] = await fetch(`/api/stock?warehouse=${wh}`).then(r => r.json());
    setStockMap(prev => ({ ...prev, [wh]: data }));
    return data;
  }

  async function loadDestBins(key: number, wh: string) {
    const data: Bin[] = await fetch(`/api/warehouses?warehouse=${wh}`).then(r => r.json());
    setDestBins(prev => ({ ...prev, [key]: data }));
  }

  function addLine() {
    const wh = warehouses[0]?.code || '';
    const key = counter;
    setCounter(c => c + 1);
    setLines(prev => [...prev, {
      key, itemCode: '', itemName: '', batchNumber: '', unit: '',
      fromWarehouseCode: wh, fromBinCode: '', qty: 1, maxQty: 0,
      toWarehouseCode: wh, toBinCode: '',
    }]);
    if (wh) loadDestBins(key, wh);
  }

  function removeLine(key: number) {
    setLines(prev => prev.filter(l => l.key !== key));
  }

  function updateLine(key: number, patch: Partial<TransferLine>) {
    setLines(prev => prev.map(l => l.key === key ? { ...l, ...patch } : l));
  }

  // Get unique items from stock for a warehouse
  function getItems(wh: string) {
    const st = stockMap[wh] || [];
    const seen = new Set<string>();
    return st.filter(s => { if (seen.has(s.itemCode)) return false; seen.add(s.itemCode); return true; });
  }

  // Get batches for item in warehouse
  function getBatches(wh: string, itemCode: string) {
    return (stockMap[wh] || []).filter(s => s.itemCode === itemCode);
  }

  // Get bins for a batch entry
  function getSourceBins(wh: string, itemCode: string, batch: string) {
    return (stockMap[wh] || []).filter(s => s.itemCode === itemCode && s.batchNumber === batch && s.quantity > 0);
  }

  async function handleFromWHChange(key: number, wh: string) {
    const stock = await getStockForWH(wh);
    setStockMap(prev => ({ ...prev, [wh]: stock }));
    updateLine(key, { fromWarehouseCode: wh, itemCode: '', itemName: '', batchNumber: '', fromBinCode: '', maxQty: 0, unit: '' });
  }

  function handleItemChange(key: number, wh: string, itemCode: string) {
    const batches = getBatches(wh, itemCode);
    const first = batches[0];
    updateLine(key, {
      itemCode,
      itemName: first?.itemName || '',
      batchNumber: first?.batchNumber || '',
      fromBinCode: first?.binCode || '',
      maxQty: first?.quantity || 0,
      unit: first?.unit || '',
    });
  }

  function handleBatchChange(key: number, wh: string, itemCode: string, batch: string) {
    const bins = getSourceBins(wh, itemCode, batch);
    const first = bins[0];
    updateLine(key, {
      batchNumber: batch,
      fromBinCode: first?.binCode || '',
      maxQty: first?.quantity || 0,
      unit: first?.unit || '',
    });
  }

  function handleSrcBinChange(key: number, wh: string, itemCode: string, batch: string, binCode: string) {
    const entry = (stockMap[wh] || []).find(s => s.itemCode === itemCode && s.batchNumber === batch && s.binCode === binCode);
    updateLine(key, { fromBinCode: binCode, maxQty: entry?.quantity || 0 });
  }

  async function handleToWHChange(key: number, wh: string) {
    updateLine(key, { toWarehouseCode: wh, toBinCode: '' });
    await loadDestBins(key, wh);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) { setError('กรุณาเพิ่มรายการ'); return; }
    for (const l of lines) {
      if (!l.itemCode) { setError('กรุณาเลือกสินค้า'); return; }
      if (!l.fromBinCode) { setError('กรุณาเลือก Bin ต้นทาง'); return; }
      if (!l.toBinCode) { setError('กรุณาระบุ Bin ปลายทาง'); return; }
      if (l.fromWarehouseCode === l.toWarehouseCode && l.fromBinCode === l.toBinCode) {
        setError(`Bin ต้นทางและปลายทางเหมือนกัน: ${l.fromBinCode}`); return;
      }
      if (l.qty <= 0) { setError('จำนวนต้องมากกว่า 0'); return; }
    }
    setSaving(true); setError('');
    const res = await fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docDate, remark, lines }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || 'เกิดข้อผิดพลาด'); return; }
    router.replace('/transfer');
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-600 rounded-xl p-2.5">
          <ArrowLeftRight className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Transfer Location</h1>
          <p className="text-slate-500 text-sm">โอนย้ายสินค้าระหว่าง Bin Location</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header fields */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">วันที่เอกสาร</label>
            <input type="date" value={docDate} onChange={e => setDocDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ</label>
            <input type="text" value={remark} onChange={e => setRemark(e.target.value)}
              placeholder="หมายเหตุ (ถ้ามี)"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Lines */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">รายการโอนย้าย</h2>
            <button type="button" onClick={addLine}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition">
              <Plus className="w-4 h-4" /> เพิ่มรายการ
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">กด &quot;เพิ่มรายการ&quot; เพื่อเพิ่มรายการโอนย้าย</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lines.map((line, idx) => {
                const items = getItems(line.fromWarehouseCode);
                const batches = getBatches(line.fromWarehouseCode, line.itemCode);
                const srcBins = getSourceBins(line.fromWarehouseCode, line.itemCode, line.batchNumber);
                const dBins = destBins[line.key] || [];

                return (
                  <div key={line.key} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-400 uppercase">รายการที่ {idx + 1}</span>
                      <button type="button" onClick={() => removeLine(line.key)}
                        className="text-slate-400 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* FROM section */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-2">FROM — ต้นทาง</p>
                        <div className="flex flex-wrap gap-2">
                          {/* From WH */}
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">คลัง</label>
                            <select value={line.fromWarehouseCode}
                              onChange={e => handleFromWHChange(line.key, e.target.value)}
                              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                              {warehouses.map(w => <option key={w.code} value={w.code}>{w.code}</option>)}
                            </select>
                          </div>

                          {/* Item */}
                          <div className="flex-1 min-w-40">
                            <label className="block text-xs text-slate-500 mb-1">สินค้า</label>
                            <select value={line.itemCode}
                              onChange={e => handleItemChange(line.key, line.fromWarehouseCode, e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                              <option value="">-- เลือกสินค้า --</option>
                              {items.map(s => <option key={s.itemCode} value={s.itemCode}>{s.itemCode} — {s.itemName}</option>)}
                            </select>
                          </div>

                          {/* Batch */}
                          {line.itemCode && (
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Batch/Lot</label>
                              <select value={line.batchNumber}
                                onChange={e => handleBatchChange(line.key, line.fromWarehouseCode, line.itemCode, e.target.value)}
                                className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                                {batches.map(b => <option key={b.batchNumber + b.binCode} value={b.batchNumber}>{b.batchNumber}</option>)}
                              </select>
                            </div>
                          )}

                          {/* Source Bin */}
                          {line.batchNumber && srcBins.length > 0 && (
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Bin ต้นทาง</label>
                              <select value={line.fromBinCode}
                                onChange={e => handleSrcBinChange(line.key, line.fromWarehouseCode, line.itemCode, line.batchNumber, e.target.value)}
                                className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-mono">
                                {srcBins.map(b => (
                                  <option key={b.binCode} value={b.binCode}>{b.binCode} ({b.quantity} {b.unit})</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Qty */}
                          {line.fromBinCode && (
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">จำนวน (max {line.maxQty})</label>
                              <input type="number" min={1} max={line.maxQty} value={line.qty}
                                onChange={e => updateLine(line.key, { qty: Math.min(Number(e.target.value), line.maxQty) })}
                                className="w-24 border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2 text-indigo-500">
                          <ArrowRight className="w-5 h-5" />
                          <span className="text-xs font-medium">โอนไปยัง</span>
                        </div>
                      </div>

                      {/* TO section */}
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-indigo-600 mb-2">TO — ปลายทาง</p>
                        <div className="flex flex-wrap gap-2 items-end">
                          {/* To WH */}
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">คลังปลายทาง</label>
                            <select value={line.toWarehouseCode}
                              onChange={e => handleToWHChange(line.key, e.target.value)}
                              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                              {warehouses.map(w => <option key={w.code} value={w.code}>{w.code}</option>)}
                            </select>
                          </div>

                          {/* To Bin */}
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Bin ปลายทาง</label>
                            <BinSearch
                              value={line.toBinCode}
                              onChange={v => updateLine(line.key, { toBinCode: v })}
                              bins={dBins}
                              placeholder="พิมพ์หรือเลือก Bin..."
                            />
                          </div>

                          {/* Summary */}
                          {line.toBinCode && line.fromBinCode && (
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-indigo-200">
                              <span className="font-mono text-xs text-slate-600">{line.fromWarehouseCode}/{line.fromBinCode}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                              <span className="font-mono text-xs text-indigo-700 font-semibold">{line.toWarehouseCode}/{line.toBinCode}</span>
                              <span className="text-xs text-slate-500 ml-1">{line.qty} {line.unit}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</p>}

        {/* Action buttons */}
        <div className="flex gap-3 justify-end pb-6">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            ยกเลิก
          </button>
          <button type="submit" disabled={saving || lines.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition">
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'ยืนยันการโอนย้าย'}
          </button>
        </div>
      </form>
    </div>
  );
}
