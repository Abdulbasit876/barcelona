'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/components/layout/SidebarContext';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPlainPage = pathname === '/login' || pathname.startsWith('/driver');

  if (isPlainPage) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="flex-1 min-w-0 w-full overflow-y-auto overflow-x-hidden bg-slate-50 text-slate-900 flex flex-col">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
