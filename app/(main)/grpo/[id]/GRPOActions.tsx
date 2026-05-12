'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle, Package } from 'lucide-react';
import { GRPO } from '@/lib/types';

export default function GRPOActions({ doc }: { doc: GRPO }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(action: string) {
    setLoading(true);
    await fetch(`/api/grpo/${doc.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {doc.status === 'draft' && (
        <button onClick={() => patch('confirm')} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition disabled:opacity-60">
          <CheckCircle className="w-4 h-4" /> {loading ? '...' : 'Confirm'}
        </button>
      )}
      {doc.status === 'putaway_pending' && (
        <button onClick={() => patch('complete_putaway')} disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition disabled:opacity-60">
          <Package className="w-4 h-4" /> {loading ? '...' : 'Complete Putaway'}
        </button>
      )}
    </div>
  );
}
