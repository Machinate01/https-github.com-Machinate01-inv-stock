'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Search, TrendingUp, TrendingDown, Filter } from 'lucide-react';

interface Txn {
  id: string; transactionType: string; docNumber: string; docDate: string;
  itemCode: string; itemName: string; batchNumber: string; expiryDate?: string;
  warehouseCode: string; binCode: string; qtyIn: number; qtyOut: number;
  balanceQty: number; createdBy: string; createdAt: string; remark?: string;
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
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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
    const data = await fetch(`/api/batch-report?${q.toString()}`).then(r => r.json());
    setTxns(data);
    setLoading(false);
    setSearched(true);
  }

  function reset() {
    setFilters({ batch: '', item: '', type: '', wh: '', bin: '', dateFrom: '', dateTo: today });
    setTxns([]); setSearched(false);
  }

  const totalIn = txns.reduce((s, t) => s + t.qtyIn, 0);
  const totalOut = txns.reduce((s, t) => s + t.qtyOut, 0);

  // Recalculate running balance per (itemCode + batchNumber + warehouseCode)
  const txnsWithCalcBalance = (() => {
    const sorted = [...txns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const whBalance: Record<string, number> = {};
    const result = sorted.map(t => {
      const key = `${t.itemCode}|${t.batchNumber}|${t.warehouseCode}`;
      whBalance[key] = (whBalance[key] || 0) + t.qtyIn - t.qtyOut;
      return { ...t, calcBalance: whBalance[key] };
    });
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  })();

  // WH balance summary (last known balance per WH)
  const whSummary = (() => {
    const map: Record<string, number> = {};
    txnsWithCalcBalance.forEach(t => {
      const key = `${t.warehouseCode}`;
      if (!(key in map)) map[key] = t.calcBalance;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  })();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-indigo-600" /> Batch Number Transactions Report</h1>
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

      {/* Summary */}
      {searched && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 mb-1">รายการทั้งหมด</p>
              <p className="text-2xl font-bold text-slate-700">{txns.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" /> จำนวนรับเข้า</p>
              <p className="text-2xl font-bold text-green-600">+{totalIn.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500" /> จำนวนจ่ายออก</p>
              <p className="text-2xl font-bold text-red-600">-{totalOut.toLocaleString()}</p>
            </div>
          </div>

          {/* WH Balance summary */}
          {whSummary.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">คงเหลือปัจจุบันแยกตามคลัง (คำนวณจากรายการ)</p>
              <div className="flex flex-wrap gap-3">
                {whSummary.map(([wh, bal]) => (
                  <div key={wh} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${bal > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <span className="text-sm font-semibold text-slate-600">{wh}</span>
                    <span className={`text-lg font-bold ${bal > 0 ? 'text-green-700' : 'text-red-600'}`}>{bal.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-indigo-50 border-indigo-200">
                  <span className="text-sm font-semibold text-slate-600">รวมทั้งหมด</span>
                  <span className="text-lg font-bold text-indigo-700">
                    {whSummary.reduce((s, [, v]) => s + v, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Table */}
      {searched && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">ผลการค้นหา ({txns.length} รายการ)</h2>
          </div>
          {txns.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                    <th className="px-4 py-3 text-right">คงเหลือ / Location</th>
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
                      <td className="px-4 py-3 text-slate-500">{t.docDate}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{t.itemCode}</td>
                      <td className="px-4 py-3 text-slate-600">{t.itemName}</td>
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
                        <div className={`font-bold ${t.calcBalance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                          {t.calcBalance.toLocaleString()}
                        </div>
                        <div className="text-xs text-indigo-500 font-mono mt-0.5">{t.warehouseCode}</div>
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
        </div>
      )}
    </div>
  );
}
