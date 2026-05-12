'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { GoodsIssue } from '@/lib/types';

export default function GIActions({ doc }: { doc: GoodsIssue }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(action: string) {
    setLoading(true);
    await fetch(`/api/gi/${doc.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {doc.status === 'picked' && (
        <button onClick={() => patch('confirm')} disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition disabled:opacity-60">
          <CheckCircle className="w-4 h-4" /> {loading ? '...' : 'Confirm & Post'}
        </button>
      )}
    </div>
  );
}
