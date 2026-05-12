'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Search } from 'lucide-react';

interface Bin { id: string; binCode: string; warehouseCode: string; }
interface WH { code: string; name: string; }

export default function PutawayLineActions({
  putawayId, lineNum, warehouseCode, suggestedBin
}: { putawayId: string; lineNum: number; warehouseCode: string; suggestedBin?: string }) {
  const router = useRouter();
  const [wh, setWh] = useState(warehouseCode);
  const [bin, setBin] = useState(suggestedBin || '');
  const [allBins, setAllBins] = useState<Bin[]>([]);
  const [warehouses, setWarehouses] = useState<WH[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(suggestedBin || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/warehouses').then(r => r.json()).then(setWarehouses);
    loadBinsList(warehouseCode);
  }, [warehouseCode]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadBinsList(code: string) {
    const data: Bin[] = await fetch(`/api/warehouses?warehouse=${code}`).then(r => r.json());
    setAllBins(data);
  }

  async function changeWarehouse(code: string) {
    setWh(code);
    setBin('');
    setQuery('');
    await loadBinsList(code);
  }

  function handleQueryChange(val: string) {
    setQuery(val);
    setBin(val); // ใส่ค่าตรงๆ ด้วย ให้พิมพ์เองได้
    setShowSuggestions(true);
  }

  function selectBin(binCode: string) {
    setBin(binCode);
    setQuery(binCode);
    setShowSuggestions(false);
  }

  // Filter suggestions by query
  const filtered = query
    ? allBins.filter(b => b.binCode.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : allBins.slice(0, 10);

  async function handleConfirm() {
    const finalBin = bin.trim();
    if (!finalBin) return alert('กรุณาระบุ Bin Location');
    setLoading(true);
    const res = await fetch(`/api/putaway/${putawayId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_line', lineNum, actualBin: finalBin, warehouseCode: wh }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  const isNewBin = bin.trim() && !allBins.some(b => b.binCode === bin.trim());

  return (
    <div className="flex items-start gap-2 flex-wrap">
      {/* Warehouse */}
      <select
        value={wh}
        onChange={e => changeWarehouse(e.target.value)}
        className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        {warehouses.map(w => <option key={w.code} value={w.code}>{w.code}</option>)}
      </select>

      {/* Bin — searchable + type new */}
      <div ref={inputRef} className="relative">
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-purple-500 bg-white">
          <Search className="w-3.5 h-3.5 text-slate-400 ml-2 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="พิมพ์หรือเลือก Bin..."
            className="px-2 py-1.5 text-xs w-40 focus:outline-none"
          />
          {isNewBin && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 mr-1 rounded font-medium flex-shrink-0">ใหม่</span>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-52 max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-slate-400">
                {query ? (
                  <span>ไม่พบ Bin "<strong>{query}</strong>" — จะสร้างใหม่</span>
                ) : 'ไม่มี Bin ในคลังนี้'}
              </div>
            ) : (
              <>
                {filtered.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onMouseDown={() => selectBin(b.binCode)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 font-mono border-b border-slate-50 last:border-0"
                  >
                    {b.binCode}
                  </button>
                ))}
                {query && !allBins.some(b => b.binCode === query) && (
                  <button
                    type="button"
                    onMouseDown={() => selectBin(query)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 text-amber-700 font-medium border-t border-slate-100"
                  >
                    + ใช้ "{query}" (Bin ใหม่)
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={loading || !bin.trim()}
        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition disabled:opacity-50 flex-shrink-0"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        {loading ? 'กำลังบันทึก...' : 'บันทึก'}
      </button>
    </div>
  );
}
