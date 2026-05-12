'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPinOff, Search, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface StockEntry { id: string; itemCode: string; itemName: string; batchNumber: string; warehouseCode: string; binCode: string; quantity: number; unit: string; }
interface Bin { id: string; binCode: string; }
interface WH { code: string; name: string; }

function BinAssigner({ entry, warehouses, onDone }: { entry: StockEntry; warehouses: WH[]; onDone: () => void }) {
  const [wh, setWh] = useState(entry.warehouseCode);
  const [bin, setBin] = useState('');
  const [query, setQuery] = useState('');
  const [allBins, setAllBins] = useState<Bin[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function loadBins(code: string) {
    const data: Bin[] = await fetch(`/api/warehouses?warehouse=${code}`).then(r => r.json());
    setAllBins(data);
  }

  useEffect(() => {
    fetch(`/api/warehouses?warehouse=${entry.warehouseCode}`)
      .then(r => r.json())
      .then((data: Bin[]) => setAllBins(data));
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSugg(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [entry.warehouseCode]);

  function changeWh(code: string) {
    setWh(code); setBin(''); setQuery('');
    loadBins(code);
  }

  function handleQuery(val: string) {
    setQuery(val); setBin(val); setShowSugg(true);
  }

  function selectBin(b: string) {
    setBin(b); setQuery(b); setShowSugg(false);
  }

  async function save() {
    const finalBin = bin.trim();
    if (!finalBin) return alert('กรุณาระบุ Bin Location');
    setSaving(true);
    const res = await fetch(`/api/stock/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign_bin', binCode: finalBin, warehouseCode: wh }),
    });
    setSaving(false);
    if (res.ok) onDone();
  }

  const filtered = query
    ? allBins.filter(b => b.binCode.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : allBins.slice(0, 10);
  const isNew = bin.trim() && !allBins.some(b => b.binCode === bin.trim());

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Warehouse */}
      <select value={wh} onChange={e => changeWh(e.target.value)}
        className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500">
        {warehouses.map(w => <option key={w.code} value={w.code}>{w.code}</option>)}
      </select>

      {/* Bin search */}
      <div ref={ref} className="relative">
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-purple-500 bg-white">
          <Search className="w-3.5 h-3.5 text-slate-400 ml-2 flex-shrink-0" />
          <input type="text" value={query} onChange={e => handleQuery(e.target.value)}
            onFocus={() => setShowSugg(true)}
            placeholder="พิมพ์หรือเลือก Bin..."
            className="px-2 py-1.5 text-xs w-40 focus:outline-none" />
          {isNew && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 mr-1 rounded font-medium">ใหม่</span>}
        </div>
        {showSugg && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-52 max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400">
                {query ? `ไม่พบ "${query}" — จะใช้เป็น Bin ใหม่` : 'ไม่มี Bin ในคลังนี้'}
              </div>
            ) : (
              <>
                {filtered.map(b => (
                  <button key={b.id} type="button" onMouseDown={() => selectBin(b.binCode)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 font-mono border-b border-slate-50 last:border-0">
                    {b.binCode}
                  </button>
                ))}
                {query && !allBins.some(b => b.binCode === query) && (
                  <button type="button" onMouseDown={() => selectBin(query)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 text-amber-700 font-medium border-t border-slate-100">
                    + ใช้ &quot;{query}&quot; (Bin ใหม่)
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving || !bin.trim()}
        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition disabled:opacity-50">
        <CheckCircle className="w-3.5 h-3.5" />
        {saving ? 'กำลังบันทึก...' : 'กำหนด Location'}
      </button>
    </div>
  );
}

export default function UnlocatedStock() {
  const [items, setItems] = useState<StockEntry[]>([]);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stock').then(r => r.json()),
      fetch('/api/warehouses').then(r => r.json()),
    ]).then(([stock, whs]) => {
      setItems((stock as StockEntry[]).filter((s: StockEntry) => !s.binCode));
      setWarehouses(whs);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 hover:bg-amber-100 transition"
      >
        <div className="flex items-center gap-3">
          <MapPinOff className="w-5 h-5 text-amber-600" />
          <div className="text-left">
            <p className="font-semibold text-amber-800">สินค้ายังไม่มี Bin Location ({items.length} รายการ)</p>
            <p className="text-xs text-amber-600 mt-0.5">กำหนด Location เพื่อให้ระบบติดตาม Stock ได้ถูกต้อง</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
      </button>

      {open && (
        <div className="mt-2 bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {items.map(item => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 truncate">
                      <span className="font-mono text-xs text-blue-700 mr-2">{item.itemCode}</span>
                      {item.itemName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Batch: <span className="font-mono text-blue-600">{item.batchNumber || '-'}</span>
                      {' · '}{item.warehouseCode}
                      {' · '}คงเหลือ: <span className="font-semibold text-slate-700">{item.quantity} {item.unit}</span>
                    </p>
                  </div>
                  <BinAssigner
                    entry={item}
                    warehouses={warehouses}
                    onDone={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
