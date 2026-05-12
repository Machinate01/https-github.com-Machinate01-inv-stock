import { redirect } from 'next/navigation';
import { getSession } from '@/lib/utils/auth';
import Sidebar from '@/components/layout/Sidebar';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ name: session.name, role: session.role }} />
      <main className="flex-1 ml-64 min-h-screen bg-slate-100">
        <div className="max-w-screen-xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
