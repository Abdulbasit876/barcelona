import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Driver Portal — Barcelona Taxi Transfer',
  description: 'Mobile Driver Dispatch and Trip Management Portal',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased min-h-screen">
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-xl border-x border-slate-200">
          {children}
        </div>
      </body>
    </html>
  );
}
