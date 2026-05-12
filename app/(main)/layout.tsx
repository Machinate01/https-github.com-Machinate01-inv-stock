import { redirect } from 'next/navigation';
import { getSession } from '@/lib/utils/auth';
import Sidebar from '@/components/layout/Sidebar';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ name: session.name, role: session.role }} />
      {/* Desktop: ml-64 for fixed sidebar | Mobile: pt-14 for top header bar */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen bg-slate-100">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-4 lg:py-6">{children}</div>
      </main>
    </div>
  );
}
