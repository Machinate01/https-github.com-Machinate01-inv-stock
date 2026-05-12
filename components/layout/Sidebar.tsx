'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileInput, PackagePlus, PackageMinus,
  MapPin, ClipboardList, BarChart3, Package, LogOut,
  ChevronRight, Menu, X
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Goods Receipt PO', href: '/grpo', icon: FileInput, badge: 'GRPO' },
  { label: 'Goods Receipt', href: '/gr', icon: PackagePlus, badge: 'GR' },
  { label: 'Goods Issue', href: '/gi', icon: PackageMinus, badge: 'GI' },
  { label: 'Putaway', href: '/putaway', icon: MapPin },
  { label: 'Pick List', href: '/pick-list', icon: ClipboardList },
  { label: 'Batch Report', href: '/batch-report', icon: BarChart3 },
];

export default function Sidebar({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.replace('/login');
  }

  const roleLabel: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการคลัง', staff: 'เจ้าหน้าที่', readonly: 'ดูข้อมูล'
  };

  const sidebarContent = (
    <aside className="w-64 bg-blue-900 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 rounded-xl p-2"><Package className="w-6 h-6" /></div>
          <div className="flex-1">
            <p className="font-bold text-sm leading-tight">Inventory Stock</p>
            <p className="text-blue-300 text-xs">Atlanta Medicare</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-blue-300 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium group
                ${active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-blue-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-blue-300">{roleLabel[user.role] || user.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 text-blue-300 hover:text-red-300 text-sm py-1.5 px-2 rounded-lg hover:bg-blue-800 transition">
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop: fixed sidebar ── */}
      <div className="hidden lg:block fixed top-0 left-0 h-full z-30 w-64">
        {sidebarContent}
      </div>

      {/* ── Mobile: top header bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-blue-900 text-white flex items-center px-4 py-3 gap-3 shadow-md">
        <button onClick={() => setOpen(true)} className="p-1 rounded text-blue-200 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="bg-blue-500 rounded-lg p-1.5"><Package className="w-4 h-4" /></div>
          <span className="font-bold text-sm">Inventory Stock</span>
        </div>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* ── Mobile: overlay backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <div className={`lg:hidden fixed top-0 left-0 h-full z-50 w-64 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>
    </>
  );
}
