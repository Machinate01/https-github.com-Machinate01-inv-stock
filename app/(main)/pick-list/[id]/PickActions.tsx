'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function PickActions({ pickListId, lineNum, requiredQty }: { pickListId: string; lineNum: number; requiredQty: number }) {
  const router = useRouter();
  const [qty, setQty] = useState(requiredQty);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    await fetch(`/api/picklist/${pickListId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pick_line', lineNum, pickedQty: qty }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <input type="number" min="0" max={requiredQty} value={qty}
        onChange={e => setQty(+e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-24 text-center focus:outline-none focus:ring-2 focus:ring-rose-400" />
      <button onClick={confirm} disabled={loading}
        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-50">
        <CheckCircle className="w-4 h-4" /> {loading ? '...' : 'หยิบ'}
      </button>
    </div>
  );
}
