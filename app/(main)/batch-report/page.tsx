'use client';
import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Search, TrendingUp, TrendingDown, Filter, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface Txn {
  id: string; transactionType: string; docNumber: string; docDate: string;
  itemCode: string; itemName: string; batchNumber: string; expiryDate?: string;
  warehouseCode: string; binCode: string; qtyIn: number; qtyOut: number;
  balanceQty: number; createdBy: string; createdAt: string; remark?: string;
  calcBalance?: number;
}

interface StockEntry {
  id: string; itemCode: string; itemName: string; batchNumber: string;
  warehouseCode: string; binCode: string; quantity: number; unit: string;
}

interface WH { code: string; name: string; }

const TYPE_COLOR: Record<string, string> = {
  GRPO: 'bg-blue-100 text-blue-700',
  GR: 'bg-green-100 text-green-700',
  GI: 'bg-orange-100 text-orange-700',
  PUTAWAY: 'bg-purple-100 text-purple-700',
  TRANSFER: 'bg-indigo-100 text-indigo-700',
  ADJUSTMENT: 'bg-slate-100 text-slate-600',
};

export default function BatchReportPage() {
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({ batch: '', item: '', type: '', wh: '', bin: '', dateFrom: '', dateTo: today });
  const [txns, setTxns] = useState<Txn[]>([]);
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetch('/api/warehouses').then(r => r.json()).then(setWarehouses); }, []);

  async function search() {
    setLoading(true);
    const q = new URLSearchParams();
    if (filters.batch) q.set('batch', filters.batch);
    if (filters.item) q.set('item', filters.item);
    if (filters.type) q.set('type', filters.type);
    if (filters.wh) q.set('wh', filters.wh);
    if (filters.bin) q.set('bin', filters.bin);
    if (filters.dateFrom) q.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) q.set('dateTo', filters.dateTo);

    const stockQ = new URLSearchParams();
    if (filters.wh) stockQ.set('warehouse', filters.wh);
    if (filters.item) stockQ.set('itemCode', filters.item);

    const [txnData, stockData] = await Promise.all([
      fetch(`/api/batch-report?${q.toString()}`).then(r => r.json()),
      fetch(`/api/stock?${stockQ.toString()}`).then(r => r.json()),
    ]);

    // Filter stock by batch/bin if specified
    let filteredStock: StockEntry[] = stockData;
    if (filters.batch) filteredStock = filteredStock.filter((s: StockEntry) =>
      s.batchNumber.toLowerCase().includes(filters.batch.toLowerCase()));
    if (filters.bin) filteredStock = filteredStock.filter((s: StockEntry) =>
      s.binCode?.toLowerCase().includes(filters.bin.toLowerCase()));
    if (filters.item) filteredStock = filteredStock.filter((s: StockEntry) =>
      s.itemCode.toLowerCase().includes(filters.item.toLowerCase()) ||
      s.itemName.toLowerCase().includes(filters.item.toLowerCase()));

    setTxns(txnData);
    setStock(filteredStock.filter((s: StockEntry) => s.quantity > 0));
    setLoading(false);
    setSearched(true);
    setShowHistory(false);
  }

  function reset() {
    setFilters({ batch: '', item: '', type: '', wh: '', bin: '', dateFrom: '', dateTo: today });
    setTxns([]); setStock([]); setSearched(false); setShowHistory(false);
  }

  const totalIn = txns.reduce((s, t) => s + t.qtyIn, 0);
  const totalOut = txns.reduce((s, t) => s + t.qtyOut, 0);

  // Recalculate running balance per (itemCode + batchNumber + warehouseCode)
  const txnsWithCalcBalance = useMemo(() => {
    const sorted = [...txns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const whBalance: Record<string, number> = {};
    const result = sorted.map(t => {
      const key = `${t.itemCode}|${t.batchNumber}|${t.warehouseCode}`;
      whBalance[key] = (whBalance[key] || 0) + t.qtyIn - t.qtyOut;
      return { ...t, calcBalance: whBalance[key] };
    });
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [txns]);

  // Group stock by WH for LS24 view
  const stockByWH = useMemo(() => {
    const map: Record<string, StockEntry[]> = {};
    stock.forEach(s => {
      if (!map[s.warehouseCode]) map[s.warehouseCode] = [];
      map[s.warehouseCode].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [stock]);

  const stockTotal = stock.reduce((s, e) => s + e.quantity, 0);
  const stockUnit = stock[0]?.unit || '';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" /> Batch Number Transactions Report
        </h1>
        <p className="text-slate-500 text-sm mt-1">ประวัติการเคลื่อนไหวสินค้าตาม Batch Number</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-slate-600 font-medium text-sm">
          <Filter className="w-4 h-4" /> ค้นหาและกรอง
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Batch Number</label>
            <input value={filters.batch} onChange={e => setFilters({...filters, batch: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ค้นหา Batch No." />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">รหัส/ชื่อสินค้า</label>
            <input value={filters.item} onChange={e => setFilters({...filters, item: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Item Code หรือชื่อสินค้า" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">ประเภทรายการ</label>
            <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">ทั้งหมด</option>
              <option value="GRPO">GRPO — รับตาม PO</option>
              <option value="GR">GR — รับทั่วไป</option>
              <option value="GI">GI — จ่ายออก</option>
              <option value="PUTAWAY">PUTAWAY — จัด Location</option>
              <option value="TRANSFER">TRANSFER — โอนย้าย</option>
              <option value="ADJUSTMENT">ADJUSTMENT — ปรับยอด</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">คลังสินค้า</label>
            <select value={filters.wh} onChange={e => setFilters({...filters, wh: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">ทั้งหมด</option>
              {warehouses.map(w => <option key={w.code} value={w.code}>{w.code} — {w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Bin Location</label>
            <input value={filters.bin} onChange={e => setFilters({...filters, bin: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              placeholder="เช่น A1, ALA-1-1" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">วันที่จาก</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">วันที่ถึง</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={search} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition disabled:opacity-60">
            <Search className="w-4 h-4" /> {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
          </button>
          <button onClick={reset} className="px-5 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm transition">รีเซ็ต</button>
        </div>
      </div>

      {/* ── LS24-style Stock by Location ── */}
      {searched && stock.length > 0 && (
        <div className="mb-5">
          {/* Header bar */}
          <div className="bg-indigo-700 text-white rounded-t-xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="font-semibold text-sm">Stock Overview by Location (LS24)</span>
            </div>
            <span className="text-indigo-200 text-xs">{stock.length} รายการ / {stock[0]?.itemCode}</span>
          </div>

          {stockByWH.map(([wh, entries]) => {
            const whTotal = entries.reduce((s, e) => s + e.quantity, 0);
            return (
              <div key={wh} className="border-x border-slate-200 last:rounded-b-xl last:border-b overflow-hidden">
                {/* WH Header */}
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    คลัง: <span className="text-indigo-700">{wh}</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    รวม: <span className="text-slate-800 font-bold">{whTotal.toLocaleString()} {stockUnit}</span>
                  </span>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <div className="col-span-1 px-4 py-2 text-center">#</div>
                  <div className="col-span-2 px-4 py-2">Bin Location</div>
                  <div className="col-span-2 px-4 py-2">Item Code</div>
                  <div className="col-span-3 px-4 py-2">ชื่อสินค้า</div>
                  <div className="col-span-2 px-4 py-2">Batch / Lot</div>
                  <div className="col-span-1 px-4 py-2 text-right">จำนวน</div>
                  <div className="col-span-1 px-4 py-2 text-center">หน่วย</div>
                </div>

                {/* Rows */}
                {entries
                  .sort((a, b) => (a.binCode || '').localeCompare(b.binCode || ''))
                  .map((e, idx) => (
                    <div key={e.id}
                      className={`grid grid-cols-12 text-sm border-b border-slate-100 hover:bg-indigo-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <div className="col-span-1 px-4 py-2.5 text-center text-slate-400 text-xs">{idx + 1}</div>
                      <div className="col-span-2 px-4 py-2.5 font-mono text-xs font-semibold text-indigo-700">{e.binCode || '—'}</div>
                      <div className="col-span-2 px-4 py-2.5 font-mono text-xs text-blue-700 font-medium">{e.itemCode}</div>
                      <div className="col-span-3 px-4 py-2.5 text-slate-700 text-xs truncate">{e.itemName}</div>
                      <div className="col-span-2 px-4 py-2.5 font-mono text-xs text-slate-600">{e.batchNumber || '—'}</div>
                      <div className="col-span-1 px-4 py-2.5 text-right font-bold text-slate-800">{e.quantity.toLocaleString()}</div>
                      <div className="col-span-1 px-4 py-2.5 text-center text-slate-500 text-xs">{e.unit}</div>
                    </div>
                  ))}

                {/* WH Subtotal */}
                <div className="grid grid-cols-12 bg-indigo-50 border-b border-indigo-100 text-sm font-semibold">
                  <div className="col-span-10 px-4 py-2 text-right text-indigo-700 text-xs uppercase">รวม {wh}</div>
                  <div className="col-span-1 px-4 py-2 text-right text-indigo-800 font-bold">{whTotal.toLocaleString()}</div>
                  <div className="col-span-1 px-4 py-2 text-center text-indigo-600 text-xs">{stockUnit}</div>
                </div>
              </div>
            );
          })}

          {/* Grand Total */}
          <div className="bg-indigo-700 rounded-b-xl px-4 py-3 grid grid-cols-12 text-white">
            <div className="col-span-10 text-right text-sm font-semibold pr-2">ยอดรวมทั้งหมด (Grand Total)</div>
            <div className="col-span-1 text-right font-bold text-lg">{stockTotal.toLocaleString()}</div>
            <div className="col-span-1 text-center text-indigo-200 text-sm">{stockUnit}</div>
          </div>
        </div>
      )}

      {/* No stock found */}
      {searched && stock.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-10 mb-5">
          <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-sm">ไม่พบ Stock ปัจจุบันตามเงื่อนไข</p>
        </div>
      )}

      {/* ── Transaction History (collapsible) ── */}
      {searched && txns.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700">ประวัติรายการ Transaction ({txns.length} รายการ)</span>
              <div className="flex gap-3 ml-2">
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +{totalIn.toLocaleString()}
                </span>
                <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> -{totalOut.toLocaleString()}
                </span>
              </div>
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showHistory && (
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs">
                    <th className="px-4 py-3 text-left">ประเภท</th>
                    <th className="px-4 py-3 text-left">เลขที่เอกสาร</th>
                    <th className="px-4 py-3 text-left">วันที่</th>
                    <th className="px-4 py-3 text-left">Item Code</th>
                    <th className="px-4 py-3 text-left">ชื่อสินค้า</th>
                    <th className="px-4 py-3 text-left">Batch No.</th>
                    <th className="px-4 py-3 text-left">Exp. Date</th>
                    <th className="px-4 py-3 text-left">คลัง / Location</th>
                    <th className="px-4 py-3 text-right">รับเข้า</th>
                    <th className="px-4 py-3 text-right">จ่ายออก</th>
                    <th className="px-4 py-3 text-right">คงเหลือ/WH</th>
                    <th className="px-4 py-3 text-left">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {txnsWithCalcBalance.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLOR[t.transactionType] || 'bg-slate-100 text-slate-600'}`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.docNumber}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{t.docDate}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 text-xs">{t.itemCode}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{t.itemName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{t.batchNumber}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{t.expiryDate || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">{t.warehouseCode}</span>
                        {t.binCode && (
                          <span className="ml-1 font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{t.binCode}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{t.qtyIn > 0 ? `+${t.qtyIn}` : '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-500">{t.qtyOut > 0 ? `-${t.qtyOut}` : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-bold text-sm ${(t.calcBalance ?? 0) < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                          {(t.calcBalance ?? 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-indigo-500 mt-0.5">{t.warehouseCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{t.remark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>กรอกเงื่อนไขค้นหาแล้วกด &quot;ค้นหา&quot;</p>
          <p className="text-xs mt-1 opacity-60">แสดงผลแบบ Stock by Location (LS24)</p>
        </div>
      )}
    </div>
  );
}
