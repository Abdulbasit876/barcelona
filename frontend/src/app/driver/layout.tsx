import type { Metadata, Viewport } from 'next';
import '../admin/globals.css';

export const metadata: Metadata = {
  title: 'Driver Portal — Barcelona Taxi Transfer',
  description: 'Mobile Driver Dispatch and Trip Management Portal',
  manifest: '/driver-manifest.json',
  icons: {
    icon: [
      { url: '/icons/driver/favicon.ico' },
      { url: '/icons/driver/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/driver/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/driver/favicon.ico',
    apple: [
      { url: '/icons/driver/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/driver/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/driver/apple-touch-icon.png" />
        <link rel="manifest" href="/driver-manifest.json" />
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased min-h-screen">
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-xl border-x border-slate-200">
          {children}
        </div>
      </body>
    </html>
  );
}
