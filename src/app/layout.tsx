import type { Metadata } from 'next';
import './globals.css';
import { CrmLayout } from '@/components/CrmLayout';

export const metadata: Metadata = {
  title: 'HR MOTOR CRM — Dealership Mobil Bekas Garut',
  description: 'Sistem Manajemen Hubungan Pelanggan (CRM) Terpadu HR MOTOR Garut, Jawa Barat.',
  manifest: '/manifest.webmanifest?v=5',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png?v=5', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=5', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=5', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png?v=5', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HR MOTOR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased font-sans bg-[#F8F7F4] text-[#202020]">
        <CrmLayout>{children}</CrmLayout>
      </body>
    </html>
  );
}
