import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/customer/favicon.ico' },
      { url: '/icons/customer/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/customer/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/customer/favicon.ico',
    apple: [
      { url: '/icons/customer/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
