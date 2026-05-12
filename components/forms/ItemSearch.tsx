'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface Item { id: string; code: string; name: string; unit: string; category: string; }

interface Props {
  value: { code: string; name: string; unit: string };
  onChange: (item: { code: string; name: string; unit: string }) => void;
  placeholder?: string;
}

export default function ItemSearch({ value, onChange, placeholder = 'ค้นหา Item Code หรือชื่อสินค้า...' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleInput(q: string) {
    setQuery(q);
    if (!q) { setResults([]); setOpen(false); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      const data = await fetch(`/api/items?q=${encodeURIComponent(q)}`).then(r => r.json());
      setResults(data.slice(0, 15));
      setOpen(true);
      setLoading(false);
    }, 250);
  }

  function select(item: Item) {
    onChange({ code: item.code, name: item.name, unit: item.unit });
    setQuery('');
    setOpen(false);
  }

  function clear() {
    onChange({ code: '', name: '', unit: 'EA' });
    setQuery('');
    setResults([]);
  }

  const displayValue = value.code ? `${value.code} — ${value.name}` : '';

  return (
    <div ref={ref} className="relative">
      {displayValue ? (
        <div className="flex items-center gap-2 border border-blue-300 rounded-lg px-3 py-1.5 bg-blue-50 text-sm">
          <span className="flex-1 font-medium text-blue-800 truncate">{displayValue}</span>
          <button type="button" onClick={clear} className="text-blue-400 hover:text-blue-700 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => query && setOpen(true)}
            placeholder={placeholder}
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map(item => (
            <button key={item.id} type="button" onMouseDown={() => select(item)}
              className="w-full px-3 py-2.5 text-left hover:bg-blue-50 border-b border-slate-50 last:border-0 transition">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-blue-700 mt-0.5 flex-shrink-0">{item.code}</span>
                <div>
                  <p className="text-sm text-slate-700 leading-tight">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.category} · {item.unit}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 px-4 py-3 text-sm text-slate-400">
          ไม่พบสินค้าที่ตรงกัน
        </div>
      )}
    </div>
  );
}
