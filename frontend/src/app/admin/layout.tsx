import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AdminShell } from '@/components/layout/AdminShell';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Barcelona Taxi Transfer — Admin Dashboard',
  description: 'Executive Operations Hub for Barcelona Taxi Transfer',
  manifest: '/admin-manifest.json',
  icons: {
    icon: [
      { url: '/icons/admin/favicon.ico' },
      { url: '/icons/admin/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/admin/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/admin/favicon.ico',
    apple: [
      { url: '/icons/admin/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/admin/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/admin/apple-touch-icon.png" />
        <link rel="manifest" href="/admin-manifest.json" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
