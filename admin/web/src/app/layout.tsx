import type { Metadata } from 'next';
import './globals.css';
import { AdminShell } from '@/components/layout/AdminShell';

export const metadata: Metadata = {
  title: 'Barcelona Taxi Transfer — Admin Dashboard',
  description: 'Executive Operations Hub for Barcelona Taxi Transfer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
